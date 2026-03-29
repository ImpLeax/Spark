from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from  django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import  default_token_generator

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer, ProfileReadSerializer, GenderSerializer, InterestSerializer
from .models import Gender, Interest

class RegisterView(generics.CreateAPIView):
    """A view class for user registration."""

    queryset = get_user_model().objects.all()
    permission_classes = (AllowAny, )
    serializer_class = UserRegistrationSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """A modified view class for user login."""

    serializer_class = CustomTokenObtainPairSerializer


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


class UserProfileView(generics.RetrieveAPIView):
    """View class for a user profile."""

    serializer_class = ProfileReadSerializer
    permission_classes = (IsAuthenticated, )

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