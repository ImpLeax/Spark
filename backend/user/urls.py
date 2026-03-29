from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = "user"

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('activate/<uidb64>/<token>/', views.VerifyEmailView.as_view(), name="activate"),

    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('genders/', views.GenderListView.as_view(), name='gender_list'),
    path('interests/', views.InterestListView.as_view(), name='interests_list'),
]
