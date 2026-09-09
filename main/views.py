from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Ticket, Reel
import json

# Sample searchable database
SEARCH_DATABASE = [
    {
        "id": 1,
        "title": "منصة ء الرقمية - الدليل الشامل",
        "category": "مستندات",
        "category_slug": "docs",
        "description": "دليل الاستخدام الكامل لجميع الخدمات والأدوات المتاحة في منصة ء ريلز.",
        "icon": "bi-book",
        "date": "2026-09-01",
        "tags": ["دليل", "تعليمات", "بدء"]
    },
    {
        "id": 2,
        "title": "منصة ريلزات الفيديوهات القصيرة",
        "category": "أدوات",
        "category_slug": "tools",
        "description": "استعراض الريلزات الفورية والتفاعلية بتأثيرات بصرية عالية الجودة.",
        "icon": "bi-camera-reels-fill",
        "date": "2026-09-05",
        "tags": ["ريلز", "فيديو", "تفاعل"]
    },
    {
        "id": 3,
        "title": "نظام تذاكر الدعم الفني والمتابعة",
        "category": "خدمات",
        "category_slug": "services",
        "description": "تقديم البلاغات والاستفسارات ومتابعة حالة التذكرة مباشرة من الإدارة.",
        "icon": "bi-ticket-detailed-fill",
        "date": "2026-09-09",
        "tags": ["دعم", "تذاكر", "مساعدة"]
    },
    {
        "id": 4,
        "title": "إدارة حسابات المستخدمين بواسطة الأدمن",
        "category": "خدمات",
        "category_slug": "services",
        "description": "لوحة تحكم تفاعلية تمكن الأدمن من إنشاء وإدارة حسابات المستخدمين الجدد.",
        "icon": "bi-person-plus-fill",
        "date": "2026-09-09",
        "tags": ["مستخدمين", "أدمن", "إدارة"]
    }
]

@ensure_csrf_cookie
def index(request):
    """Render the single-page Reels & Support platform 'ء'."""
    try:
        reels_count = Reel.objects.count()
    except Exception:
        reels_count = 0

    try:
        tickets_count = Ticket.objects.count()
    except Exception:
        tickets_count = 0

    return render(request, 'index.html', {
        'site_name': 'ء ريلز',
        'reels_count': reels_count,
        'tickets_count': tickets_count,
        'user': request.user
    })


def search_api(request):
    """API endpoint returning search results in JSON format."""
    query = request.GET.get('q', '').strip().lower()
    category = request.GET.get('category', 'all')

    results = []
    for item in SEARCH_DATABASE:
        if category != 'all' and item['category_slug'] != category:
            continue

        if query:
            match_title = query in item['title'].lower()
            match_desc = query in item['description'].lower()
            match_tags = any(query in tag.lower() for tag in item['tags'])
            if not (match_title or match_desc or match_tags):
                continue

        results.append(item)

    return JsonResponse({
        'status': 'success',
        'query': query,
        'category': category,
        'count': len(results),
        'results': results
    })

def reels_api(request):
    """API endpoint returning Reels feed."""
    reels = Reel.objects.all()
    data = []
    for r in reels:
        data.append({
            'id': r.id,
            'title': r.title,
            'video_url': r.video_url,
            'thumbnail_url': r.thumbnail_url,
            'publisher': r.publisher,
            'likes_count': r.likes_count,
            'views_count': r.views_count,
            'category': r.category,
            'created_at': r.created_at.strftime('%Y-%m-%d')
        })
    return JsonResponse({'status': 'success', 'count': len(data), 'reels': data})

