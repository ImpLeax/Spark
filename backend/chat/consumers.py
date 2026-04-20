import json
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.base import ContentFile

User = get_user_model()


class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.cache_key = f"user_{self.user.id}_presence"
        connections = cache.get(self.cache_key, 0)
        cache.set(self.cache_key, connections + 1, timeout=None)

        self.personal_group = f"user_{self.user.id}_notifications"
        await self.channel_layer.group_add(self.personal_group, self.channel_name)

        await self.channel_layer.group_add("global_presence", self.channel_name)
        await self.accept()

        if connections == 0:
            await self.channel_layer.group_send("global_presence", {
                "type": "presence_change", "user_id": self.user.id, "status": True
            })

    async def disconnect(self, close_code):
        if not hasattr(self, 'user') or self.user.is_anonymous:
            return

        if hasattr(self, 'personal_group'):
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)

        connections = cache.get(self.cache_key, 1) - 1
        if connections <= 0:
            cache.delete(self.cache_key)
            await self.channel_layer.group_send("global_presence", {
                "type": "presence_change", "user_id": self.user.id, "status": False
            })
        else:
            cache.set(self.cache_key, connections, timeout=None)

        await self.channel_layer.group_discard("global_presence", self.channel_name)

    async def presence_change(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence",
            "user_id": event["user_id"],
            "status": event["status"]
        }))

    async def new_message_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "notification",
            "chat_id": event["chat_id"],
            "message": event["message"],
            "sender_id": event["sender_id"],
            "created_at": event["created_at"]
        }))


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        has_access = await self.can_access_room(self.room_id, self.user.id)

        if not has_access:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        action = text_data_json.get("action", "send_message")

        if action == "send_message":
            message_text = text_data_json.get("message", "")
            sender_id = self.user.id

            saved_message = await self.save_message(sender_id, self.room_id, message_text)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_text,
                    'file_url': None,
                    'sender_id': sender_id,
                    'msg_id': saved_message.id,
                    'is_read': False
                }
            )
            receiver_id = await self.get_receiver_id(self.room_id, sender_id)
            await self.channel_layer.group_send(
                f"user_{receiver_id}_notifications",
                {
                    'type': 'new_message_notification',
                    'chat_id': int(self.room_id),
                    'message': message_text,
                    'sender_id': sender_id,
                    'created_at': saved_message.created_at.isoformat()
                }
            )
        elif action == "mark_as_read":
            await self.mark_messages_as_read(self.room_id, self.user.id)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'messages_read_event',
                    'reader_id': self.user.id
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'action': 'new_message',
            'message': event['message'],
            'file_url': event.get('file_url'),
            'sender_id': event['sender_id'],
            'msg_id': event['msg_id'],
            'is_read': event['is_read']
        }))

    async def messages_read_event(self, event):
        await self.send(text_data=json.dumps({
            'action': 'messages_read',
            'reader_id': event['reader_id']
        }))


    @database_sync_to_async
    def save_message(self, sender_id, room_id, text, file_data=None, file_name=None):
        room = ChatRoom.objects.get(id=room_id)
        sender = User.objects.get(id=sender_id)
        return Message.objects.create(room=room, sender=sender, text=text)

    @database_sync_to_async
    def can_access_room(self, room_id, user_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
            return room.user1_id == user_id or room.user2_id == user_id
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_messages_as_read(self, room_id, current_user_id):
        Message.objects.filter(
            room_id=room_id,
            is_read=False
        ).exclude(
            sender_id=current_user_id
        ).update(is_read=True)

    @database_sync_to_async
    def get_receiver_id(self, room_id, sender_id):
        room = ChatRoom.objects.get(id=room_id)
        return room.user2.id if room.user1.id == sender_id else room.user1.id