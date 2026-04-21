from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q


class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()

        try:
            user = User.objects.get(
                Q(username__iexact=username) |
                Q(email__iexact=username)
            )

            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            return None

        return None