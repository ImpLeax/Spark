from django.contrib import admin
from django.urls import path

from . import views

app_name = "user"

urlpatterns = [
    path('user/', views.TestAPI.as_view()),
]
