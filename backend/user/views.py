import requests

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError, Throttled
from rest_framework.throttling import ScopedRateThrottle
from  django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from channels.layers import get_channel_layer
from django.core.cache import cache
from asgiref.sync import async_to_sync

from .serializers import UserRegistrationSerializer
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import  default_token_generator
from django.conf import settings
from django.core.mail import send_mail
from django.core import signing
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.translation import gettext as _

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    CustomTokenObtainPairSerializer, ProfileReadSerializer,
    GenderSerializer, InterestSerializer, IntentionSerializer,
    PhotoSerializer, AvatarUploadSerializer, GalleryAddSerializer,
    SettingsSerializer, ProfileUpdateSerializer, ProfileInterestsUpdateSerializer,
    AccountDeleteSerializer, ChangePasswordSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, EmailChangeRequestSerializer, EmailChangeConfirmSerializer,
    GoogleAuthSerializer, UserDetailSerializer
)
from .models import Gender, Interest, RelationshipIntention, Photo, Setting, Profile


class RegisterView(generics.CreateAPIView):
    """A view class for user registration."""

    throttle_classes = (ScopedRateThrottle, )
    throttle_scope = 'register_attempts'
    queryset = get_user_model().objects.all()
    permission_classes = (AllowAny, )
    serializer_class = UserRegistrationSerializer
    parser_classes = (MultiPartParser, FormParser)


class CustomTokenObtainPairView(TokenObtainPairView):
    """A modified view class for user login."""

    throttle_classes = (ScopedRateThrottle, )
    throttle_scope = 'login_attempts'
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh_token = response.data.get('refresh')

            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=60 * 60 * 24 * 7 * 2
            )

            del response.data['refresh']

        return response

