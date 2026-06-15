import os
import django
import datetime
import random

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'love_backend.settings')
django.setup()

from moments.models import Memory, Letter, SpecialDate, BucketItem, LoveNote, SpaceSettings

def seed():
    print("Iniciando la base de datos con recuerdos y fechas especiales...")
    
    # 1. Create default Special Dates
    anniversary_date, created = SpecialDate.objects.get_or_create(
        title="Aniversario de Novios (Día 14)",
        month=2,
        day=14,
        defaults={
            'event_type': 'anniversary',
            'recipients': 'alejosierra656@gmail.com,yelenabreidy@gmail.com'
        }
    )
    if created:
        print("[OK] Creado recordatorio para el Aniversario Mensual.")
        
    christmas_date, created = SpecialDate.objects.get_or_create(
        title="Navidad en Pareja",
        month=12,
        day=25,
        defaults={
            'event_type': 'christmas',
            'recipients': 'alejosierra656@gmail.com,yelenabreidy@gmail.com'
        }
    )
    if created:
        print("[OK] Creado recordatorio para Navidad.")

    # 2. Create the first beautiful memory of Feb 14, 2026
    first_memory, created = Memory.objects.get_or_create(
        title="El Día que Todo Comenzó",
        defaults={
            'description': (
                "El 14 de febrero de 2026 decidimos dar el paso más bonito de todos y empezar a ser novios. "
                "Desde ese día de San Valentín, cada momento a tu lado ha estado lleno de risas, felicidad y "
                "un amor que no para de crecer. ¡Gracias por ser la mejor novia del mundo, Breidy Diaz Hernández! "
                "Este espacio es nuestro, para recordar siempre todo lo que hemos construido juntos."
            ),
            'date': datetime.date(2026, 2, 14),
            'spotify_url': 'https://open.spotify.com/intl-es/track/0tgVpDi06FyKpA1z0VMD4v?si=34f6134872b7417f',
            'media_type': 'image'
        }
    )
    if created:
        print("[OK] Creado el primer recuerdo inicial (14 de Febrero).")
    else:
        # Update spotify url if it exists with old ID
        first_memory.spotify_url = 'https://open.spotify.com/intl-es/track/0tgVpDi06FyKpA1z0VMD4v?si=34f6134872b7417f'
        first_memory.save()
        print("[OK] Actualizado primer recuerdo con ID de Spotify correcto.")
        
    # 3. Create a cute welcome letter locked or unlocked
    letter, created = Letter.objects.get_or_create(
        title="Nuestros Primeros 4 Meses",
        defaults={
            'content': (
                "¡Felices 4 meses mi amor!\n\n"
                "Hoy es 14 de junio de 2026 y ya cumplimos nuestro cuarto mes juntos. "
                "Quería hacerte este regalo súper especial y único para guardar cada pedacito de nuestra historia. "
                "Cada foto, cada video y cada canción que nos dediquemos estará aquí para siempre. "
                "Te amo con todo mi corazón, Breidy. Eres lo más bonito de mi vida.\n\n"
                "Con amor,\nTu novio"
            ),
            'unlock_date': datetime.date(2026, 6, 14), # Unlocked today!
            'created_by': 'Alejo'
        }
    )
    if created:
        print("[OK] Creada carta de bienvenida por los 4 meses.")

    # 4. Create default Space Settings (Spotify player)
    settings_obj, created = SpaceSettings.objects.get_or_create(
        pk=1,
        defaults={
            'spotify_playlist_url': 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGmqZBMj', # Cozy/Romantic playlist
            'our_song_title': 'Nuestra Playlist Oficial'
        }
    )
    if created:
        print("[OK] Creada configuración por defecto de música.")

    # 5. Create default Bucket List items
    default_dreams = [
        ("Viajar juntos a París", "viaje", "✈️"),
        ("Ver el amanecer en la playa", "aventura", "🏖️"),
        ("Cocinar pasta italiana juntos", "comida", "🍕"),
        ("Tener una noche de películas y cobijas", "romantico", "🌹"),
    ]
    for title, category, emoji in default_dreams:
        item, created = BucketItem.objects.get_or_create(
            title=title,
            defaults={
                'category': category,
                'emoji': emoji,
                'is_completed': False,
                'created_by': 'Alejo'
            }
        )
        if created:
            print(f"[OK] Creado sueño: {title}")

    # 6. Create default Love Notes
    default_notes = [
        ("Gracias por hacerme sonreír todos los días. Te amo muchísimo, Breidy.", "pink", "Alejo"),
        ("Eres mi persona favorita en todo el universo.", "lavender", "Breidy"),
        ("¡Por miles de meses y aventuras más juntos!", "peach", "Alejo")
    ]
    for content, color, created_by in default_notes:
        note, created = LoveNote.objects.get_or_create(
            content=content,
            defaults={
                'color': color,
                'created_by': created_by,
                'rotation': random.uniform(-6, 6)
            }
        )
        if created:
            print(f"[OK] Creada nota de amor de {created_by}")
        
    print("Base de datos sembrada con éxito!")

if __name__ == '__main__':
    seed()
