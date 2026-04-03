from django.urls import path
from . import views

app_name = 'recommendation'

urlpatterns = [
    path('list/', views.RecommendationListView.as_view(), name='list_recommendations'),
    path('swipe/', views.SwipeAPIView.as_view(), name='swipe'),
]