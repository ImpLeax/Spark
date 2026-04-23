from rest_framework.pagination import CursorPagination
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models import Q
from django.db.models.functions import Greatest
from django.contrib.postgres.search import TrigramSimilarity
from .serializers import ChatRoomListSerializer
from recommendations.models import Interactions, Match
import os

class MessageCursorPagination(CursorPagination):
    page_size = 30
    ordering = '-created_at'
    cursor_query_param = 'cursor'

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
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
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user

        qs = ChatRoom.objects.filter(Q(user1=user) | Q(user2=user))
        search_query = self.request.query_params.get('search', '').strip()

        if search_query:
            if len(search_query) <= 3:
                qs = qs.filter(
                    Q(user1__profile__first_name__icontains=search_query) |
                    Q(user2__profile__first_name__icontains=search_query)
                )
            else:
                qs = qs.annotate(
                    similarity=Greatest(
                        TrigramSimilarity('user1__profile__first_name', search_query),
                        TrigramSimilarity('user2__profile__first_name', search_query)
                    )
                ).filter(
                    similarity__gt=0.3
                ).order_by('-similarity')
        else:
            qs = qs.order_by('-created_at')

        return qs


class MessageUploadView(APIView):
    """A view class for uploading files/images to a chat via HTTP POST."""

    permission_classes = (IsAuthenticated,)
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
                        'error': f'The file {f.name} is too large. The maximum size is {MAX_SIZE_MB} MB.'
                    }, status=400)
                ext = os.path.splitext(f.name)[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    return Response({
                        'error': f'The {ext} file format is not supported.'
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
                        'message': msg.text if msg.text else None,
                        'file_url': msg.file.url if msg.file else None,
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

class MessageDetailView(APIView):
    """View to retrieve, edit, or delete an existing message."""

    permission_classes = (IsAuthenticated, )

    def get_object(self, message_id, user):
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            raise NotFound("Message not found.")

        if message.sender != user:
            raise PermissionDenied("You can only modify your own messages.")

        return message

    def patch(self, request, message_id):
        message = self.get_object(message_id, request.user)

        new_text = request.data.get('text', '').strip()
        if not new_text:
            return Response({"error": "Message text cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        message.text = new_text
        message.is_edited = True
        message.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{message.room.id}",
            {
                'type': 'message_edited_event',
                'msg_id': message.id,
                'text': message.text,
            }
        )

        return Response({"status": "success", "message": "Message updated."}, status=status.HTTP_200_OK)

    def delete(self, request, message_id):
        message = self.get_object(message_id, request.user)

        room_id = message.room.id
        msg_id = message.id

        message.delete()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{room_id}",
            {
                'type': 'message_deleted_event',
                'msg_id': msg_id,
            }
        )

        return Response({"status": "success", "message": "Message deleted."}, status=status.HTTP_204_NO_CONTENT)


class ChatDeleteView(APIView):
    """View to handle chat deletion, unmatching, and unliking."""

    permission_classes = (IsAuthenticated, )

    def delete(self, request, room_id):
        user = request.user

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat not found."}, status=status.HTTP_404_NOT_FOUND)

        if room.user1 != user and room.user2 != user:
            raise PermissionDenied("You do not have permission to delete this chat.")

        partner = room.user2 if room.user1 == user else room.user1

        Interactions.objects.filter(sender=user, receiver=partner).update(is_like=False)

        Match.objects.filter(
            Q(user_1=user, user_2=partner) | Q(user_1=partner, user_2=user)
        ).delete()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{partner.id}_notifications",
            {
                'type': 'chat_deleted_notification',
                'chat_id': room.id
            }
        )

        room.delete()

        return Response({"message": "Chat successfully deleted."}, status=status.HTTP_204_NO_CONTENT)