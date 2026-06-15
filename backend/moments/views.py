import datetime
import json
import os
import random
import threading
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core import signing
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from email.mime.image import MIMEImage
from .models import Memory, MemoryPhoto, Letter, SpecialDate, BucketItem, LoveNote, SpaceSettings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

ALLOWED_EMAILS = [
    'alejosierra656@gmail.com',
    'yelenabreidy@gmail.com'
]

NOTIFICATION_RECIPIENTS = ['alejosierra656@gmail.com', 'yelenabreidy@gmail.com']

def get_html_email_template(title, intro_text, details_dict, button_text="Ver nuestro Espacio", button_url=None):
    """Generates a beautiful romantic HTML email template using inline styles."""
    details_html = ""
    for label, val in details_dict.items():
        details_html += f"""
        <div style="margin-bottom: 8px; font-size: 14px; text-align: left;">
            <strong style="color: #be185d;">{label}:</strong> 
            <span style="color: #4b5563;">{val}</span>
        </div>
        """
    url = button_url or "http://localhost:5173"  # Will be customized during deployment
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf5f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 24px 12px; background-color: #faf5f6;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #fbcfe8; box-shadow: 0 10px 25px -5px rgba(251, 113, 133, 0.1), 0 8px 10px -6px rgba(251, 113, 133, 0.1);">
                    
                    <!-- Cover Image Header -->
                    <tr>
                        <td align="center" style="background-color: #fbcfe8; line-height: 0;">
                            <img src="cid:couple_photo" alt="Alejo & Breidy" width="100%" style="width: 100%; max-width: 500px; height: auto; display: block; border-bottom: 4px solid #f43f5e;" />
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 32px 24px;">
                            <!-- Top Icon & Header -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="font-size: 28px; line-height: 1;">💖</span>
                                <h1 style="margin: 8px 0 0 0; font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #be185d; text-align: center;">
                                    {title}
                                </h1>
                            </div>
                            
                            <!-- Intro text -->
                            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #374151; text-align: center;">
                                {intro_text}
                            </p>
                            
                            <!-- Details subcard -->
                            <div style="background-color: #fff5f7; border: 1px dashed #fbcfe8; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
                                {details_html}
                            </div>
                            
                            <!-- Call to Action Button -->
                            <div style="text-align: center;">
                                <a href="{url}" target="_blank" style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); background-color: #ec4899; color: #ffffff; text-decoration: none; display: inline-block; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                                    {button_text}
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 24px; background-color: #fff1f2; text-align: center; border-top: 1px solid #ffe4e6;">
                            <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                                Hecho con ❤️ por Alejo para Breidy Diaz Hernández.<br>
                                © {datetime.date.today().year} • Espacio Inmortal de Amor. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

def send_email_async(subject, message, html_content=None):
    """Send a notification email (both Plain Text and HTML if provided) in a background thread."""
    def _send():
        try:
            msg = EmailMultiAlternatives(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                NOTIFICATION_RECIPIENTS,
            )
            if html_content:
                msg.attach_alternative(html_content, "text/html")
                
                # Attach the couple photo as an inline image (cid:couple_photo)
                couple_photo_path = os.path.join(settings.MEDIA_ROOT, 'couple.jpg')
                if os.path.exists(couple_photo_path):
                    try:
                        with open(couple_photo_path, 'rb') as f:
                            msg_img = MIMEImage(f.read())
                            msg_img.add_header('Content-ID', '<couple_photo>')
                            msg_img.add_header('Content-Disposition', 'inline', filename='couple.jpg')
                            msg.attach(msg_img)
                    except Exception as img_err:
                        print(f"[EMAIL IMG ERROR] Failed to attach couple photo: {img_err}")
            msg.send(fail_silently=True)
            print(f"[EMAIL OK] {subject}")
        except Exception as e:
            print(f"[EMAIL ERROR] {subject}: {e}")
    threading.Thread(target=_send, daemon=True).start()