class CustomTokenRefreshView(TokenRefreshView):
    """A view that refreshes the access token using the HttpOnly cookie."""

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response(
                {"detail": "backend_messages.invalid_token"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        data = request.data.copy()
        data['refresh'] = refresh_token

        serializer = self.get_serializer(data=data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)

        if 'refresh' in serializer.validated_data:
            response.set_cookie(
                key='refresh_token',
                value=serializer.validated_data['refresh'],
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=60 * 60 * 24 * 7 * 2
            )
            del response.data['refresh']

        return response

class LogoutAPIView(APIView):
    """A view class for user logout."""

    permission_classes = (IsAuthenticated, )

    def post(self, request):
        try:
            user_id = request.user.id

            cache_key = f"user_{user_id}_presence"
            cache.delete(cache_key)

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "global_presence",
                {
                    "type": "presence_change",
                    "user_id": user_id,
                    "status": False
                }
            )
            refresh_token = request.COOKIES.get('refresh_token')

            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            response = Response(
                {'message': 'backend_messages.logout_success'},
                status=status.HTTP_205_RESET_CONTENT
            )

            response.delete_cookie('refresh_token')
            return response

        except Exception as e:
            return Response(
                {'error': 'backend_messages.invalid_token'},
                status=status.HTTP_400_BAD_REQUEST
            )

class AccountDeleteView(generics.GenericAPIView):
    """A view class for delete user's account."""

    permission_classes = (IsAuthenticated, )
    serializer_class = AccountDeleteSerializer

    def delete(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        user.delete()

        return Response(
            {"message": "backend_messages.account_deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class ChangePasswordView(generics.GenericAPIView):
    """The view class for changing user's password."""

    throttle_classes = (ScopedRateThrottle, )
    throttle_scope = 'password_change'
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def put(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response(
            {"message": "backend_messages.password_changed"},
            status=status.HTTP_200_OK
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
                {'message': 'backend_messages.account_activated'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "backend_messages.link_expired"},
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


class PublicProfileView(generics.RetrieveAPIView):
    """A view class for retrieving another user's public profile."""

    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileReadSerializer

    queryset = Profile.objects.all()

    lookup_field = 'user_id'

class UserDetailView(generics.RetrieveAPIView):
    """View class for a user's username and email."""

    permission_classes = (IsAuthenticated, )
    serializer_class = UserDetailSerializer

    def get_object(self):
        return self.request.user

class GenderListView(generics.ListAPIView):
    """The view class for the list of genders."""

    queryset = Gender.objects.all()
    serializer_class = GenderSerializer
    permission_classes = (AllowAny, )
    pagination_class = None


class StandardResultsSetPagination(PageNumberPagination):
    """The paginator class for interests."""

    page_size = 10
    page_size_query_param = 'page_size'
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
            {"message": "backend_messages.gallery_added"},
            status=status.HTTP_201_CREATED
        )


class GetGalleryView(APIView):
    """A view class to get user's gallery."""

    permission_classes = (IsAuthenticated, )
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, pk, *args, **kwargs):
        photos = Photo.objects.filter(profile__user=pk)
        serializer = PhotoSerializer(photos, many=True, context={'request': request})
        return Response(serializer.data)

class GalleryDeleteView(generics.DestroyAPIView):
    """A view class for removing photos from the gallery."""

    permission_classes = (IsAuthenticated, )

    def get_queryset(self):
        return Photo.objects.filter(profile=self.request.user.profile)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        self.perform_destroy(instance)

        return Response(
            {'message': 'backend_messages.photo_deleted'},
            status=status.HTTP_200_OK
        )

    def perform_destroy(self, instance):
        profile = self.request.user.profile

        if profile.gallery.count() <= 2:
            raise ValidationError({
                "error": "backend_messages.min_photos_error"
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
            {'message': 'backend_messages.avatar_updated'},
            status=status.HTTP_200_OK
        )

    def delete(self, request, *args, **kwargs):
        profile = request.user.profile

        if profile.avatar:
            profile.avatar.delete(save=False)

            profile.avatar = None
            profile.save()

            return Response(
                {'message': 'backend_messages.avatar_deleted'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': "backend_messages.no_avatar"},
                status=status.HTTP_400_BAD_REQUEST
            )

class SettingsManageView(generics.RetrieveUpdateAPIView):
    """A view class for viewing and changing a user's search settings."""

    serializer_class = SettingsSerializer
    permission_classes = (IsAuthenticated, )

    def get_object(self):
        return self.request.user.profile.settings


class PasswordResetRequestView(generics.GenericAPIView):
    """A view class for retrieving a password reset request."""

    throttle_classes = (ScopedRateThrottle, )
    throttle_scope = 'password_reset'
    permission_classes = (AllowAny, )
    serializer_class = PasswordResetRequestSerializer

    def post(self, request, *args, **kwargs):
        User = get_user_model()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email=email).first()

        if user:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            frontend_url = settings.FRONTEND_URL + settings.RESET_PASSWORD_PATH
            reset_link = f"{frontend_url}?uid={uidb64}&token={token}"
            print(f'\nClear reset link: {reset_link}\n')

            context = {
                'action_url': reset_link,
            }

            html_message = render_to_string('user/emails/reset_password_email.html', context)
            plain_message = strip_tags(html_message)

            subject = _('Spark: Password Recovery')

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

        return Response(
            {"message": "backend_messages.reset_link_sent"},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(generics.GenericAPIView):
    """A view class for password reset confirm."""

    permission_classes = (AllowAny, )
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.context["user"]

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"message": "backend_messages.password_changed"},
            status=status.HTTP_200_OK
        )


class EmailChangeRequestView(generics.GenericAPIView):
    """View class for email change requests."""

    throttle_classes = []
    throttle_scope = 'email_change'
    permission_classes = (IsAuthenticated, )
    serializer_class = EmailChangeRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        new_email = serializer.validated_data['new_email']

        if new_email == user.email:
            return Response(
                {"message": "Email is the same"},
                status=status.HTTP_400_BAD_REQUEST
            )

        throttle = ScopedRateThrottle()

        if not throttle.allow_request(request, self):
            raise Throttled(wait=throttle.wait())


        payload = {
            'user_id': user.id,
            'new_email': new_email
        }

        token = signing.dumps(payload, salt='email-change')

        frontend_url = settings.FRONTEND_URL +  settings.CHANGE_EMAIL_PATH
        confirm_link = f"{frontend_url}?token={token}"

        print(f'\nClear confirm link: {confirm_link}\n')

        context = {
            "user": user,
            "confirmation_url": confirm_link
        }

        html_message = render_to_string('user/emails/change_email.html', context)

        send_mail(
            subject=_('Verifying a new email address in Spark'),
            message=f"You have requested a change of email address. To confirm, please click the link below:\n{confirm_link}\n\nIf this wasn't you, please ignore this email.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
            html_message=html_message,
            fail_silently=False,
        )

        return Response(
            {"message": "backend_messages.email_confirm_sent"},
            status=status.HTTP_200_OK
        )


class EmailChangeConfirmView(generics.GenericAPIView):
    """A view class for confirming email changes using a token."""

    permission_classes = (AllowAny, )
    serializer_class = EmailChangeConfirmSerializer

    def post(self, request, *args, **kwargs):
        User = get_user_model()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data['token']
        user_id = data['user_id']
        new_email = data['new_email']

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "backend_messages.user_not_found"}, status=status.HTTP_404_NOT_FOUND)

        if User.objects.filter(email=new_email).exists():
            return Response({"error": "backend_messages.email_in_use"}, status=status.HTTP_400_BAD_REQUEST)

        user.email = new_email
        user.save()

        return Response({"message": "backend_messages.email_updated"}, status=status.HTTP_200_OK)


class GoogleAuthView(generics.GenericAPIView):
    """A view class for logging in via a Google account."""

    throttle_classes = (ScopedRateThrottle, )
    throttle_scope = 'login_attempts'
    permission_classes = (AllowAny, )
    serializer_class = GoogleAuthSerializer

    def post(self, request, *args, **kwargs):
        User = get_user_model()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access_token = serializer.validated_data['access_token']

        google_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
        response = requests.get(google_url, params={'access_token': access_token})

        if not response.ok:
            return Response(
                {"error": "backend_messages.invalid_google_token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_data = response.json()
        email = user_data.get('email')
        first_name = user_data.get('given_name', '')
        last_name = user_data.get('family_name', '')

        user = User.objects.filter(email=email).first()

        if user:
            refresh = RefreshToken.for_user(user)

            response_data = {
                "status": "login",
                "message": "backend_messages.login_success",
                "access": str(refresh.access_token)
            }

            response = Response(response_data, status=status.HTTP_200_OK)

            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                samesite='Lax',
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
            )

            return response
        else:
            return Response({
                "status": "needs_registration",
                "message": "backend_messages.needs_registration",
                "google_data": {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name
                }
            }, status=status.HTTP_200_OK)