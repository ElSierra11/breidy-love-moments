import React, { useState, useEffect } from 'react';
import { Mail, MailOpen, Lock, Calendar, Feather, Heart, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function Letters({ user }) {
  const isEditor = user && (user.is_editor || ['alejosierra656@gmail.com', 'yelenabreidy@gmail.com'].includes(user.email));
  const [letters, setLetters] = useState([]);
  const [activeLetter, setActiveLetter] = useState(null);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (user && user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${API_URL}/api/letters/`, { headers });
      const data = await res.json();
      if (res.ok) {
        setLetters(data.letters);
      } else {
        setError(data.error || 'No se pudieron cargar las cartas.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const res = await fetch(`${API_URL}/api/letters/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          title,
          content,
          unlock_date: unlockDate || null,
        }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        setUnlockDate('');
        setShowWriteForm(false);
        fetchLetters();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar la carta.');
      }
    } catch (err) {
      setError('Error al enviar la carta al servidor.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header and Write button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-white flex items-center gap-2">
            <Mail className="text-pink-400 w-8 h-8" />
            Buzón de Cartas
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Espacio para escribir cartas y mensajes de aniversario. Algunas pueden estar selladas hasta una fecha especial.
          </p>
        </div>

        {isEditor && (
          <button
            onClick={() => setShowWriteForm(!showWriteForm)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 self-start md:self-auto"
          >
            <Feather className="w-4 h-4" />
            {showWriteForm ? 'Cerrar Editor' : 'Escribir Carta'}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Form (Only for editors) */}
      {showWriteForm && isEditor && (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-3xl border border-pink-500/20 shadow-xl mb-8 animate-fade-in space-y-4">
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2 mb-2">
            <Feather className="w-5 h-5 text-pink-400" />
            Escribir nueva carta de amor
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1">Título de la Carta</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Feliz Primer Año, Para los días difíciles..."
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1">Bloquear hasta (Opcional)</label>
              <input
                type="date"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1">Contenido de la Carta</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe lo que sientes aquí..."
              required
              rows={6}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500 transition-colors font-serif resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-pink-600 hover:bg-pink-500 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-300 shadow-md shadow-pink-600/10 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" /> Sellar y Guardar Carta
            </button>
          </div>
        </form>
      )}

      {/* Grid of letters (Envelopes) */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : letters.length === 0 ? (
        <div className="glass text-center py-12 rounded-3xl border border-white/5">
          <Mail className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No hay cartas escritas todavía.</p>
          {isEditor && <p className="text-xs text-gray-500 mt-1">¡Sé el primero en redactar una carta de amor arriba!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {letters.map((letter) => {
            const isLocked = letter.is_locked;
            return (
              <div
                key={letter.id}
                onClick={() => (!isLocked || isEditor) && setActiveLetter(letter)}
                className={`relative group rounded-2xl glass p-5 cursor-pointer shadow-lg transform hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between min-h-[180px] border-t-4 ${
                  isLocked 
                    ? 'border-t-purple-500 border-white/5 opacity-80 hover:opacity-100' 
                    : 'border-t-pink-500 hover:shadow-pink-500/5'
                }`}
              >
                {/* Stamp/Wax Seal */}
                <div className="absolute -top-3.5 right-4 w-7 h-7 bg-rose-600 rounded-full flex items-center justify-center border border-rose-400/40 shadow shadow-rose-950">
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Heart className="w-3.5 h-3.5 text-white fill-current" />
                  )}
                </div>

                <div>
                  <h4 className="font-serif font-bold text-lg text-white group-hover:text-pink-300 transition-colors line-clamp-1">
                    {letter.title}
                  </h4>
                  <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">
                    <span>De:</span>
                    <span className="font-semibold text-pink-300">{letter.created_by}</span>
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    Escrita el {letter.created_at}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                  {letter.unlock_date && (
                    <span className="flex items-center gap-1 text-[11px] text-purple-300">
                      <Calendar className="w-3 h-3" />
                      Abre: {letter.unlock_date.split('-').reverse().slice(0, 2).join('/')}
                    </span>
                  )}
                  
                  <span className="text-pink-400 flex items-center gap-1 font-semibold ml-auto group-hover:underline">
                    {isLocked ? (
                      isEditor ? (
                        <span className="flex items-center gap-1">Ver (Editor) <Lock className="w-3 h-3" /></span>
                      ) : (
                        <span className="flex items-center gap-1">Bloqueada <Lock className="w-3 h-3" /></span>
                      )
                    ) : (
                      <>
                        Leer <MailOpen className="w-3 h-3" />
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Opening Letter */}
      {activeLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fcf8f2] text-amber-950 rounded-3xl max-w-2xl w-full p-8 md:p-10 relative border-8 border-[#ede4d7] shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-thin">
            {/* Wax Seal Design */}
            <div className="absolute top-4 right-4 flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                Carta de {activeLetter.created_by}
              </span>
              <button
                onClick={() => setActiveLetter(null)}
                className="text-amber-900/60 hover:text-amber-950 font-semibold text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Letter Head */}
            <div className="border-b border-amber-900/15 pb-4 mb-6">
              <h3 className="font-serif text-3xl font-bold text-amber-900 mt-2">
                {activeLetter.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-800/80 mt-1 font-medium">
                <span>Fecha de creación: {activeLetter.created_at}</span>
                {activeLetter.unlock_date && (
                  <span>• Fecha programada: {activeLetter.unlock_date}</span>
                )}
                {activeLetter.is_locked && isEditor && (
                  <span className="text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Vista Editor
                  </span>
                )}
              </div>
            </div>

            {/* Letter Content */}
            <div className="font-serif text-base md:text-lg leading-relaxed whitespace-pre-wrap text-amber-950 px-2 min-h-[150px]">
              {activeLetter.content}
            </div>

            {/* Letter Footer */}
            <div className="mt-8 pt-6 border-t border-amber-900/10 text-right">
              <span className="font-cursive text-4xl text-rose-800">
                Con mucho amor, {activeLetter.created_by}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
