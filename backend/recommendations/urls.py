from django.urls import path
from . import views

app_name = 'recommendation'

urlpatterns = [
    path('list/', views.RecommendationListView.as_view(), name='list_recommendations'),
    path('swipe/', views.SwipeAPIView.as_view(), name='swipe'),

    path('like/given/', views.ILikedListView.as_view(), name='likes-given'),
    path('like/received/', views.LikedMeListView.as_view(), name='likes-received')
]