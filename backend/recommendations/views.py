from datetime import date
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from django.contrib.gis.measure import D
from rest_framework.response import Response
from django.contrib.gis.db.models.functions import Distance
from rest_framework.exceptions import NotFound

from user.models import Profile
from .models import Interactions
from .serializers import RecommendationSerializer, InteractionSerializer, LikeUserSerializer


class RecommendationListView(generics.ListAPIView):
    """A view class for GET - request. Send list of recommendations"""

    serializer_class = RecommendationSerializer
    permission_classes = (IsAuthenticated,)

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
        my_intention = profile.intention

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

        my_affinities = request_user.affinities.all()
        when_clauses = [
            When(profileinterest__interest_id=aff.interest_id, then=Value(aff.score))
            for aff in my_affinities
        ]

        if my_intention:
            intention_bonus = Case(
                When(intention=my_intention, then=Value(50)),
                default=Value(0),
                output_field=IntegerField()
            )
        else:
            intention_bonus = Value(0)

        candidates = candidates.annotate(
            relevance_score=Coalesce(
                Sum(
                    Case(
                        *when_clauses,
                        default=Value(50),
                        output_field=IntegerField()
                    )
                ),
                0
            ) + intention_bonus
        )

        order_fields = ['-relevance_score']

        if 'distance_to_me' in candidates.query.annotations:
            order_fields.append('distance_to_me')

        order_fields.append('-user__last_login')

        return candidates.order_by(*order_fields).select_related(
            'user', 'additional_info'
        ).distinct()[:10]


class SwipeAPIView(generics.CreateAPIView):
    """A view class for POST - request. Save interaction from user to another user"""

    serializer_class = InteractionSerializer
    permission_classes = (IsAuthenticated,)

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


class ILikedListView(generics.ListAPIView):
    """A view class for GET - request. Return list of person user liked"""

    serializer_class = LikeUserSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        request_user = self.request.user

        liked_user_ids = Interactions.objects.filter(
            sender=request_user,
            is_like=True
        ).values_list('receiver_id', flat=True)

        return Profile.objects.filter(user_id__in=liked_user_ids).select_related(
            'user', 'additional_info', 'intention').order_by('-user__date_joined')[:10]


class LikedMeListView(generics.ListAPIView):
    """A view class for GET - request. Return list of persons who liked user"""

    serializer_class = LikeUserSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        request_user = self.request.user
        my_location = request_user.profile.location

        interacted_user_ids = Interactions.objects.filter(
            sender=request_user
        ).values_list('receiver_id', flat=True)

        liked_me_ids = Interactions.objects.filter(
            receiver=request_user,
            is_like=True
        ).exclude(
            sender_id__in=interacted_user_ids
        ).values_list('sender_id', flat=True)

        queryset = Profile.objects.filter(user_id__in=liked_me_ids).select_related(
            'user', 'additional_info', 'intention'
        )

        if my_location:
            queryset = queryset.annotate(distance_to_me=Distance('location', my_location))

        return queryset.order_by('-user__date_joined')[:10]