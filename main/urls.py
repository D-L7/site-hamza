from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/search/', views.search_api, name='search_api'),
    path('api/reels/', views.reels_api, name='reels_api'),
    path('api/reels/<int:reel_id>/like/', views.reel_like_api, name='reel_like_api'),
    path('api/tickets/', views.tickets_list_api, name='tickets_list_api'),
    path('api/tickets/create/', views.ticket_create_api, name='ticket_create_api'),
    path('api/tickets/reply/', views.ticket_reply_api, name='ticket_reply_api'),
    path('api/admin/users/create/', views.admin_create_user_api, name='admin_create_user_api'),
    path('api/login/', views.login_api, name='login_api'),
    path('api/logout/', views.logout_api, name='logout_api'),
    path('api/user-status/', views.user_status_api, name='user_status_api'),
    path('health', views.health_check, name='health_check'),
]
