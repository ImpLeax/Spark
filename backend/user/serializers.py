from datetime import date
from django.utils.encoding import force_bytes, force_str
from rest_framework import serializers
from django.db import transaction
from django.contrib.gis.geos import Point
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import RegexValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, AuthUser
from rest_framework_simplejwt.tokens import Token
from django.contrib.auth.tokens import  default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from django.core import signing
from psycopg2.extras import NumericRange

from .models import Profile, Info, Gender, Interest, ProfileInterest, RelationshipIntention, Photo, Setting


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
    longitude = serializers.FloatField(
        write_only=True
    )
    latitude = serializers.FloatField(
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
        max_length=100,
        error_messages={
            'min_length': 'Please select at least 2 interests.',
            'max_length': 'You have selected the maximum number of interests (100).'
        }
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
            'last_name', 'surname', 'longitude', 'latitude', 'gender',
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

    def validate_interests(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("The list of interests contains duplicates.")

        return value

    @transaction.atomic
    def create(self, validated_data):
        User = get_user_model()

        photos = validated_data.pop('photos')

        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        surname = validated_data.pop('surname')
        longitude = validated_data.pop('longitude')
        latitude = validated_data.pop('latitude')
        gender = validated_data.pop('gender_obj')
        looking_for = validated_data.pop('looking_for_obj')
        intention = validated_data.pop('intention_obj')

        birth_date = validated_data.pop('birth_date')
        interests_list = validated_data.pop('interests')

        location = Point(x=longitude, y=latitude, srid=4326)
        user = User.objects.create_user(**validated_data)

        profile = Profile.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            surname=surname,
            location=location,
            gender=gender,
            looking_for=looking_for,
            intention=intention
        )

        info = Info.objects.create(
            profile=profile,
            birth_date=birth_date
        )

        Setting.objects.create(
            profile=profile
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

        activation_link = settings.FRONTEND_URL + f"activate/{uid}/{token}/"


        print(f"\n\nClear activation link: {activation_link}\n\n")

        send_mail(
            subject="Spark account activation",
            message=f"Hi, {first_name}! Click the link below to activate your account:\n{activation_link}",
            from_email="noreply@spark.com",
            recipient_list=[user.email],
        )

        return user


class ChangePasswordSerializer(serializers.Serializer):
    """The Serializer class for changing user's password."""

    old_password = serializers.CharField(required=True, write_only=True)

    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError("The old password was entered incorrectly.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password_confirm": "The new passwords do not match."}
            )
        return attrs

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
        fields = ['profile', 'birth_date', 'height', 'weight', 'bio', 'education']


class IntentionSerializer(serializers.ModelSerializer):
    """The serializer class for intentions."""

    class Meta:
        model = RelationshipIntention
        fields = ['id', 'name']


class ProfileReadSerializer(serializers.ModelSerializer):
    """The serializer class for view the user profile."""

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
        return [{'id': pi.interest.id, 'name': pi.interest.name} for pi in obj.profileinterest_set.all()]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """The serializer class for modify the user profile."""

    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)

    gender_id = serializers.PrimaryKeyRelatedField(
        queryset=Gender.objects.all(), source='gender', required=False
    )
    looking_for_id = serializers.PrimaryKeyRelatedField(
        queryset=Gender.objects.all(), source='looking_for', required=False
    )
    intention_id = serializers.PrimaryKeyRelatedField(
        queryset=RelationshipIntention.objects.all(), source='intention', required=False
    )

    height = serializers.IntegerField(required=False, min_value=100, max_value=250, allow_null=True)
    weight = serializers.IntegerField(required=False, min_value=30, max_value=300, allow_null=True)
    bio = serializers.CharField(required=False, max_length=500, allow_blank=True, allow_null=True)
    education = serializers.CharField(required=False, max_length=100, allow_blank=True, allow_null=True)

    class Meta:
        model = Profile
        fields = [
            'first_name', 'last_name', 'surname',
            'latitude', 'longitude',
            'gender_id', 'looking_for_id', 'intention_id',
            'height', 'weight', 'bio', 'education'
        ]

    def update(self, instance, validated_data):
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)

        if latitude is not None and longitude is not None:
            instance.location = Point(x=longitude, y=latitude, srid=4326)

        try:
            info_obj = instance.additional_info
        except instance.__class__.additional_info.RelatedObjectDoesNotExist:
            raise serializers.ValidationError(
                {"profile": "Critical error: The profile is corrupted; the date of birth is missing."}
            )

        info_fields = ['height', 'weight', 'bio', 'education']
        info_updated = False

        for field in info_fields:
            if field in validated_data:
                setattr(info_obj, field, validated_data.pop(field))
                info_updated = True

        if info_updated:
            info_obj.save()

        return super().update(instance, validated_data)


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

