from rest_framework import serializers
from .models import ChatRoom, Message
from django.core.cache import cache

class MessageSerializer(serializers.ModelSerializer):
    is_mine = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender_id', 'text', 'file_url', 'is_read', 'created_at', 'is_mine']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.sender_id == request.user.id
        return False
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class ChatRoomListSerializer(serializers.ModelSerializer):
    partner = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'partner', 'last_message', 'unread_count', 'created_at']

    def get_partner(self, obj):
        request_user = self.context['request'].user

        partner_user = obj.user2 if obj.user1 == request_user else obj.user1

        connections = cache.get(f"user_{partner_user.id}_presence", 0)
        is_online = connections > 0

        try:
            profile = partner_user.profile
            return {
                "id": partner_user.id,
                "first_name": profile.first_name,
                "avatar": profile.avatar.url if profile.avatar else None,
                "is_online": is_online
            }
        except Exception:
            return {"id": partner_user.id, "first_name": "Unknown", "avatar": None, "is_online": is_online}

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            request_user = self.context['request'].user
            return {
                "text": last_msg.text,
                "created_at": last_msg.created_at,
                "is_read": last_msg.is_read,
                "is_mine": last_msg.sender_id == request_user.id
            }
        return None

    def get_unread_count(self, obj):
        request_user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=request_user).count()


