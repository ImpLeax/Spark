from django.db.models.signals import post_save
from django.dispatch import receiver
from recommendations.models import Match
from .models import ChatRoom

"""Create a chat when a match starts."""
@receiver(post_save, sender=Match)
def create_chat_room_for_new_match(sender, instance, created, **kwargs):
    if created:
        ChatRoom.objects.get_or_create(
            user1_id=instance.user_1_id,
            user2_id=instance.user_2_id
        )