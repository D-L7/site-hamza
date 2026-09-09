FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

RUN python manage.py collectstatic --noinput

EXPOSE 8080

# Run migrations, initialize database data & admin account, then start Gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py init_data && gunicorn hamza_project.wsgi:application --bind 0.0.0.0:8080"]
