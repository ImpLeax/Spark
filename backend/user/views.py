from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from  django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import  default_token_generator

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    CustomTokenObtainPairSerializer, ProfileReadSerializer,
    GenderSerializer, InterestSerializer, IntentionSerializer,
    PhotoSerializer, AvatarUploadSerializer, GalleryAddSerializer,
    SettingsSerializer, ProfileUpdateSerializer, ProfileInterestsUpdateSerializer
)
from .models import Gender, Interest, RelationshipIntention, Photo, Setting


class RegisterView(generics.CreateAPIView):
    """A view class for user registration."""

    queryset = get_user_model().objects.all()
    permission_classes = (AllowAny, )
    serializer_class = UserRegistrationSerializer
    parser_classes = (MultiPartParser, FormParser)


class CustomTokenObtainPairView(TokenObtainPairView):
    """A modified view class for user login."""

    serializer_class = CustomTokenObtainPairSerializer


class LogoutAPIView(APIView):
    """A view class for user logout."""

    permission_classes = (IsAuthenticated, )

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)

            token.blacklist()

            return Response(
                {'message': 'Successful logout.'},
                status=status.HTTP_205_RESET_CONTENT
            )

        except Exception as e:
            return Response(
                {'error': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class VerifyEmailView(APIView):
    """A verification class to activate a user's account via email."""

    permission_classes = (AllowAny, )

    def get(self, request, uidb64, token):
        User = get_user_model()

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response(
                {'message': 'Your account has been successfully activated! You can now log in.'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "The link is invalid or has already been used."},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserProfileView(generics.RetrieveUpdateAPIView):
    """View class for a user profile."""

    permission_classes = (IsAuthenticated, )

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProfileUpdateSerializer
        return ProfileReadSerializer

    def get_object(self):
        return self.request.user.profile


class GenderListView(generics.ListAPIView):
    """The view class for the list of genders."""

    queryset = Gender.objects.all()
    serializer_class = GenderSerializer
    permission_classes = (AllowAny, )
    pagination_class = None


class StandardResultsSetPagination(PageNumberPagination):
    """The paginator class for interests."""

    page_size = 10
    page_size_query_param = 'page_size',
    max_page_size = 50


class InterestListView(generics.ListAPIView):
    """The view class for the list of interests."""

    queryset = Interest.objects.all().order_by('name')
    serializer_class = InterestSerializer
    permission_classes = (AllowAny, )
    pagination_class = StandardResultsSetPagination


class UpdateInterestsView(generics.UpdateAPIView):
    """The view class for update list of interests."""

    serializer_class = ProfileInterestsUpdateSerializer

    def get_object(self):
        return self.request.user.profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        full_profile = ProfileReadSerializer(instance)
        return Response(full_profile.data)


class IntentionsListView(generics.ListAPIView):
    """The view class for the list of intentions."""

    queryset = RelationshipIntention.objects.all()
    serializer_class = IntentionSerializer
    permission_classes = (AllowAny, )
    pagination_class = None


class GalleryManageView(APIView):
    """A view class for managing a user's gallery."""

    permission_classes = (IsAuthenticated, )
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, *args, **kwargs):
        photos = Photo.objects.filter(profile=request.user.profile)
        serializer = PhotoSerializer(photos, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = GalleryAddSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "The photos have been successfully added to the gallery."},
            status=status.HTTP_201_CREATED
        )


class GalleryDeleteView(generics.DestroyAPIView):
    """A view class for removing photos from the gallery."""

    permission_classes = (IsAuthenticated, )

    def get_queryset(self):
        return Photo.objects.filter(profile=self.request.user.profile)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        self.perform_destroy(instance)

        return Response(
            {'message': 'The photo has been successfully deleted.'},
            status=status.HTTP_200_OK
        )

    def perform_destroy(self, instance):
        profile = self.request.user.profile

        if profile.gallery.count() <= 2:
            raise ValidationError({
                "error": "The minimum number of photos is 2. "
                         "First, upload the new photo before deleting the old one."
            })

        instance.photo.delete(save=False)

        instance.delete()


class AvatarView(APIView):
    """A view class for uploading and deleting a user's avatar."""

    permission_classes = (IsAuthenticated, )
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request, *args, **kwargs):
        serializer = AvatarUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {'message': 'Your avatar has been successfully updated.'},
            status=status.HTTP_200_OK
        )

    def delete(self, request, *args, **kwargs):
        profile = request.user.profile

        if profile.avatar:
            profile.avatar.delete(save=False)

            profile.avatar = None
            profile.save()

            return Response(
                {'message': 'The avatar has been successfully deleted.'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': "You don't have an avatar set."},
                status=status.HTTP_400_BAD_REQUEST
            )

class SettingsManageView(generics.RetrieveUpdateAPIView):
    """A view class for viewing and changing a user's search settings."""

    serializer_class = SettingsSerializer
    permission_classes = (IsAuthenticated, )

    def get_object(self):
        return self.request.user.profile.settings