def get_authenticated_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        data = signing.loads(token, max_age=86400 * 30)
        email = data.get('email')
        if email in ALLOWED_EMAILS:
            return email
    except (signing.SignatureExpired, signing.BadSignature):
        pass
    return None


@csrf_exempt
def google_login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Sólo se permite método POST'}, status=405)
    try:
        body = json.loads(request.body)
        credential = body.get('credential')
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        if not client_id:
            return JsonResponse({'error': 'GOOGLE_CLIENT_ID no está configurado en el backend'}, status=400)
        idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id, clock_skew_in_seconds=60)
        email = idinfo.get('email')
        name = idinfo.get('name', 'Breidy o Alejo')
        picture = idinfo.get('picture', '')
        is_editor = email in ALLOWED_EMAILS
        token = signing.dumps({'email': email})
        return JsonResponse({'token': token, 'email': email, 'name': name, 'picture': picture, 'is_editor': is_editor})
    except Exception as e:
        return JsonResponse({'error': f'Fallo en la autenticación: {str(e)}'}, status=400)


@csrf_exempt
def dev_login(request):
    if not settings.DEBUG:
        return JsonResponse({'error': 'Método no disponible en producción'}, status=403)
    if request.method != 'POST':
        return JsonResponse({'error': 'Sólo se permite método POST'}, status=405)
    try:
        body = json.loads(request.body)
        email = body.get('email')
        if email not in ALLOWED_EMAILS:
            return JsonResponse({'error': 'Correo no válido o no autorizado'}, status=403)
        token = signing.dumps({'email': email})
        name = "Alejo Sierra" if email == 'alejosierra656@gmail.com' else "Breidy Diaz"
        picture = "https://api.dicebear.com/7.x/adventurer/svg?seed=Alejo" if email == 'alejosierra656@gmail.com' else "https://api.dicebear.com/7.x/adventurer/svg?seed=Breidy"
        return JsonResponse({'token': token, 'email': email, 'name': name, 'picture': picture})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def memories_list_create(request, pk=None):
    user_email = get_authenticated_user(request)
    is_editor = user_email is not None

    if request.method == 'GET':
        memories = Memory.objects.all()
        data = []
        for m in memories:
            media_url = request.build_absolute_uri(m.media.url) if m.media else None
            if media_url and m.media_type == 'video':
                media_url = media_url.replace('/image/upload/', '/video/upload/')
            
            photos_data = []
            for photo in m.photos.all():
                url = request.build_absolute_uri(photo.file.url)
                if photo.media_type == 'video':
                    url = url.replace('/image/upload/', '/video/upload/')
                photos_data.append({
                    'id': photo.id,
                    'url': url,
                    'media_type': photo.media_type,
                })
            data.append({
                'id': m.id,
                'title': m.title,
                'description': m.description,
                'date': m.date.strftime('%Y-%m-%d'),
                'media': media_url,
                'media_type': m.media_type,
                'spotify_url': m.spotify_url,
                'spotify_embed_url': m.spotify_embed_url,
                'photos': photos_data,
            })
        return JsonResponse({'memories': data, 'is_editor': is_editor})

    elif request.method == 'POST':
        if not is_editor:
            return JsonResponse({'error': 'No autorizado para crear recuerdos'}, status=403)
        title = request.POST.get('title')
        description = request.POST.get('description')
        date_str = request.POST.get('date')
        spotify_url = request.POST.get('spotify_url', '')
        media_files = request.FILES.getlist('media')
        
        if not title or not description or not date_str:
            return JsonResponse({'error': 'Faltan campos obligatorios: título, descripción y fecha'}, status=400)
        try:
            date_val = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            first_media = media_files[0] if media_files else None
            if first_media:
                first_media.seek(0)
            
            memory = Memory.objects.create(
                title=title, description=description,
                date=date_val, spotify_url=spotify_url, media=first_media
            )
            
            for file in media_files:
                file.seek(0)
                MemoryPhoto.objects.create(memory=memory, file=file)
                
            photos_data = []
            for photo in memory.photos.all():
                url = request.build_absolute_uri(photo.file.url)
                if photo.media_type == 'video':
                    url = url.replace('/image/upload/', '/video/upload/')
                photos_data.append({
                    'id': photo.id,
                    'url': url,
                    'media_type': photo.media_type,
                })
                
            media_url = request.build_absolute_uri(memory.media.url) if memory.media else None
            if media_url and memory.media_type == 'video':
                media_url = media_url.replace('/image/upload/', '/video/upload/')

            # ── Email notification ────────────────────────────────────────
            photo_count = len(photos_data)
            photo_text = (
                f"{photo_count} foto{'s' if photo_count != 1 else ''} adjunta{'s' if photo_count != 1 else ''}"
                if photo_count > 0 else 'Sin fotos adjuntas'
            )
            
            subject = f"Nuevo recuerdo guardado: {memory.title}"
            intro_text = "¡Hola, Breidy y Alejo! Se ha inmortalizado un nuevo recuerdo en su espacio de amor."
            details = {
                'Título': memory.title,
                'Fecha': memory.date.strftime('%d/%m/%Y'),
                'Fotos': photo_text,
                'Historia': memory.description[:300] + ('...' if len(memory.description) > 300 else '')
            }
            html_msg = get_html_email_template("¡Nuevo Recuerdo Inmortalizado! 📸", intro_text, details, button_text="Ver en el Álbum")
            
            send_email_async(
                subject=subject,
                message=(
                    f"Hola, Breidy y Alejo!\n\n"
                    f"Se ha guardado un nuevo recuerdo en su espacio:\n\n"
                    f"  Titulo:  {memory.title}\n"
                    f"  Fecha:   {memory.date.strftime('%d/%m/%Y')}\n"
                    f"  Fotos:   {photo_text}\n\n"
                    f"  Historia:\n  {memory.description[:300]}{'...' if len(memory.description) > 300 else ''}\n\n"
                    f"Visiten su espacio en linea para verlo completo. Con amor, su espacio de recuerdos."
                ),
                html_content=html_msg
            )
            # ─────────────────────────────────────────────────────────────

            return JsonResponse({
                'success': True,
                'memory': {
                    'id': memory.id, 'title': memory.title,
                    'description': memory.description,
                    'date': memory.date.strftime('%Y-%m-%d'),
                    'media': media_url, 'media_type': memory.media_type,
                    'spotify_url': memory.spotify_url,
                    'spotify_embed_url': memory.spotify_embed_url,
                    'photos': photos_data,
                }
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': f'Error al guardar recuerdo: {str(e)}'}, status=500)

    elif request.method == 'DELETE' and pk:
        if not is_editor:
            return JsonResponse({'error': 'No autorizado para eliminar recuerdos'}, status=403)
        try:
            Memory.objects.get(pk=pk).delete()
            return JsonResponse({'success': True})
        except Memory.DoesNotExist:
            return JsonResponse({'error': 'Recuerdo no encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def letters_list_create(request):
    user_email = get_authenticated_user(request)
    is_editor = user_email is not None

    if request.method == 'GET':
        letters = Letter.objects.all()
        data = []
        today = datetime.date.today()
        for l in letters:
            is_locked = l.unlock_date and l.unlock_date > today
            content_shown = l.content
            if is_locked and not is_editor:
                content_shown = f"Esta carta está sellada con amor. Se abrirá el {l.unlock_date.strftime('%d/%m/%Y')}."
            data.append({
                'id': l.id, 'title': l.title, 'content': content_shown,
                'created_by': l.created_by,
                'unlock_date': l.unlock_date.strftime('%Y-%m-%d') if l.unlock_date else None,
                'created_at': l.created_at.strftime('%Y-%m-%d %H:%M'),
                'is_locked': is_locked
            })
        return JsonResponse({'letters': data, 'is_editor': is_editor})

    elif request.method == 'POST':
        if not is_editor:
            return JsonResponse({'error': 'No autorizado para escribir cartas'}, status=403)
        try:
            body = json.loads(request.body)
            title = body.get('title')
            content = body.get('content')
            unlock_date_str = body.get('unlock_date')
            if not title or not content:
                return JsonResponse({'error': 'Título y contenido son obligatorios'}, status=400)
            unlock_date = None
            if unlock_date_str:
                unlock_date = datetime.datetime.strptime(unlock_date_str, '%Y-%m-%d').date()
            creator_name = "Alejo" if user_email == 'alejosierra656@gmail.com' else "Breidy"
            letter = Letter.objects.create(
                title=title, content=content,
                unlock_date=unlock_date, created_by=creator_name
            )

            # ── Email notification ────────────────────────────────────────
            lock_info = (
                f"Esta carta estará disponible el {unlock_date.strftime('%d/%m/%Y')}."
                if unlock_date else "Esta carta ya está disponible y abierta."
            )
            
            subject = f"Nueva carta de amor de {creator_name}: {title}"
            intro_text = f"¡Hola, Breidy y Alejo! {creator_name} acaba de dejar una nueva carta de amor en su espacio."
            details = {
                'Título': title,
                'Escrito por': creator_name,
                'Estado': lock_info,
                'Vista previa': content[:150] + ('...' if len(content) > 150 else '') if not unlock_date else "El contenido está sellado hasta la fecha indicada."
            }
            html_msg = get_html_email_template("¡Nueva Carta de Amor Escrita! 💌", intro_text, details, button_text="Leer la Carta")
            
            send_email_async(
                subject=subject,
                message=(
                    f"Hola, Breidy y Alejo!\n\n"
                    f"{creator_name} acaba de escribir una nueva carta de amor:\n\n"
                    f"  Titulo: {title}\n"
                    f"  {lock_info}\n\n"
                    f"Visiten su espacio en linea para leerla. Con amor, su espacio de recuerdos."
                ),
                html_content=html_msg
            )
            # ─────────────────────────────────────────────────────────────

            return JsonResponse({
                'success': True,
                'letter': {
                    'id': letter.id, 'title': letter.title,
                    'content': letter.content, 'created_by': letter.created_by,
                    'unlock_date': letter.unlock_date.strftime('%Y-%m-%d') if letter.unlock_date else None,
                    'created_at': letter.created_at.strftime('%Y-%m-%d %H:%M'),
                    'is_locked': letter.is_locked
                }
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': f'Error al guardar carta: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def check_reminders(request):
    today = datetime.date.today()
    special_dates = SpecialDate.objects.filter(month=today.month, day=today.day)
    emails_sent = []
    is_anniversary_day = today.day == 14

    for event in special_dates:
        if event.last_sent_year < today.year:
            subject = f"Recordatorio Especial: {event.title}"
            message = (
                f"¡Hola! Hoy es un día maravilloso:\n\n"
                f"{event.title}\n\n"
                f"Fecha: {event.day}/{event.month}/{today.year}\n"
                f"No olvides dedicarle un momento especial hoy a tu persona favorita.\n\n"
                f"Con amor, vuestro espacio de recuerdos."
            )
            recipient_list = [email.strip() for email in event.recipients.split(',') if email.strip()]
            try:
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)
                event.last_sent_year = today.year
                event.save()
                emails_sent.append({'title': event.title, 'recipients': recipient_list, 'status': 'Sent'})
            except Exception as e:
                emails_sent.append({'title': event.title, 'recipients': recipient_list, 'status': f'Failed: {str(e)}'})

    if is_anniversary_day:
        anniv_event, created = SpecialDate.objects.get_or_create(
            event_type='anniversary', month=today.month, day=14,
            defaults={'title': 'Aniversario de Novios (Día 14)', 'recipients': 'alejosierra656@gmail.com,yelenabreidy@gmail.com'}
        )
        if anniv_event.last_sent_year < today.year:
            start_date = datetime.date(2026, 2, 14)
            months_diff = (today.year - start_date.year) * 12 + (today.month - start_date.month)
            subject = f"¡Feliz Aniversario de {months_diff} Meses!"
            message = (
                f"¡Felicidades Alejo y Breidy!\n\n"
                f"Hoy es 14 de {today.strftime('%B')} de {today.year}, lo que significa que "
                f"cumplen exactamente {months_diff} meses de estar juntos.\n\n"
                f"El 14 de febrero de 2026 decidieron empezar esta hermosa historia y hoy celebran un mes más de risas, recuerdos y mucho amor.\n\n"
                f"¡Que disfruten su día especial!"
            )
            recipient_list = [email.strip() for email in anniv_event.recipients.split(',') if email.strip()]
            try:
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)
                anniv_event.last_sent_year = today.year
                anniv_event.save()
                emails_sent.append({'title': f'Aniversario de {months_diff} Meses', 'recipients': recipient_list, 'status': 'Sent'})
            except Exception as e:
                emails_sent.append({'title': f'Aniversario de {months_diff} Meses', 'recipients': recipient_list, 'status': f'Failed: {str(e)}'})

    return JsonResponse({'checked_date': today.strftime('%Y-%m-%d'), 'emails_sent': emails_sent})


# ─── BUCKET LIST ────────────────────────────────────────────────────

@csrf_exempt
def bucketlist_api(request, pk=None):
    user_email = get_authenticated_user(request)
    is_editor = user_email is not None

    if request.method == 'GET':
        items = BucketItem.objects.all()
        data = []
        for item in items:
            data.append({
                'id': item.id, 'title': item.title,
                'category': item.category, 'emoji': item.emoji,
                'is_completed': item.is_completed,
                'completed_at': item.completed_at.strftime('%Y-%m-%d') if item.completed_at else None,
                'created_by': item.created_by,
                'created_at': item.created_at.strftime('%Y-%m-%d'),
            })
        return JsonResponse({'items': data, 'is_editor': is_editor})

    elif request.method == 'POST':
        if not is_editor:
            return JsonResponse({'error': 'No autorizado'}, status=403)
        try:
            body = json.loads(request.body)
            title = body.get('title', '').strip()
            if not title:
                return JsonResponse({'error': 'El título es obligatorio'}, status=400)
            creator_name = "Alejo" if user_email == 'alejosierra656@gmail.com' else "Breidy"
            item = BucketItem.objects.create(
                title=title,
                category=body.get('category', 'otro'),
                emoji=body.get('emoji', 'Sparkles'),
                created_by=creator_name,
            )

            # ── Email notification (New dream proposed) ──────────────────
            category_labels = {
                'viaje': 'Viajes ✈️', 'aventura': 'Aventuras 🧗',
                'romantico': 'Romántico 💖', 'comida': 'Comida 🍕',
                'cultura': 'Cultura 🎭', 'hogar': 'Hogar 🏡', 'otro': 'Otro ✨'
            }
            category_label = category_labels.get(item.category, item.category)
            
            subject = f"Nuevo sueño propuesto por {creator_name}: {item.title}"
            intro_text = f"¡Hola, Breidy y Alejo! Se ha agregado un nuevo sueño a su lista de deseos compartidos."
            details = {
                'Sueño': item.title,
                'Categoría': category_label,
                'Propuesto por': creator_name
            }
            html_msg = get_html_email_template("¡Nuevo Sueño Compartido! 🌟", intro_text, details, button_text="Ver Lista de Sueños")
            
            send_email_async(
                subject=subject,
                message=(
                    f"Hola, Breidy y Alejo!\n\n"
                    f"Se ha propuesto un nuevo sueno:\n\n"
                    f"  Sueno: {item.title}\n"
                    f"  Categoria: {category_label}\n"
                    f"  Propuesto por: {creator_name}\n\n"
                    f"Visiten su espacio en linea para ver la lista de suenos. Con amor, su espacio de recuerdos."
                ),
                html_content=html_msg
            )
            # ─────────────────────────────────────────────────────────────

            return JsonResponse({
                'success': True,
                'item': {
                    'id': item.id, 'title': item.title,
                    'category': item.category, 'emoji': item.emoji,
                    'is_completed': item.is_completed, 'completed_at': None,
                    'created_by': item.created_by,
                    'created_at': item.created_at.strftime('%Y-%m-%d'),
                }
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'PATCH' and pk:
        if not is_editor:
            return JsonResponse({'error': 'No autorizado'}, status=403)
        try:
            item = BucketItem.objects.get(pk=pk)
            body = json.loads(request.body)
            was_completed = item.is_completed
            item.is_completed = body.get('is_completed', item.is_completed)
            if item.is_completed and not item.completed_at:
                item.completed_at = datetime.date.today()
            elif not item.is_completed:
                item.completed_at = None
            item.save()

            # ── Email notification (only when newly completed) ────────────
            if item.is_completed and not was_completed:
                category_labels = {
                    'viaje': 'Viajes ✈️', 'aventura': 'Aventuras 🧗',
                    'romantico': 'Romántico 💖', 'comida': 'Comida 🍕',
                    'cultura': 'Cultura 🎭', 'hogar': 'Hogar 🏡', 'otro': 'Otro ✨'
                }
                category_label = category_labels.get(item.category, item.category)
                
                subject = f"¡Sueño cumplido juntos! 🎉: {item.title}"
                intro_text = "¡Felicidades, Breidy y Alejo! Han cumplido otro de sus sueños compartidos."
                details = {
                    'Sueño cumplido': item.title,
                    'Categoría': category_label,
                    'Propuesto por': item.created_by,
                    'Fecha de logro': item.completed_at.strftime('%d/%m/%Y')
                }
                html_msg = get_html_email_template("¡Otro Sueño Cumplido! 🌟", intro_text, details, button_text="Ver Lista de Sueños")
                
                send_email_async(
                    subject=subject,
                    message=(
                        f"Hola, Breidy y Alejo!\n\n"
                        f"Han cumplido un sueno de su lista juntos:\n\n"
                        f"  Sueno:     {item.title}\n"
                        f"  Categoria: {category_label}\n"
                        f"  Propuesto por: {item.created_by}\n"
                        f"  Cumplido el: {item.completed_at.strftime('%d/%m/%Y')}\n\n"
                        f"Cada sueno cumplido es un capitulo mas de su historia. Sigan sonando juntos!\n"
                        f"Con amor, su espacio de recuerdos."
                    ),
                    html_content=html_msg
                )
            # ─────────────────────────────────────────────────────────────

            return JsonResponse({
                'success': True,
                'item': {
                    'id': item.id, 'title': item.title,
                    'category': item.category, 'emoji': item.emoji,
                    'is_completed': item.is_completed,
                    'completed_at': item.completed_at.strftime('%Y-%m-%d') if item.completed_at else None,
                    'created_by': item.created_by,
                    'created_at': item.created_at.strftime('%Y-%m-%d'),
                }
            })
        except BucketItem.DoesNotExist:
            return JsonResponse({'error': 'Ítem no encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'DELETE' and pk:
        if not is_editor:
            return JsonResponse({'error': 'No autorizado'}, status=403)
        try:
            BucketItem.objects.get(pk=pk).delete()
            return JsonResponse({'success': True})
        except BucketItem.DoesNotExist:
            return JsonResponse({'error': 'Ítem no encontrado'}, status=404)

    return JsonResponse({'error': 'Método no permitido'}, status=405)


# ─── LOVE NOTES ─────────────────────────────────────────────────────

@csrf_exempt
def lovenotes_api(request, pk=None):
    user_email = get_authenticated_user(request)
    is_editor = user_email is not None

    if request.method == 'GET':
        notes = LoveNote.objects.all()[:30]
        data = [{
            'id': n.id, 'content': n.content, 'color': n.color,
            'created_by': n.created_by, 'rotation': n.rotation,
            'created_at': n.created_at.strftime('%Y-%m-%d %H:%M'),
        } for n in notes]
        return JsonResponse({'notes': data, 'is_editor': is_editor})

    elif request.method == 'POST':
        if not is_editor:
            return JsonResponse({'error': 'No autorizado'}, status=403)
        try:
            body = json.loads(request.body)
            content = body.get('content', '').strip()
            if not content:
                return JsonResponse({'error': 'El contenido es obligatorio'}, status=400)
            creator_name = "Alejo" if user_email == 'alejosierra656@gmail.com' else "Breidy"
            rotation = random.uniform(-8, 8)
            note = LoveNote.objects.create(
                content=content,
                color=body.get('color', 'pink'),
                created_by=creator_name,
                rotation=rotation,
            )

            # ── Email notification ────────────────────────────────────────
            color_labels = {
                'pink': 'Rosado 🌸', 'purple': 'Morado 💜',
                'blue': 'Azul 💙', 'yellow': 'Amarillo 💛',
                'green': 'Verde 💚'
            }
            color_label = color_labels.get(note.color, note.color)
            
            subject = f"Nueva nota de amor de {creator_name} en el muro"
            intro_text = f"¡Hola, Breidy y Alejo! {creator_name} ha dejado un nuevo post-it de amor en su muro virtual."
            details = {
                'Mensaje': note.content,
                'Color de la Nota': color_label,
                'Escrito por': creator_name
            }
            html_msg = get_html_email_template("¡Nueva Nota en el Muro! 📌", intro_text, details, button_text="Ver Muro de Notas")
            
            send_email_async(
                subject=subject,
                message=(
                    f"Hola, Breidy y Alejo!\n\n"
                    f"{creator_name} ha dejado una nueva nota en el muro:\n\n"
                    f"  Nota: \"{note.content}\"\n"
                    f"  Color: {color_label}\n\n"
                    f"Visiten su espacio en linea para ver el muro de notas completo. Con amor, su espacio de recuerdos."
                ),
                html_content=html_msg
            )
            # ─────────────────────────────────────────────────────────────

            return JsonResponse({
                'success': True,
                'note': {
                    'id': note.id, 'content': note.content, 'color': note.color,
                    'created_by': note.created_by, 'rotation': note.rotation,
                    'created_at': note.created_at.strftime('%Y-%m-%d %H:%M'),
                }
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'DELETE' and pk:
        if not is_editor:
            return JsonResponse({'error': 'No autorizado'}, status=403)
        try:
            LoveNote.objects.get(pk=pk).delete()
            return JsonResponse({'success': True})
        except LoveNote.DoesNotExist:
            return JsonResponse({'error': 'Nota no encontrada'}, status=404)

    return JsonResponse({'error': 'Método no permitido'}, status=405)


# ─── SPACE SETTINGS ──────────────────────────────────────────────────

@csrf_exempt
def space_settings_api(request):
    user_email = get_authenticated_user(request)
    is_editor = user_email is not None

    # Ensure singleton exists
    settings_obj, _ = SpaceSettings.objects.get_or_create(pk=1)

    if request.method == 'GET':
        return JsonResponse({
            'spotify_playlist_url': settings_obj.spotify_playlist_url,
            'our_song_title': settings_obj.our_song_title,
            'spotify_embed_url': settings_obj.spotify_embed_url,
            'is_editor': is_editor,
        })

    elif request.method == 'PUT':
        if not is_editor:
            return JsonResponse({'error': 'No autorizado'}, status=403)
        try:
            body = json.loads(request.body)
            settings_obj.spotify_playlist_url = body.get('spotify_playlist_url', settings_obj.spotify_playlist_url)
            settings_obj.our_song_title = body.get('our_song_title', settings_obj.our_song_title)
            settings_obj.save()
            return JsonResponse({
                'success': True,
                'spotify_playlist_url': settings_obj.spotify_playlist_url,
                'our_song_title': settings_obj.our_song_title,
                'spotify_embed_url': settings_obj.spotify_embed_url,
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Método no permitido'}, status=405)
