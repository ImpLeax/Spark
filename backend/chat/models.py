from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

def user_chat_file_path(instance, filename):
    user_id = instance.sender.id
    return f'users/user_{user_id}/chat_files/{filename}'

class ChatRoom(models.Model):
    """A model of a chat room between two users."""

    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_user2')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"Chat: {self.user1.username} & {self.user2.username}"


class Message(models.Model):
    """Message model."""

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to=user_chat_file_path, blank=True, null=True)
    is_edited= models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.text[:20]}"