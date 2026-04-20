from django.urls import path
from . import views

app_name = "chat"

urlpatterns = [
    path('', views.ChatListView.as_view(), name='chat-list'),

    path('<int:room_id>/messages/', views.ChatMessageListView.as_view(), name='chat-messages-list'),
    path('<int:room_id>/upload/', views.MessageUploadView.as_view(), name='chat-upload'),
]
