from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from  django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import  default_token_generator

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

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
