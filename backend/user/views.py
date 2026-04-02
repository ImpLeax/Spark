import requests

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from rest_framework.throttling import ScopedRateThrottle
from  django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import  default_token_generator
from django.conf import settings
from django.core.mail import send_mail
from django.core import signing

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    CustomTokenObtainPairSerializer, ProfileReadSerializer,
    GenderSerializer, InterestSerializer, IntentionSerializer,
    PhotoSerializer, AvatarUploadSerializer, GalleryAddSerializer,
    SettingsSerializer, ProfileUpdateSerializer, ProfileInterestsUpdateSerializer,
    AccountDeleteSerializer, ChangePasswordSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, EmailChangeRequestSerializer, EmailChangeConfirmSerializer,
    GoogleAuthSerializer
)
from .models import Gender, Interest, RelationshipIntention, Photo, Setting


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
            {"message": "Your account and all associated data have been successfully deleted."},
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
            {"message": "Your password has been successfully changed."},
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

            send_mail(
                subject='Password Recovery in Spark',
                message=f'To reset your password, click the link below:\n{reset_link}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {"message": "If this email address is registered, we have sent password reset instructions to it."},
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
            {"message": "Your password has been successfully changed. You can now log in."},
            status=status.HTTP_200_OK
        )


class EmailChangeRequestView(generics.GenericAPIView):
    """View class for email change requests."""

    throttle_classes = (ScopedRateThrottle, )
    throttle_scope = 'email_change'
    permission_classes = (IsAuthenticated, )
    serializer_class = EmailChangeRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        new_email = serializer.validated_data['new_email']

        payload = {
            'user_id': user.id,
            'new_email': new_email
        }

        token = signing.dumps(payload, salt='email-change')

        frontend_url = settings.FRONTEND_URL +  settings.CHANGE_EMAIL_PATH
        confirm_link = f"{frontend_url}?token={token}"

        print(f'\nClear confirm link: {confirm_link}\n')

        send_mail(
            subject='Verifying a new email address in Spark',
            message=f"You have requested a change of email address. To confirm, please click the link below:\n{confirm_link}\n\nIf this wasn't you, please ignore this email.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
            fail_silently=False,
        )

        return Response(
            {"message": "An email containing a confirmation link has been sent to your new address."},
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
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if User.objects.filter(email=new_email).exists():
            return Response({"error": "This email address is already taken."}, status=status.HTTP_400_BAD_REQUEST)

        user.email = new_email
        user.save()

        return Response({"message": "Your email address has been successfully updated."}, status=status.HTTP_200_OK)


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
                {"error": "Invalid Google token. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_data = response.json()
        email = user_data.get('email')
        first_name = user_data.get('given_name', '')
        last_name = user_data.get('family_name', '')

        user = User.objects.filter(email=email).first()

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "status": "login",
                "message": "Login successful.",
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "status": "needs_registration",
                "message": "Account not found. Please complete registration.",
                "google_data": {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name
                }
            }, status=status.HTTP_200_OK)