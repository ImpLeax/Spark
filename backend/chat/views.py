from rest_framework.pagination import CursorPagination
from django.db.models import Q, Max
from .serializers import ChatRoomListSerializer

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