class ProfileInterestsUpdateSerializer(serializers.Serializer):
    """The serializer class for update and delete interests."""

    interest_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Interest.objects.all()),
        min_length=2,
        max_length=100,
        error_messages={
            'min_length': 'Select at least 2 interests.',
            'max_length': 'You can select up to 100 interests.'
        }
    )

    def validate_interest_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("The list of interests contains duplicates.")
        return value

    def update(self, instance, validated_data):
        interests = validated_data.get('interest_ids', [])

        ProfileInterest.objects.filter(profile=instance).delete()

        new_links = [
            ProfileInterest(profile=instance, interest=interest)
            for interest in interests
        ]

        ProfileInterest.objects.bulk_create(new_links)

        return instance


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


class SettingsSerializer(serializers.ModelSerializer):
    """The serializer class for user search settings."""

    min_age = serializers.IntegerField(
        min_value=18,
        max_value=100,
        write_only=True,
        required=False
    )
    max_age = serializers.IntegerField(
        min_value=18,
        max_value=100,
        write_only=True,
        required=False
    )

    age_range = serializers.SerializerMethodField(
        read_only=True
    )

    class Meta:
        model = Setting
        fields = ['search_distance', 'age_range', 'min_age', 'max_age']

    def get_age_range(self, obj):
        return {
            "min": obj.age_range.lower,
            "max": obj.age_range.upper - 1 if obj.age_range.upper else 100
        }

    def update(self, instance, validated_data):
        min_age = validated_data.pop('min_age', None)
        max_age = validated_data.pop('max_age', None)

        if min_age is not None or max_age is not None:
            current_min = instance.age_range.lower
            current_max = instance.age_range.upper - 1

            new_min = min_age if min_age is not None else current_min
            new_max = max_age if max_age is not None else current_max

            if new_min > new_max:
                raise serializers.ValidationError({
                    'min_age': 'The minimum age cannot be greater than the maximum age.'
                })

            instance.age_range = NumericRange(new_min, new_max + 1)

        return super().update(instance, validated_data)

class AccountDeleteSerializer(serializers.Serializer):
    """The serializer class for delete user's account."""

    password = serializers.CharField(
        write_only=True,
        required=True
    )

    def validate_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password. Deletion canceled.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """A serializer class for retrieving a password reset request."""

    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    """A serializer class for password reset confirm."""

    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(
        write_only=True
    )
    uidb64 = serializers.CharField(
        write_only=True
    )
    token = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):
        User = get_user_model()

        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password_confirm": "The passwords do not match."}
            )

        try:
            uid = force_str(urlsafe_base64_decode(attrs['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError(
                {"uidb64": "Invalid user ID."}
            )

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({"token": "The token is invalid or has expired."})

        self.context['user'] = user
        return attrs


class EmailChangeRequestSerializer(serializers.Serializer):
    """A serializer class for email change."""

    new_email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value

    def validate_new_email(self, value):
        User = get_user_model()

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already in use.")

        if value == self.context['request'].user.email:
            raise serializers.ValidationError("This is your current email address.")
        return value


class EmailChangeConfirmSerializer(serializers.Serializer):
    """A serializer class for email change confirm."""

    token = serializers.CharField(required=True)

    def validate_token(self, value):
        try:
            data = signing.loads(value, salt='email-change', max_age=86400)
            return data
        except signing.SignatureExpired:
            raise serializers.ValidationError("The link has expired. Please try again.")
        except signing.BadSignature:
            raise serializers.ValidationError("Invalid link.")


class GoogleAuthSerializer(serializers.Serializer):
    """A serializer class for logging in via a Google account."""

    access_token = serializers.CharField(required=True)