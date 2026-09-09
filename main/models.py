from django.db import models
from django.contrib.auth.models import User

class Ticket(models.Model):
    """Support Ticket Model for User Feedback & Issue Reporting."""
    STATUS_CHOICES = [
        ('pending', 'بانتظار الرد'),
        ('in_progress', 'قيد المعالجة'),
        ('resolved', 'تم حل المشكلة'),
        ('closed', 'مغلقة'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    sender_name = models.CharField(max_length=150, default='زائر')
    sender_email = models.EmailField(blank=True, default='')
    title = models.CharField(max_length=200, verbose_name="عنوان التذكرة")
    description = models.TextField(verbose_name="وصف المشكلة")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_reply = models.TextField(blank=True, default='', verbose_name="رد الإدارة")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

class Reel(models.Model):
    """Short Video Reel Model for Pro Reels Platform."""
    title = models.CharField(max_length=200, verbose_name="عنوان الريلز")
    video_url = models.URLField(verbose_name="رابط الفيديو")
    thumbnail_url = models.URLField(blank=True, default='', verbose_name="رابط الصورة المصغرة")
    publisher = models.CharField(max_length=100, default='ء ريلز')
    likes_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=50, default='تكنولوجيا')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
