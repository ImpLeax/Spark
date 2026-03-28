from django.utils.encoding import force_bytes
from rest_framework import serializers
from django.db import transaction
from  django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, AuthUser
from rest_framework_simplejwt.tokens import Token
from django.contrib.auth.tokens import  default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.conf import settings

from .models import Profile, Info, Gender

class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer class."""

    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    first_name = serializers.CharField(
        write_only=True
    )
    last_name = serializers.CharField(
        write_only=True
    )
    surname = serializers.CharField(
        write_only=True
    )
    location = serializers.CharField(
        write_only=True
    )
    gender = serializers.IntegerField(
        write_only=True
    )
    looking_for = serializers.IntegerField(
        write_only=True
    )

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'surname', 'location', 'gender', 'looking_for']

    @transaction.atomic
    def create(self, validated_data):
        User = get_user_model()

        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        surname = validated_data.pop('surname')
        location = validated_data.pop('location')
        gender = validated_data.pop('gender')
        looking_for = validated_data.pop('looking_for')

        user = User.objects.create_user(**validated_data)

        info = Info.objects.create()

        Profile.objects.create(
            user=user,
            additional_info=info,
            first_name=first_name,
            last_name=last_name,
            surname=surname,
            location=location,
            gender=Gender.objects.get(pk=gender),
            looking_for=Gender.objects.get(pk=looking_for)
        )

        #The email account activation process

        uid = urlsafe_base64_encode(force_bytes(user.pk))

        token = default_token_generator.make_token(user)

        activation_link = f"http://127.0.0.1:8000/api/v1/user/activate/{uid}/{token}/"


        print(f"\n\nClear activation link: {activation_link}\n\n")

        send_mail(
            subject="Spark account activation",
            message=f"Hi, {first_name}! Click the link below to activate your account:\n{activation_link}",
            from_email="noreply@spark.com",
            recipient_list=[user.email],
        )

        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """A modified serializer class for logging in via a JWT token."""

    @classmethod
    def get_token(cls, user):

        token = super().get_token(user)

        token['username'] = user.username
        token['email'] = user.get_email_field_name()

        if hasattr(user, 'profile'):
            token['profile_id'] = user.profile.id
            token['first_name'] = user.profile.first_name
            token['last_name'] = user.profile.last_name

        return token