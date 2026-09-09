from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from main.models import Reel, Ticket

class Command(BaseCommand):
    help = 'Initialize database with admin superuser and sample data.'

    def handle(self, *args, **kwargs):
        # 1. Admin Superuser Setup
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'bodihan88@gmail.com', 'Admin123456!')
            self.stdout.write(self.style.SUCCESS("Superuser 'admin' created."))
        else:
            u = User.objects.get(username='admin')
            u.set_password('Admin123456!')
            u.save()
            self.stdout.write(self.style.SUCCESS("Superuser 'admin' password updated."))

        # 2. Sample Reels Setup
        if Reel.objects.count() == 0:
            Reel.objects.create(
                title='تطوير واجهات المستخدم المستقبلية 🚀 | ريلز ء',
                video_url='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                thumbnail_url='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
                publisher='ء تكنولوجيا',
                likes_count=1420,
                views_count=15800,
                category='تكنولوجيا'
            )
            Reel.objects.create(
                title='كيف تنشر موقعك على Fly.io في 3 دقائق ⚡',
                video_url='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                thumbnail_url='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
                publisher='ء ديف',
                likes_count=980,
                views_count=11200,
                category='برمجة'
            )
            Reel.objects.create(
                title='تصميم الأنيميشن والزجاجيات المودرن ✨',
                video_url='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                thumbnail_url='https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600',
                publisher='ء ديزاين',
                likes_count=2300,
                views_count=28400,
                category='تصميم'
            )
            Reel.objects.create(
                title='نصائح تسريع تطبيقات البايثون والديجانجو 🐍',
                video_url='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyflights.mp4',
                thumbnail_url='https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
                publisher='ء أكاديمي',
                likes_count=3100,
                views_count=42000,
                category='برمجة'
            )
            self.stdout.write(self.style.SUCCESS("Sample Reels created."))

        # 3. Sample Tickets Setup
        if Ticket.objects.count() == 0:
            Ticket.objects.create(
                sender_name='أحمد علي',
                sender_email='ahmed@example.com',
                title='استفسار عن رفع فيديوهات الريلز',
                description='كيف يمكنني رفع فيديو ريلز جديد بحجم كبير على المنصة؟',
                status='resolved',
                admin_reply='أهلاً بك أحمد! تم تفعيل المعالجة التلقائية للفيديوهات بحجم يصل إلى 50 ميجابايت.'
            )
            Ticket.objects.create(
                sender_name='سارة خالد',
                sender_email='sara@example.com',
                title='مشكلة في حفظ كلمة المرور',
                description='هل يمكن إضافة خاصية استعادة كلمة المرور عبر البريد؟',
                status='pending',
                admin_reply=''
            )
            self.stdout.write(self.style.SUCCESS("Sample Tickets created."))
