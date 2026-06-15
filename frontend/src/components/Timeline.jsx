import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Calendar, Music, Trash2, Plus, X, Upload,
  ChevronLeft, ChevronRight, ZoomIn, Loader2, Images,
  ExternalLink, CheckCircle2, AlertCircle, AlignLeft,
} from 'lucide-react';

// ─── Multi-photo gallery for a single memory ─────────────────────────────────
function MediaGallery({ photos, singleMedia, singleMediaType }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  // Build unified list — prefer MemoryPhotos array, fall back to legacy single media
  const items =
    photos && photos.length > 0
      ? photos
      : singleMedia
      ? [{ url: singleMedia, media_type: singleMediaType || 'image', id: 'legacy' }]
      : [];

  if (items.length === 0) return null;

  const prev = (e) => { e.stopPropagation(); setIndex((i) => (i - 1 + items.length) % items.length); };
  const next = (e) => { e.stopPropagation(); setIndex((i) => (i + 1) % items.length); };

  const current = items[index];

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden border border-white/5 mb-4 shadow bg-black/40 group">
        {/* Main viewer with blurred background and object-contain foreground */}
        <div className="relative flex items-center justify-center bg-black/80" style={{ aspectRatio: '16/10', maxHeight: '420px' }}>
          {current.media_type !== 'video' && (
            <img
              src={current.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md scale-105 opacity-40 pointer-events-none"
            />
          )}

          {current.media_type === 'video' ? (
            <video
              src={current.url}
              controls
              className="relative z-10 max-w-full max-h-full object-contain bg-black"
            />
          ) : (
            <img
              src={current.url}
              alt={`Foto ${index + 1}`}
              onClick={() => setLightbox(current.url)}
              className="relative z-10 max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
            />
          )}

          {/* Nav arrows */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Zoom hint */}
          {current.media_type === 'image' && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white/70 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <ZoomIn className="w-3 h-3" /> Ver completo
            </div>
          )}

          {/* Counter badge */}
          {items.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm z-20">
              {index + 1} / {items.length}
            </div>
          )}
        </div>

        {/* Thumbnails strip */}
        {items.length > 1 && (
          <div className="flex gap-1.5 p-2 bg-black/60 overflow-x-auto scrollbar-none">
            {items.map((item, i) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setIndex(i)}
                className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index ? 'border-pink-500 scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                {item.media_type === 'video' ? (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-gray-300" />
                  </div>
                ) : (
                  <img src={item.url} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 cursor-zoom-out animate-fade-in"
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="w-7 h-7" />
          </button>
          <img
            src={lightbox}
            alt="Ampliado"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

// ─── File drop zone used inside the creation form ────────────────────────────
function MediaDropZone({ files, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
      );
      onAdd(dropped);
    }
  };

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    onAdd(selected);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 bg-black/20 group ${
          dragActive
            ? 'border-pink-500 bg-pink-500/10 scale-[0.99] shadow-lg shadow-pink-500/10'
            : 'border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="w-9 h-9 text-pink-400/50 mx-auto mb-2.5 transition-all duration-300 group-hover:text-pink-400 group-hover:scale-110 group-hover:animate-bounce" />
        <p className="text-gray-300 text-sm font-semibold">
          Arrastra tus fotos aquí o <span className="text-pink-400 font-bold">haz clic para seleccionar</span>
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Soporta múltiples imágenes o vídeos simultáneos
        </p>
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {files.map((f, i) => {
            const isVideo = f.type.startsWith('video/');
            const url = URL.createObjectURL(f);
            return (
              <div 
                key={i} 
                className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner transition-all duration-300 hover:scale-[1.03] hover:border-pink-500/30"
              >
                {isVideo ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt={f.name} className="w-full h-full object-cover" />
                )}
                
                {/* Delete overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                    className="w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-115 shadow-md shadow-black/40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isVideo && (
                  <div className="absolute top-1.5 left-1.5 bg-black/60 rounded px-1 py-0.5 text-[8px] font-bold text-white flex items-center gap-0.5">
                    <Camera className="w-2.5 h-2.5" /> VIDEO
                  </div>
                )}
                
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 px-2 py-1">
                  <p className="text-[8px] text-white/80 truncate font-mono">{f.name}</p>
                </div>
              </div>
            );
          })}
          {/* Add more button */}
          <div
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-pink-500/10 hover:border-pink-500/40 flex flex-col items-center justify-center cursor-pointer transition-all text-pink-400/30 hover:text-pink-400 hover:scale-[1.03] bg-black/10 hover:bg-pink-500/5 group"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
            <span className="text-[10px] font-semibold mt-1">Añadir más</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live preview gallery for uploading photos ──────────────────────────────
function MediaGalleryPreview({ files }) {
  const [index, setIndex] = useState(0);
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const objectUrls = files.map(file => URL.createObjectURL(file));
    setUrls(objectUrls);
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  useEffect(() => {
    if (index >= files.length) {
      setIndex(Math.max(0, files.length - 1));
    }
  }, [files.length, index]);

  if (files.length === 0 || urls.length === 0) return null;

  const currentFile = files[index];
  const currentUrl = urls[index];
  const isVideo = currentFile?.type?.startsWith('video/');

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + files.length) % files.length);
  };
  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % files.length);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 mb-4 shadow bg-black/40 group">
      <div className="relative aspect-[16/10]" style={{ maxHeight: '250px' }}>
        {isVideo ? (
          <video
            src={currentUrl}
            controls
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <img
            src={currentUrl}
            alt={`Vista previa ${index + 1}`}
            className="w-full h-full object-cover"
          />
        )}

        {files.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
              {index + 1} / {files.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Timeline component ──────────────────────────────────────────────────
export default function Timeline({ user }) {
  const isEditor = user && (user.is_editor || ['alejosierra656@gmail.com', 'yelenabreidy@gmail.com'].includes(user.email));

  const [memories, setMemories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;
      const res = await fetch(`${API_URL}/api/memories/`, { headers });
      const data = await res.json();
      if (res.ok) setMemories(data.memories);
      else setError(data.error || 'No se pudieron cargar los recuerdos.');
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemories(); }, [user]);

  const handleAddFiles = (newFiles) => {
    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !date) return;
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('spotify_url', spotifyUrl);
      mediaFiles.forEach((f) => formData.append('media', f));

      const res = await fetch(`${API_URL}/api/memories/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });

      if (res.ok) {
        setTitle(''); setDescription(''); setDate('');
        setSpotifyUrl(''); setMediaFiles([]);
        setShowAddForm(false);
        setSuccessMsg('¡Recuerdo guardado con éxito!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMemories();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar el recuerdo.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este recuerdo?')) return;
    try {
      const headers = {};
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;
      const res = await fetch(`${API_URL}/api/memories/${id}/`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setSuccessMsg('¡Recuerdo eliminado con éxito!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMemories();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar el recuerdo.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    }
  };

  const imageMemories = memories.filter(
    (m) => (m.photos && m.photos.some((p) => p.media_type === 'image')) || (m.media && m.media_type === 'image')
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-white flex items-center gap-2">
            <Camera className="text-pink-400 w-8 h-8" />
            Nuestra Línea de Tiempo
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Los momentos más especiales que hemos pasado juntos, inmortalizados para siempre.
          </p>
        </div>
        {isEditor && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 self-start md:self-auto"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancelar' : 'Añadir Recuerdo'}
          </button>
        )}
      </div>

      {/* ── Polaroid Gallery ───────────────────────────────────────────── */}
      {imageMemories.length > 0 && (
        <div className="mb-10 w-full overflow-hidden">
          <p className="text-xs font-semibold text-pink-300/80 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <Images className="w-3.5 h-3.5" /> Galería Instantánea
          </p>
          <div className="flex gap-6 overflow-x-auto pb-4 pt-2 px-1 scrollbar-none scroll-smooth snap-x">
            {imageMemories.flatMap((m) => {
              const sources = m.photos && m.photos.length > 0
                ? m.photos.filter(p => p.media_type === 'image').map(p => ({ url: p.url, title: m.title, date: m.date }))
                : m.media && m.media_type === 'image' ? [{ url: m.media, title: m.title, date: m.date }] : [];
              return sources;
            }).map((item, idx) => {
              const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3'];
              return (
                <div
                  key={idx}
                  onClick={() => setLightboxPhoto(item.url)}
                  className={`snap-center shrink-0 bg-white p-3 pb-6 shadow-xl border border-gray-200 transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-2xl ${rotations[idx % rotations.length]} w-[160px] md:w-[180px] cursor-pointer`}
                >
                  <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-cursive font-bold text-gray-900 text-xl md:text-2xl truncate px-1 leading-tight">{item.title}</p>
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">
                      {item.date.split('-').reverse().slice(0, 2).join('/')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Status messages ───────────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-sm mb-6">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Creation form ─────────────────────────────────────────────── */}
      {showAddForm && isEditor && (
        <form
          onSubmit={handleSubmit}
          className="glass rounded-3xl border border-pink-500/20 shadow-2xl mb-10 animate-fade-in overflow-hidden"
        >
          {/* Form header */}
          <div className="px-6 py-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Crear Nuevo Recuerdo</h3>
                <p className="text-gray-400 text-xs mt-0.5">Llena los campos y mira la vista previa en tiempo real a la derecha</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left side: Inputs */}
            <div className="lg:col-span-7 space-y-5">
              {/* Row 1: Title + Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <AlignLeft className="w-3.5 h-3.5" /> Título del Recuerdo *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Tarde de helados, Nuestra primera cita..."
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Fecha *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <AlignLeft className="w-3.5 h-3.5" /> Descripción / Historia *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cuéntame qué pasó ese día..."
                  required
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 transition-colors resize-none text-sm"
                />
              </div>

              {/* Row 3: Spotify */}
              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" /> Enlace de Spotify (opcional)
                </label>
                <input
                  type="text"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 transition-colors text-sm"
                />
              </div>

              {/* Row 4: Multi-photo drop zone */}
              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Images className="w-3.5 h-3.5" /> Fotos / Videos ({mediaFiles.length} seleccionado{mediaFiles.length !== 1 ? 's' : ''})
                </label>
                <MediaDropZone files={mediaFiles} onAdd={handleAddFiles} onRemove={handleRemoveFile} />
              </div>
            </div>

            {/* Right side: Live Preview */}
            <div className="lg:col-span-5 flex flex-col justify-start">
              <span className="block text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">Vista Previa en Tiempo Real</span>
              
              <div className="glass rounded-3xl p-5 shadow-xl border border-pink-500/20 relative overflow-hidden bg-black/30 flex-grow flex flex-col justify-between min-h-[350px]">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pink-400" />
                      {date ? date.split('-').reverse().join('/') : 'DD/MM/AAAA'}
                    </span>
                    <span className="text-[10px] font-bold text-pink-400/80 uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded-full">Borrador</span>
                  </div>

                  <h4 className="font-serif font-bold text-lg text-white mb-2 leading-tight break-words">
                    {title || 'Título de la memoria'}
                  </h4>
                  
                  <p className="text-gray-300 text-xs leading-relaxed mb-4 whitespace-pre-wrap break-words max-h-[120px] overflow-y-auto scrollbar-none">
                    {description || 'Aquí se mostrará tu hermosa historia...'}
                  </p>
                </div>

                <div>
                  {mediaFiles.length > 0 ? (
                    <MediaGalleryPreview files={mediaFiles} />
                  ) : (
                    <div className="border border-dashed border-white/10 rounded-2xl aspect-[16/10] flex flex-col items-center justify-center bg-black/40 text-gray-600 mb-4 py-8">
                      <Images className="w-8 h-8 mb-1 opacity-40" />
                      <span className="text-xs">Sin fotos o videos cargados</span>
                    </div>
                  )}

                  {(() => {
                    const getSpotifyEmbedUrl = (url) => {
                      if (!url) return null;
                      const match = url.match(/spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
                      if (match) {
                        const [, mediaType, mediaId] = match;
                        return `https://open.spotify.com/embed/${mediaType}/${mediaId}`;
                      }
                      return null;
                    };
                    const parsedUrl = getSpotifyEmbedUrl(spotifyUrl);
                    if (parsedUrl) {
                      return (
                        <div className="mt-3 rounded-xl overflow-hidden shadow border border-white/5">
                          <iframe
                            src={parsedUrl}
                            width="100%"
                            height="80"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            className="bg-transparent"
                          />
                        </div>
                      );
                    } else if (spotifyUrl) {
                      return (
                        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-2 text-[10px] text-red-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Enlace de Spotify no válido</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <p className="text-gray-500 text-xs">
              {mediaFiles.length > 0 && `${mediaFiles.length} archivo${mediaFiles.length > 1 ? 's' : ''} listo${mediaFiles.length > 1 ? 's' : ''} para subir`}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-semibold px-7 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-pink-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Guardar Recuerdo</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Timeline List ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 border-b-2 border-pink-500 text-pink-500 animate-spin" />
        </div>
      ) : memories.length === 0 ? (
        <div className="glass text-center py-12 rounded-3xl border border-white/5">
          <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No hay recuerdos registrados aún.</p>
          {isEditor && <p className="text-xs text-gray-500 mt-1">¡Sube el primer recuerdo arriba!</p>}
        </div>
      ) : (
        <div className="relative border-l-2 border-pink-500/30 ml-4 md:ml-32 py-4 space-y-12">
          {memories.map((memory) => (
            <div key={memory.id} className="relative pl-6 md:pl-10">
              {/* Date node — desktop */}
              <div className="hidden md:block absolute -left-36 top-1 text-right w-28">
                <span className="text-sm font-serif font-bold text-pink-400">
                  {memory.date.split('-').reverse().join('/')}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5">
                  {new Date(memory.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}
                </span>
              </div>

              {/* Heart bullet */}
              <span className="absolute -left-[11px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 ring-4 ring-pink-950">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </span>

              {/* Memory card */}
              <div className="glass rounded-3xl p-5 md:p-6 shadow-xl border border-white/5 hover:border-pink-500/20 transition-all duration-300">
                {/* Mobile date */}
                <div className="md:hidden flex items-center gap-1.5 text-xs text-pink-400 font-bold mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{memory.date.split('-').reverse().join('/')}</span>
                </div>

                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-white leading-tight">
                    {memory.title}
                  </h3>
                  {isEditor && (
                    <button
                      type="button"
                      onClick={() => handleDelete(memory.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 shrink-0"
                      title="Eliminar recuerdo"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-4 whitespace-pre-wrap">
                  {memory.description}
                </p>

                {/* Gallery */}
                <MediaGallery
                  photos={memory.photos}
                  singleMedia={memory.media}
                  singleMediaType={memory.media_type}
                />

                {/* Spotify embed */}
                {memory.spotify_embed_url && (
                  <div className="mt-4 rounded-xl overflow-hidden shadow border border-white/5">
                    <iframe
                      src={memory.spotify_embed_url}
                      width="100%"
                      height="80"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="bg-transparent"
                    />
                  </div>
                )}

                {/* Footer: photo count */}
                {memory.photos && memory.photos.length > 1 && (
                  <div className="mt-3 flex items-center gap-1.5 text-gray-500 text-xs">
                    <Images className="w-3.5 h-3.5" />
                    <span>{memory.photos.length} fotos en este recuerdo</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Polaroid Lightbox */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 cursor-zoom-out animate-fade-in"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/60 hover:text-white"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-7 h-7" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Ampliado"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
