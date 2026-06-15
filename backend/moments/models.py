from django.db import models
import re

class Memory(models.Model):
    title = models.CharField(max_length=200, verbose_name="Título")
    description = models.TextField(verbose_name="Descripción")
    date = models.DateField(verbose_name="Fecha del Recuerdo")
    media = models.FileField(upload_to='memories/', blank=True, null=True, verbose_name="Foto o Video")
    media_type = models.CharField(max_length=10, default='image', choices=[('image', 'Imagen'), ('video', 'Video')], verbose_name="Tipo de Media")
    spotify_url = models.CharField(max_length=500, blank=True, null=True, verbose_name="Enlace de Spotify")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.title} ({self.date})"

    @property
    def spotify_embed_url(self):
        if not self.spotify_url:
            return None
        match = re.search(r'spotify\.com/(?:intl-[a-z]{2}/)?(track|album|playlist|artist)/([a-zA-Z0-9]+)', self.spotify_url)
        if match:
            media_type, media_id = match.groups()
            return f"https://open.spotify.com/embed/{media_type}/{media_id}"
        return None

    def save(self, *args, **kwargs):
        if self.media:
            ext = self.media.name.split('.')[-1].lower()
            if ext in ['mp4', 'mov', 'avi', 'mkv', 'webm', 'ogv']:
                self.media_type = 'video'
            else:
                self.media_type = 'image'
        super().save(*args, **kwargs)


class MemoryPhoto(models.Model):
    memory = models.ForeignKey(Memory, on_delete=models.CASCADE, related_name='photos', verbose_name="Recuerdo")
    file = models.FileField(upload_to='memories/photos/', verbose_name="Archivo")
    media_type = models.CharField(max_length=10, default='image', choices=[('image', 'Imagen'), ('video', 'Video')], verbose_name="Tipo de Media")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Foto de {self.memory.title}"

    def save(self, *args, **kwargs):
        if self.file:
            ext = self.file.name.split('.')[-1].lower()
            if ext in ['mp4', 'mov', 'avi', 'mkv', 'webm', 'ogv']:
                self.media_type = 'video'
            else:
                self.media_type = 'image'
        super().save(*args, **kwargs)



class Letter(models.Model):
    title = models.CharField(max_length=200, verbose_name="Título")
    content = models.TextField(verbose_name="Contenido de la Carta")
    unlock_date = models.DateField(blank=True, null=True, verbose_name="Fecha de Desbloqueo")
    created_by = models.CharField(max_length=100, default='Alejo', verbose_name="Creado por")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Carta: {self.title} de {self.created_by}"

    @property
    def is_locked(self):
        from datetime import date
        if self.unlock_date and self.unlock_date > date.today():
            return True
        return False


class SpecialDate(models.Model):
    EVENT_CHOICES = [
        ('birthday', 'Cumpleaños'),
        ('anniversary', 'Aniversario'),
        ('christmas', 'Navidad'),
        ('custom', 'Personalizado'),
    ]

    title = models.CharField(max_length=200, verbose_name="Nombre del Evento")
    event_type = models.CharField(max_length=20, choices=EVENT_CHOICES, default='custom')
    month = models.IntegerField(verbose_name="Mes")
    day = models.IntegerField(verbose_name="Día")
    last_sent_year = models.IntegerField(default=0, verbose_name="Último Año de Notificación Enviada")
    recipients = models.TextField(default="alejosierra656@gmail.com,yelenabreidy@gmail.com", verbose_name="Correos de Destinatarios (separados por comas)")

    def __str__(self):
        return f"{self.title} ({self.day}/{self.month})"


# ─── NUEVOS MODELOS ────────────────────────────────────────────────

class BucketItem(models.Model):
    """Ítem de la lista de sueños y metas de la pareja."""
    CATEGORY_CHOICES = [
        ('viaje', 'Viajes'),
        ('aventura', 'Aventuras'),
        ('romantico', 'Romántico'),
        ('comida', 'Comida'),
        ('cultura', 'Cultura'),
        ('hogar', 'Hogar'),
        ('otro', 'Otro'),
    ]

    title = models.CharField(max_length=300, verbose_name="Meta o Sueño")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='otro')
    is_completed = models.BooleanField(default=False, verbose_name="¿Completado?")
    completed_at = models.DateField(blank=True, null=True, verbose_name="Fecha de Completado")
    created_by = models.CharField(max_length=100, default='Alejo', verbose_name="Propuesto por")
    created_at = models.DateTimeField(auto_now_add=True)
    emoji = models.CharField(max_length=100, blank=True, default='Sparkles', verbose_name="Icono")

    class Meta:
        ordering = ['is_completed', '-created_at']

    def __str__(self):
        status = "[X]" if self.is_completed else "[ ]"
        return f"{status} {self.title}"


class LoveNote(models.Model):
    """Notas adhesivas románticas rápidas entre Alejo y Breidy."""
    COLOR_CHOICES = [
        ('pink', 'Rosa'),
        ('lavender', 'Lavanda'),
        ('peach', 'Durazno'),
        ('mint', 'Menta'),
        ('yellow', 'Amarillo'),
    ]

    content = models.TextField(max_length=400, verbose_name="Nota de Amor")
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='pink')
    created_by = models.CharField(max_length=100, default='Alejo', verbose_name="De")
    created_at = models.DateTimeField(auto_now_add=True)
    rotation = models.FloatField(default=0.0, verbose_name="Rotación (grados)")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Nota de {self.created_by}: {self.content[:40]}..."


class SpaceSettings(models.Model):
    """Configuración global del espacio (singleton — solo una fila)."""
    spotify_playlist_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        verbose_name="URL de Playlist/Canción de Spotify"
    )
    our_song_title = models.CharField(
        max_length=200,
        blank=True,
        default='Nuestra Canción',
        verbose_name="Nombre de la Canción"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración del Espacio"
        verbose_name_plural = "Configuración del Espacio"

    def __str__(self):
        return f"Configuración — Actualizado: {self.updated_at}"

    @property
    def spotify_embed_url(self):
        if not self.spotify_playlist_url:
            return None
        match = re.search(r'spotify\.com/(?:intl-[a-z]{2}/)?(track|album|playlist|artist)/([a-zA-Z0-9]+)', self.spotify_playlist_url)
        if match:
            media_type, media_id = match.groups()
            return f"https://open.spotify.com/embed/{media_type}/{media_id}"
        return None
