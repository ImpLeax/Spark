from django.shortcuts import render
from datetime import date
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from django.contrib.gis.measure import D
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.contrib.gis.db.models.functions import Distance
from rest_framework.exceptions import NotFound

from user.models import Profile, ProfileInterest
from .models import Interactions
from .serializers import RecommendationSerializer, InteractionSerializer


class RecommendationPagination(PageNumberPagination):
    """Pagination class for recommendation list"""

    page_size = 10
    page_size_query_param = 'size'
    max_page_size = 20


class RecommendationListView(generics.ListAPIView):
    """A view class for GET - request. Send list of recommendations"""

    serializer_class = RecommendationSerializer
    permission_classes = (IsAuthenticated, )
    pagination_class = RecommendationPagination

    def get_queryset(self):
        request_user = self.request.user

        try:
            profile = Profile.objects.select_related('additional_info').get(user=request_user)
        except Profile.DoesNotExist:
            raise NotFound("Profile not found.")

        setting = getattr(profile, 'settings', None)

        location = profile.location
        user_birth_date = profile.additional_info.birth_date
        user_age = date.today().year - user_birth_date.year

        swiped_users_ids = Interactions.objects.filter(sender=request_user).values_list('receiver_id', flat=True)

        candidates = Profile.objects.exclude(user=request_user).exclude(user_id__in=swiped_users_ids)

        if profile.looking_for:
            candidates = candidates.filter(gender=profile.looking_for)

        if setting:
            if setting.age_range:
                today = date.today()
                start_date = date(today.year - setting.age_range.upper, today.month, today.day)
                end_date = date(today.year - setting.age_range.lower, today.month, today.day)

                candidates = candidates.filter(
                    additional_info__birth_date__range=(start_date, end_date)
                )

            candidates = candidates.filter(
                user__profile__settings__age_range__contains=user_age
            )

            if location and setting.search_distance:
                candidates = candidates.filter(
                    location__distance_lte=(location, D(km=setting.search_distance))
                ).annotate(
                    distance_to_me=Distance('location', location)
                )

        user_interest_ids = ProfileInterest.objects.filter(
            profile=profile
        ).values_list('interest_id', flat=True)

        candidates = candidates.annotate(
            relevance_score=Coalesce(
                Sum(
                    Case(
                        When(profileinterest__interest_id__in=user_interest_ids, then=Value(10)),
                        default=Value(0),
                        output_field=IntegerField()
                    )
                ),
                0
            )
        )

        order_fields = ['-relevance_score']

        if 'distance_to_me' in candidates.query.annotations:
            order_fields.append('distance_to_me')

        order_fields.append('-user__last_login')

        return candidates.order_by(*order_fields).select_related(
            'user', 'additional_info'
        ).distinct()


class SwipeAPIView(generics.CreateAPIView):
    """A view class for POST - request. Save interaction from user to another user"""

    serializer_class = InteractionSerializer
    permission_classes = (IsAuthenticated, )

    def perform_create(self, serializer):
        interaction = serializer.save(sender=self.request.user)

        is_match = False
        if interaction.is_like:
            is_match = Interactions.objects.filter(
                sender=interaction.receiver,
                receiver=self.request.user,
                is_like=True
            ).exists()

        self.match_status = is_match

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)

        response_data = serializer.data
        response_data['is_match'] = self.match_status

        return Response(response_data, status=status.HTTP_201_CREATED)