from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = "user"

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),

    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),

    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('activate/<uidb64>/<token>/', views.VerifyEmailView.as_view(), name="activate")
]
