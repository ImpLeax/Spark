from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from recommendations.models import Match
from .models import ChatRoom

"""Create a chat when a match starts."""
@receiver(post_save, sender=Match)
def create_chat_room_for_new_match(sender, instance, created, **kwargs):
    if created:
        chat_room, chat_created = ChatRoom.objects.get_or_create(
            user1_id=instance.user_1_id,
            user2_id=instance.user_2_id
        )

        channel_layer = get_channel_layer()

        def send_match_notification(receiver_id, partner):
            avatar_url = partner.profile.avatar.url if partner.profile.avatar else None

            async_to_sync(channel_layer.group_send)(
                f"user_{receiver_id}_notifications",
                {
                    'type': 'new_match_notification',
                    'chat_data': {
                        'id': chat_room.id,
                        'partner': {
                            'id': partner.id,
                            'first_name': partner.profile.first_name,
                            'avatar': avatar_url,
                            'is_online': True
                        },
                        'last_message': None,
                        'unread_count': 1,
                        'created_at': chat_room.created_at.isoformat()
                    }
                }
            )

        send_match_notification(instance.user_2_id, instance.user_1)

        send_match_notification(instance.user_1_id, instance.user_2)