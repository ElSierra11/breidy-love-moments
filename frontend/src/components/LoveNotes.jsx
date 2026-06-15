import React, { useState, useEffect } from 'react';
import { StickyNote, Trash2, Plus, Heart, Send, X, Loader2, AlertCircle } from 'lucide-react';

const COLOR_STYLES = {
  pink:     { bg: 'bg-[#ffe4f0]', text: 'text-rose-900', shadow: 'shadow-rose-300/30',    border: 'border-rose-200/50'   },
  lavender: { bg: 'bg-[#ede9ff]', text: 'text-violet-900', shadow: 'shadow-violet-300/30', border: 'border-violet-200/50' },
  peach:    { bg: 'bg-[#ffe8d6]', text: 'text-orange-900', shadow: 'shadow-orange-300/30', border: 'border-orange-200/50' },
  mint:     { bg: 'bg-[#d9f7e8]', text: 'text-emerald-900', shadow: 'shadow-emerald-300/30',border: 'border-emerald-200/50'},
  yellow:   { bg: 'bg-[#fff9c4]', text: 'text-yellow-900', shadow: 'shadow-yellow-300/30', border: 'border-yellow-200/50' },
};

const COLOR_LABELS = {
  pink: 'Rosa', lavender: 'Lavanda', peach: 'Durazno', mint: 'Menta', yellow: 'Amarillo',
};

export default function LoveNotes({ user }) {
  const isEditor = user && (user.is_editor || ['alejosierra656@gmail.com', 'yelenabreidy@gmail.com'].includes(user.email));
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent]   = useState('');
  const [color, setColor]       = useState('pink');
  const [error, setError]       = useState('');
  const [removing, setRemoving] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const res = await fetch(`${API_URL}/api/lovenotes/`, { headers });
      const data = await res.json();
      if (res.ok) setNotes(data.notes);
    } catch { setError('Error al conectar.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/lovenotes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ content, color }),
      });
      if (res.ok) { setContent(''); setShowForm(false); fetchNotes(); }
    } catch { setError('Error al publicar la nota.'); }
  };

  const handleDelete = async (id) => {
    setRemoving(id);
    setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/lovenotes/${id}/`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.token}` },
        });
        fetchNotes();
      } catch { setError('Error al eliminar.'); }
      finally { setRemoving(null); }
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-white flex items-center gap-2">
            <StickyNote className="text-pink-400 w-8 h-8" />
            Muro de Notas
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Nuestro rincón de los pensamientos — notas rápidas del corazón
          </p>
        </div>
        {isEditor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 self-start md:self-auto"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Nueva Nota'}
          </button>
        )}
      </div>

      {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm mb-6"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      {/* Write form */}
      {showForm && isEditor && (
        <form onSubmit={handleAdd} className="glass p-6 rounded-3xl border border-pink-500/20 shadow-xl mb-8 animate-fade-in space-y-4">
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400 fill-current" />
            Escríbele algo bonito
          </h3>

          {/* Color picker */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Color de la nota</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(COLOR_LABELS).map(([key, label]) => (
                <button
                  key={key} type="button" onClick={() => setColor(key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${COLOR_STYLES[key].bg} ${COLOR_STYLES[key].text} ${COLOR_STYLES[key].border} ${
                    color === key ? 'ring-2 ring-pink-400 scale-105 shadow-md' : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Note content */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1">Tu nota de amor</label>
            <textarea
              value={content} onChange={e => setContent(e.target.value)}
              placeholder={`Ej. "Gracias por hacerme sonreír cada día"`}
              required maxLength={400} rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 transition-colors font-serif resize-none"
            />
            <p className="text-right text-gray-500 text-xs mt-1">{content.length}/400</p>
          </div>

          {/* Preview */}
          {content && (
            <div className="mt-1">
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-semibold">Vista previa:</p>
              <div
                className={`${COLOR_STYLES[color].bg} ${COLOR_STYLES[color].text} p-4 rounded-xl shadow-lg max-w-xs font-serif text-sm leading-relaxed border ${COLOR_STYLES[color].border}`}
                style={{ transform: `rotate(${Math.random() > 0.5 ? 1.5 : -1.5}deg)` }}
              >
                <p className="whitespace-pre-wrap">{content}</p>
                <p className="text-xs mt-3 opacity-60 font-sans">— {user.name?.split(' ')[0]}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Pegar en el Muro
            </button>
          </div>
        </form>
      )}

      {/* Notes wall */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>
      ) : notes.length === 0 ? (
        <div className="glass text-center py-16 rounded-3xl border border-white/5">
          <StickyNote className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">El muro está vacío... ¡Llénalo de amor!</p>
          {isEditor && <p className="text-xs text-gray-500 mt-1">Escribe la primera nota de amor arriba</p>}
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-5 space-y-5">
          {notes.map(note => {
            const styles = COLOR_STYLES[note.color] || COLOR_STYLES.pink;
            const isRemoving = removing === note.id;
            return (
              <div
                key={note.id}
                className={`break-inside-avoid group relative ${styles.bg} ${styles.text} p-5 rounded-xl shadow-xl border ${styles.border} transition-all duration-400 ${
                  isRemoving ? 'opacity-0 scale-75 translate-y-4' : 'opacity-100 scale-100'
                }`}
                style={{
                  transform: `rotate(${note.rotation}deg)`,
                  transition: 'transform 0.3s ease, opacity 0.4s ease, scale 0.4s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = `rotate(${note.rotation}deg) scale(1)`}
              >
                {/* Pin decoration */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rose-500 border-2 border-rose-300 shadow-lg z-10" />

                <p className="font-serif text-sm md:text-base leading-relaxed whitespace-pre-wrap mt-2">
                  {note.content}
                </p>

                <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between">
                  <span className="font-cursive text-lg opacity-80">Con amor, {note.created_by}</span>
                  <span className="text-[10px] font-sans opacity-50">{note.created_at.slice(0, 10).split('-').reverse().join('/')}</span>
                </div>

                {/* Delete button */}
                {isEditor && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/10 hover:bg-red-500/20 text-current/40 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
