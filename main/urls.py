from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/search/', views.search_api, name='search_api'),
    path('api/login/', views.login_api, name='login_api'),
    path('api/logout/', views.logout_api, name='logout_api'),
    path('api/user-status/', views.user_status_api, name='user_status_api'),
    path('health', views.health_check, name='health_check'),
]
