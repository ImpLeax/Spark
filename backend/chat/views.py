from rest_framework.pagination import CursorPagination
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import ChatRoom, Message
from django.db.models import Q, Max
from .serializers import ChatRoomListSerializer
import os

class MessageCursorPagination(CursorPagination):
    page_size = 30
    ordering = '-created_at'
    cursor_query_param = 'cursor'

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Message, ChatRoom
from .serializers import MessageSerializer

class ChatMessageListView(generics.ListAPIView):
    """A view class for retrieving chat messages."""

    serializer_class = MessageSerializer
    pagination_class = MessageCursorPagination
    permission_classes = (IsAuthenticated, )

    def get_queryset(self):
        room_id = self.kwargs.get('room_id')
        user = self.request.user

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise PermissionDenied("Chat room does not exist.")

        if room.user1 != user and room.user2 != user:
            raise PermissionDenied("You do not have permission to view this chat.")

        return Message.objects.filter(room_id=room_id)


class ChatListView(generics.ListAPIView):
    """A view class for retrieving chats."""

    serializer_class = ChatRoomListSerializer
    permission_classes = (IsAuthenticated, )

    def get_queryset(self):
        user = self.request.user

        return ChatRoom.objects.filter(
            Q(user1=user) | Q(user2=user)
        ).annotate(
            last_msg_time=Max('messages__created_at')
        ).order_by(
            '-last_msg_time', '-created_at'
        ).select_related(
            'user1__profile', 'user2__profile'
        )
    
class MessageUploadView(APIView):
    """A view class for uploading files/images to a chat via HTTP POST."""
    permission_classes = (IsAuthenticated, )
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
            user = request.user

            if room.user1 != user and room.user2 != user:
                raise PermissionDenied("You do not have permission to send files to this chat.")
            
            text = request.data.get('message', '')
            files = request.FILES.getlist('files')

            if not text and not files:
                return Response({'error': 'Message or file is required'}, status=400)
            
            MAX_SIZE_MB = 10
            ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.docx', 'doc']
        
            for f in files:
                if f.size > MAX_SIZE_MB * 1024 * 1024:
                    return Response({
                        'error': f'Файл {f.name} занадто великий. Максимум {MAX_SIZE_MB} МБ.'
                    }, status=400)

                ext = os.path.splitext(f.name)[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    return Response({
                        'error': f'Формат файлу {ext} не підтримується.'
                    }, status=400)
                
            channel_layer = get_channel_layer()
            receiver_id = room.user2.id if room.user1.id == user.id else room.user1.id

            def broadcast_message(msg):
                async_to_sync(channel_layer.group_send)(
                    f"chat_{room_id}",
                    {
                        'type': 'chat_message',
                        'message': msg.text,
                        'file_url': msg.file.url if msg.file else None,
                        'sender_id': user.id,
                        'msg_id': msg.id,
                        'is_read': False
                    }
                )
                async_to_sync(channel_layer.group_send)(
                    f"user_{receiver_id}_notifications",
                    {
                        'type': 'new_message_notification',
                        'chat_id': room.id,
                        'message': msg.text if msg.text else "📎 File",
                        'sender_id': user.id,
                        'created_at': msg.created_at.isoformat()
                    }
                )

            if text:
                msg_text = Message.objects.create(room=room, sender=user, text=text)
                broadcast_message(msg_text)

            for file in files:
                msg_file = Message.objects.create(room=room, sender=user, file=file)
                broadcast_message(msg_file)

            return Response({'status': 'success'}, status=201)
            
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found'}, status=404)
        