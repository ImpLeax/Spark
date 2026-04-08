from django.urls import path

from . import views

app_name = "user"

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/google/', views.GoogleAuthView.as_view(), name='google_auth'),
    path('logout/', views.LogoutAPIView.as_view(), name='logout'),
    path('delete/', views.AccountDeleteView.as_view(), name='account_delete'),
    path('password/change/', views.ChangePasswordView.as_view(), name='password_change'),
    path('password/reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('email/change/', views.EmailChangeRequestView.as_view(), name='email_change_request'),
    path('email/change/confirm/', views.EmailChangeConfirmView.as_view(), name='email_change_confirm'),
    path('token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('activate/<uidb64>/<token>/', views.VerifyEmailView.as_view(), name="activate"),

    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('genders/', views.GenderListView.as_view(), name='gender_list'),
    path('interests/', views.InterestListView.as_view(), name='interests_list'),
    path('intentions/', views.IntentionsListView.as_view(), name='intention_list'),

    path('profile/gallery/', views.GalleryManageView.as_view(), name='gallery_manage'),
    path('profile/gallery/<int:pk>/', views.GetGalleryView.as_view(), name='get_gallery'),
    path('profile/gallery/<int:pk>/', views.GalleryDeleteView.as_view(), name='gallery_delete'),
    path('profile/avatar/', views.AvatarView.as_view(), name='profile_avatar'),
    path('profile/settings/', views.SettingsManageView.as_view(), name='search_settings'),
    path('profile/interests/', views.UpdateInterestsView.as_view(), name='interests_update'),


]
