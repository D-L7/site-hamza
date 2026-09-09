from django.contrib import admin
from .models import Ticket, Reel

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'sender_name', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'description', 'sender_name')
    list_editable = ('status',)

@admin.register(Reel)
class ReelAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'publisher', 'likes_count', 'views_count', 'category', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'publisher')
