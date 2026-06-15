from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from moments import views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/google-login/', views.google_login, name='google_login'),
    path('api/auth/dev-login/', views.dev_login, name='dev_login'),

    # Core
    path('api/memories/', views.memories_list_create, name='memories'),
    path('api/memories/<int:pk>/', views.memories_list_create, name='memories_detail'),
    path('api/letters/', views.letters_list_create, name='letters'),
    path('api/check-reminders/', views.check_reminders, name='check_reminders'),

    # Bucket List
    path('api/bucketlist/', views.bucketlist_api, name='bucketlist'),
    path('api/bucketlist/<int:pk>/', views.bucketlist_api, name='bucketlist_detail'),

    # Love Notes
    path('api/lovenotes/', views.lovenotes_api, name='lovenotes'),
    path('api/lovenotes/<int:pk>/', views.lovenotes_api, name='lovenotes_detail'),

    # Space Settings
    path('api/settings/', views.space_settings_api, name='space_settings'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
