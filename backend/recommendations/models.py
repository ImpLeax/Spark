from django.db import models
from user.models import User
from django.utils import timezone
from chat.models import ChatRoom


class Interactions(models.Model):
    """Model class for interactions between users"""

    sender = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name='sent_interactions',
    )

    receiver = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name='received_interactions'
    )

    is_like = models.BooleanField(
        default=False,
        verbose_name = "Is_like",
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        verbose_name='Created'
    )


class Match(models.Model):
    """Class for couple Matches"""
    
    user_1 = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name='matches_as_user1'
    )

    user_2 = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name='matches_as_user2'
    )

    chat = models.ForeignKey(
        to=ChatRoom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
