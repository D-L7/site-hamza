from django.shortcuts import render
from django.http import JsonResponse

# Sample searchable dataset for site "ء"
SEARCH_DATABASE = [
    {
        "id": 1,
        "title": "منصة ء الرقمية - الدليل الشامل",
        "category": "مستندات",
        "category_slug": "docs",
        "description": "دليل الاستخدام الكامل لجميع الخدمات والأدوات المتاحة في منصة ء مع التوزيع التفاعلي.",
        "icon": "bi-book",
        "date": "2026-09-01",
        "tags": ["دليل", "تعليمات", "بدء"]
    },
    {
        "id": 2,
        "title": "أداة البحث الفوري والسريع",
        "category": "أدوات",
        "category_slug": "tools",
        "description": "محرك بحث متطور يعتمد على تقنيات الفلترة السريعة بالذكاء الاصطناعي لتوفير أدق النتائج.",
        "icon": "bi-search",
        "date": "2026-09-05",
        "tags": ["بحث", "سرعة", "ذكاء"]
    },
    {
        "id": 3,
        "title": "مقال: المستقبل الرقمي لتطبيقات Web3 وتجارب المستخدم",
        "category": "مقالات",
        "category_slug": "articles",
        "description": "نظرة شاملة حول اتجاهات تصميم واجهات المستخدم المستقبلية والشبكات اللامركزية.",
        "icon": "bi-journal-text",
        "date": "2026-08-28",
        "tags": ["تكنولوجيا", "واجهات", "مستقبل"]
    },
    {
        "id": 4,
        "title": "خدمات التحليل الذكي للبيانات",
        "category": "خدمات",
        "category_slug": "services",
        "description": "تحليل واستخراج الرؤى والإحصائيات بدقة فائقة لدعم اتخاذ القرارات الاستراتيجية.",
        "icon": "bi-bar-chart",
        "date": "2026-09-08",
        "tags": ["بيانات", "إحصائيات", "تحليل"]
    },
    {
        "id": 5,
        "title": "دليل التهيئة والانتشار في Fly.io",
        "category": "مستندات",
        "category_slug": "docs",
        "description": "خطوات نشر تطبيقات بايثون ديجانجو على منصة Fly.io باستخدام الحاويات Docker بفاعلية عالية.",
        "icon": "bi-cloud-upload",
        "date": "2026-09-09",
        "tags": ["Fly.io", "Django", "Docker"]
    },
    {
        "id": 6,
        "title": "أداة التحرير والتنسيق المتقدم",
        "category": "أدوات",
        "category_slug": "tools",
        "description": "محرر محتوى تفاعلي يتيح تنسيق النصوص وإخراج التقارير التفاعلية بسهولة.",
        "icon": "bi-pencil-square",
        "date": "2026-08-20",
        "tags": ["تحرير", "نصوص", "تصميم"]
    }
]

def index(request):
    """Render the single-page web app for site 'ء'."""
    return render(request, 'index.html', {
        'site_name': 'ء',
        'items_count': len(SEARCH_DATABASE)
    })

def search_api(request):
    """API endpoint returning live search results in JSON format."""
    query = request.GET.get('q', '').strip().lower()
    category = request.GET.get('category', 'all')

    results = []
    for item in SEARCH_DATABASE:
        # Category filter
        if category != 'all' and item['category_slug'] != category:
            continue

        # Query text match in title, description, or tags
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

def health_check(request):
    """Health check endpoint for Fly.io deployment."""
    return JsonResponse({'status': 'healthy', 'site': 'ء', 'framework': 'Django'})
