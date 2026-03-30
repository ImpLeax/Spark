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

from .models import Profile, Info, Gender, Interest, ProfileInterest, RelationshipIntention, Photo


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
    intention = serializers.PrimaryKeyRelatedField(
        queryset=RelationshipIntention.objects.all(),
        write_only=True,
        source='intention_obj'
    )

    birth_date = serializers.DateField(write_only=True)

    interests = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Interest.objects.all()),
        write_only=True,
        min_length=2,
        error_messages={'min_length': 'Please select at least 2 interests.'}
    )

    photos = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False),
        write_only=True,
        min_length=2,
        max_length=4,
        error_messages={
            'min_length': 'Please upload at least 2 photos.',
            'max_length': 'You can upload up to 4 photos.',
        }
    )

    class Meta:
        model = get_user_model()
        fields = [
            'username', 'email', 'password', 'first_name',
            'last_name', 'surname', 'location', 'gender',
            'looking_for', 'intention', 'birth_date', 'interests',
            'photos'
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

        photos = validated_data.pop('photos')

        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        surname = validated_data.pop('surname')
        location = validated_data.pop('location')
        gender = validated_data.pop('gender_obj')
        looking_for = validated_data.pop('looking_for_obj')
        intention = validated_data.pop('intention_obj')

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
            looking_for=looking_for,
            intention=intention
        )

        ProfileInterest.objects.bulk_create([
            ProfileInterest(profile=profile, interest=interest)
            for interest in interests_list
        ])

        Photo.objects.bulk_create([
            Photo(profile=profile, photo=image)
            for image in photos
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


class IntentionSerializer(serializers.ModelSerializer):
    """The serializer class for intentions."""

    class Meta:
        model = RelationshipIntention
        fields = ['id', 'name']


class ProfileReadSerializer(serializers.ModelSerializer):
    """The serializer class for the user profile."""

    additional_info = InfoSerializer(read_only=True)

    gender = serializers.StringRelatedField()
    looking_for = serializers.StringRelatedField()
    intention = IntentionSerializer(read_only=True)

    interests = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'avatar', 'first_name', 'last_name', 'surname',
            'location', 'gender', 'looking_for', 'intention',
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


class PhotoSerializer(serializers.ModelSerializer):
    """The serializer class for user photos."""

    class Meta:
        model = Photo
        fields = ['id', 'photo']


class GalleryAddSerializer(serializers.Serializer):
    """A serializer for uploading photos to the gallery"""

    photos = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False),
        write_only=True
    )

    def validate_photos(self, value):
        profile = self.context['request'].user.profile
        current_count = profile.gallery.count()
        new_count = len(value)

        if current_count + new_count > 4:
            allowed_to_add = 4 - current_count
            raise DjangoValidationError(
                f"Limit of 4 photos. You already have {current_count}. "
                f"You can add up to {allowed_to_add}."
            )
        return value

    def create(self, validated_data):
        profile = self.context['request'].user.profile
        photos_data = validated_data.pop('photos')

        new_photos = Photo.objects.bulk_create([
            Photo(profile=profile, photo=image)
            for image in photos_data
        ])

        return new_photos

class AvatarUploadSerializer(serializers.Serializer):
    """The serializer class for upload user avatar."""

    avatar = serializers.ImageField(
        allow_empty_file=False,
        write_only=True
    )

    def create(self, validated_data):
        profile = self.context['request'].user.profile

        avatar = validated_data.pop('avatar')

        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = avatar
        profile.save()

        return profile