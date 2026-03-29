from datetime import date
from django.utils.encoding import force_bytes
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import RegexValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, AuthUser
from rest_framework_simplejwt.tokens import Token
from django.contrib.auth.tokens import  default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.conf import settings

from .models import Profile, Info, Gender, Interest, ProfileInterest


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
    gender = serializers.PrimaryKeyRelatedField(
        queryset=Gender.objects.all(),
        write_only=True,
        source='gender_obj'
    )
    looking_for = serializers.PrimaryKeyRelatedField(
        queryset=Gender.objects.all(),
        write_only=True,
        source='looking_for_obj'
    )

    birth_date = serializers.DateField(write_only=True)

    interests = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Interest.objects.all()),
        write_only=True,
        min_length=2,
        error_messages={'min_length': 'Please select at least 2 interests.'}
    )

    class Meta:
        model = get_user_model()
        fields = [
            'username', 'email', 'password', 'first_name',
            'last_name', 'surname', 'location', 'gender',
            'looking_for', 'birth_date', 'interests'
        ]

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))

        return value

    def validate_birth_date(self, value):
        today = date.today()

        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))

        if age < 18:
            raise serializers.ValidationError("Registration is limited to individuals who are at least 18 years old.")

        if value > today:
            raise serializers.ValidationError("A date of birth cannot be in the future.")

        return value

    @transaction.atomic
    def create(self, validated_data):
        User = get_user_model()

        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        surname = validated_data.pop('surname')
        location = validated_data.pop('location')
        gender = validated_data.pop('gender_obj')
        looking_for = validated_data.pop('looking_for_obj')

        birth_date = validated_data.pop('birth_date')
        interests_list = validated_data.pop('interests')

        user = User.objects.create_user(**validated_data)

        info = Info.objects.create(
            birth_date=birth_date
        )

        profile = Profile.objects.create(
            user=user,
            additional_info=info,
            first_name=first_name,
            last_name=last_name,
            surname=surname,
            location=location,
            gender=gender,
            looking_for=looking_for
        )

        ProfileInterest.objects.bulk_create([
            ProfileInterest(profile=profile, interest=interest)
            for interest in interests_list
        ])

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

class InfoSerializer(serializers.ModelSerializer):
    """The Serializer class for additional information about the profile."""

    class Meta:
        model = Info
        fields = ['birth_date', 'height', 'weight', 'bio', 'education']


class ProfileReadSerializer(serializers.ModelSerializer):
    """The serializer class for the user profile."""

    additional_info = InfoSerializer(read_only=True)

    gender = serializers.StringRelatedField()
    looking_for = serializers.StringRelatedField()

    interests = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'first_name', 'last_name', 'surname',
            'location', 'gender', 'looking_for',
            'avatar', 'additional_info', 'interests'
        ]

    def get_interests(self, obj):
        return [pi.interest.name for pi in obj.profileinterest_set.all()]

class GenderSerializer(serializers.ModelSerializer):
    """The serializer class for genders."""

    class Meta:
        model = Gender
        fields = ['id', 'name']

class InterestSerializer(serializers.ModelSerializer):
    """The serializer class for interests."""

    class Meta:
        model = Interest
        fields = ['id', 'name']