def reel_like_api(request, reel_id):
    """API endpoint to like a Reel."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'طريقة الطلب غير مدعومة'}, status=405)
    try:
        reel = Reel.objects.get(id=reel_id)
        reel.likes_count += 1
        reel.save()
        return JsonResponse({'status': 'success', 'likes_count': reel.likes_count})
    except Reel.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'الريلز غير موجود'}, status=404)

def tickets_list_api(request):
    """API endpoint for listing tickets."""
    if request.user.is_authenticated and request.user.is_superuser:
        tickets = Ticket.objects.all()
    elif request.user.is_authenticated:
        tickets = Ticket.objects.filter(user=request.user)
    else:
        tickets = Ticket.objects.all()[:10]  # Public recent tickets list

    data = []
    for t in tickets:
        data.append({
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'sender_name': t.sender_name,
            'status': t.status,
            'status_display': t.get_status_display(),
            'admin_reply': t.admin_reply,
            'created_at': t.created_at.strftime('%Y-%m-%d %H:%M')
        })

    return JsonResponse({'status': 'success', 'count': len(data), 'tickets': data})

def ticket_create_api(request):
    """API endpoint for creating support tickets."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'طريقة غير مدعومة'}, status=405)
    try:
        data = json.loads(request.body)
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        sender_name = data.get('sender_name', '').strip() or (request.user.username if request.user.is_authenticated else 'زائر')
        sender_email = data.get('sender_email', '').strip() or (request.user.email if request.user.is_authenticated else '')

        if not title or not description:
            return JsonResponse({'status': 'error', 'message': 'يرجى ملء عنوان التذكرة وتفاصيل المشكلة'}, status=400)

        ticket = Ticket.objects.create(
            user=request.user if request.user.is_authenticated else None,
            sender_name=sender_name,
            sender_email=sender_email,
            title=title,
            description=description,
            status='pending'
        )

        return JsonResponse({
            'status': 'success',
            'message': 'تم إرسال تذكرة الدعم بنجاح! سيتم مراجعتها من قبل الإدارة.',
            'ticket': {
                'id': ticket.id,
                'title': ticket.title,
                'status': ticket.status,
                'status_display': ticket.get_status_display(),
                'created_at': ticket.created_at.strftime('%Y-%m-%d %H:%M')
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

def ticket_reply_api(request):
    """API endpoint for admin to reply and update ticket status."""
    if not (request.user.is_authenticated and request.user.is_superuser):
        return JsonResponse({'status': 'error', 'message': 'غير مصرح لك بالإجابة على التذاكر (يتطلب صلاحية أدمن)'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'طريقة غير مدعومة'}, status=405)

    try:
        data = json.loads(request.body)
        ticket_id = data.get('ticket_id')
        new_status = data.get('status', 'resolved')
        admin_reply = data.get('admin_reply', '').strip()

        ticket = Ticket.objects.get(id=ticket_id)
        if new_status:
            ticket.status = new_status
        if admin_reply:
            ticket.admin_reply = admin_reply

        ticket.save()

        return JsonResponse({
            'status': 'success',
            'message': 'تم تحديث حالة التذكرة وإرسال الرد بنجاح!',
            'ticket': {
                'id': ticket.id,
                'status': ticket.status,
                'status_display': ticket.get_status_display(),
                'admin_reply': ticket.admin_reply
            }
        })
    except Ticket.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'التذكرة غير موجودة'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

def admin_create_user_api(request):
    """API endpoint for Admin to create new user accounts."""
    if not (request.user.is_authenticated and request.user.is_superuser):
        return JsonResponse({'status': 'error', 'message': 'غير مصرح! هذه الخاصية مخصصة للأدمن فقط.'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'طريقة غير مدعومة'}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        email = data.get('email', '').strip()
        is_admin = data.get('is_admin', False)

        if not username or not password:
            return JsonResponse({'status': 'error', 'message': 'يرجى إدخال اسم المستخدم وكلمة المرور'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'status': 'error', 'message': 'اسم المستخدم موجود بالفعل، اختر اسماً آخر'}, status=400)

        if is_admin:
            user = User.objects.create_superuser(username=username, email=email, password=password)
        else:
            user = User.objects.create_user(username=username, email=email, password=password)

        return JsonResponse({
            'status': 'success',
            'message': f"تم إنشاء الحساب بنجاح للمستخدم: '{username}'",
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

def login_api(request):
    """API endpoint for logging in users."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'طريقة الطلب غير مدعومة'}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({
                'status': 'success',
                'message': 'تم تسجيل الدخول بنجاح',
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'is_superuser': user.is_superuser
                }
            })
        else:
            return JsonResponse({'status': 'error', 'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

def logout_api(request):
    """API endpoint for logging out users."""
    logout(request)
    return JsonResponse({'status': 'success', 'message': 'تم تسجيل الخروج بنجاح'})

def user_status_api(request):
    """Returns the current authentication status of the user."""
    if request.user.is_authenticated:
        return JsonResponse({
            'is_authenticated': True,
            'username': request.user.username,
            'email': request.user.email,
            'is_superuser': request.user.is_superuser
        })
    return JsonResponse({'is_authenticated': False})

def health_check(request):
    """Health check endpoint for Fly.io deployment."""
    return JsonResponse({'status': 'healthy', 'site': 'ء ريلز', 'framework': 'Django'})
