from tabnanny import check

from django.db import models
from django.db.models import Q, CheckConstraint
from django.contrib.postgres.fields import IntegerRangeField
from django.contrib.gis.db.models import PointField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.utils import timezone

#username validation
username_validator = RegexValidator(
    regex=r"^(?!.*__)[A-Za-z][A-Za-z0-9_]{2,19}$",
    message="Username must start with a letter, be 3–20 characters long, can include letters, numbers, and underscores, and cannot contain double underscores (__)."
)

#Additional functions for creating a photo path
def user_avatar_path(instance, filename):
    return f"users/user_{instance.id}/avatar/{filename}"

def user_photo_path(instance, filename):
    return f"users/user_{instance.profile.id}/photos/{filename}"


class CustomUserManager(BaseUserManager):
    """A custom class manager for working with User.objects."""

    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        if not email:
            raise ValueError('Email is required')

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """User model class"""

    username = models.CharField(
        max_length=128,
        unique=True,
        validators=[username_validator],
        verbose_name='Login',
    )
    email = models.EmailField(
        unique=True,
        verbose_name='Email',
    )

    is_active = models.BooleanField(default=False, verbose_name='Is Active')
    is_staff = models.BooleanField(default=False, verbose_name='Is Staff')

    date_joined = models.DateTimeField(default=timezone.now, db_index=True, verbose_name='Joined')
    last_active = models.DateTimeField(null=True, blank=True, db_index=True, verbose_name='Last Active')

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

class Info(models.Model):
    """Class of infrequently used information. (Optimization)."""

    profile = models.OneToOneField(
        to='Profile',
        on_delete=models.CASCADE,
        related_name='additional_info'
    )

    birth_date = models.DateField(
        verbose_name='Birthday',
        db_index=True
    )
    height = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Height',
        db_index=True
    )
    weight = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Weight',
        db_index=True
    )
    bio = models.TextField(
        blank=True,
        verbose_name='Bio',
    )
    education = models.TextField(
        blank=True,
        verbose_name='Education',
    )

class Gender(models.Model):
    """Gender model class."""

    name = models.CharField(
        max_length=50,
        verbose_name='Gender',
        unique=True
    )

    def __str__(self):
        return self.name

class Photo(models.Model):
    """Model class for the photo list."""

    profile = models.ForeignKey(
        to='Profile',
        on_delete=models.CASCADE,
        related_name='gallery'
    )
    photo = models.ImageField(
        upload_to=user_photo_path
    )

class Interest(models.Model):
    """Model class for interests"""

    name = models.CharField(
        max_length=100,
        unique=True
    )

    def __str__(self):
        return self.name

class RelationshipIntention(models.Model):
    """The class of relationship intention models."""

    name = models.CharField(
        max_length=255,
        unique=True
    )

    def __str__(self):
        return self.name

class Profile(models.Model):
    """Profile model class"""

    user = models.OneToOneField(
        to=User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    surname = models.CharField(
        max_length=255,
        db_index=True,
        verbose_name='Surname',
    )
    first_name = models.CharField(
        max_length=255,
        db_index=True,
        verbose_name='First Name',
    )
    last_name = models.CharField(
        max_length=255,
        db_index=True,
        verbose_name='Last Name',
    )

    gender = models.ForeignKey(
        to=Gender,
        on_delete=models.PROTECT,
        related_name='profiles_as_gender',
    )

    location = PointField(
        geography=True,
        blank=True,
        null=True,
        verbose_name="Location"
    )
    looking_for = models.ForeignKey(
        to=Gender,
        on_delete=models.PROTECT,
        related_name='profiles_looking_for'
    )

    intention = models.ForeignKey(
        to=RelationshipIntention,
        on_delete=models.PROTECT,
        related_name='profiles'
    )

    avatar = models.ImageField(
        upload_to=user_avatar_path,
        null=True,
        blank=True
    )

class ProfileInterest(models.Model):
    """Model class for the user's list of interests."""

    profile = models.ForeignKey(
        to=Profile,
        on_delete=models.CASCADE,
    )
    interest = models.ForeignKey(
        to=Interest,
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ('profile', 'interest')


class InterestAffinity(models.Model):
    """Model class for interest score"""

    user = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name='affinities'
    )
    interest = models.ForeignKey(
        to=Interest,
        on_delete=models.CASCADE
    )
    score = models.PositiveIntegerField(default=50)

    class Meta:
        unique_together = ('user', 'interest')


class Setting(models.Model):
    """Model class for the user's settings."""

    profile = models.OneToOneField(
        to=Profile,
        on_delete=models.CASCADE,
        related_name='settings'
    )

    search_distance = models.PositiveIntegerField(
        default=50,
        verbose_name='Search Distance (km)'
    )

    age_range = IntegerRangeField(
        default= (18, 51),
        verbose_name='Age Range',
    )

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(age_range__contained_by=(18, 101)),
                name='check_valid_age_range'
            )
        ]

    def __str__(self):
        name = getattr(self.profile, 'first_name', 'User')
        return f"Search settings for {self.profile.first_name}"