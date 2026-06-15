import React, { useState, useEffect } from 'react';
import {
  Sparkles, CheckCircle2, Circle, Trash2, Plus, X,
  PlaneTakeoff, Waves, Heart, UtensilsCrossed, Palette, Home, Star,
  Loader2, Trophy, AlertCircle, AlignLeft, Tag,
} from 'lucide-react';

const CATEGORY_META = {
  viaje:     { label: 'Viajes',    Icon: PlaneTakeoff,    color: 'from-sky-500/20 to-blue-600/10',     badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  aventura:  { label: 'Aventuras', Icon: Waves,           color: 'from-teal-500/20 to-emerald-600/10', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  romantico: { label: 'Romántico', Icon: Heart,           color: 'from-pink-500/20 to-rose-600/10',    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  comida:    { label: 'Comida',    Icon: UtensilsCrossed, color: 'from-orange-500/20 to-amber-600/10', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  cultura:   { label: 'Cultura',   Icon: Palette,         color: 'from-violet-500/20 to-purple-600/10',badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  hogar:     { label: 'Hogar',     Icon: Home,            color: 'from-yellow-500/20 to-amber-600/10', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  otro:      { label: 'Otro',      Icon: Star,            color: 'from-gray-500/20 to-slate-600/10',   badge: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
};

export default function BucketList({ user }) {
  const isEditor = user && (user.is_editor || ['alejosierra656@gmail.com', 'yelenabreidy@gmail.com'].includes(user.email));
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState('romantico');
  const [filter, setFilter]           = useState('all');
  const [error, setError]             = useState('');
  const [celebrating, setCelebrating] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const fetchItems = async () => {
    setLoading(true);
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const res = await fetch(`${API_URL}/api/bucketlist/`, { headers });
      const data = await res.json();
      if (res.ok) setItems(data.items);
    } catch { setError('Error al conectar con el servidor.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/bucketlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ title, category, emoji: category }),
      });
      if (res.ok) { setTitle(''); setShowForm(false); fetchItems(); }
    } catch { setError('Error al añadir ítem.'); }
  };

  const handleToggle = async (item) => {
    try {
      const res = await fetch(`${API_URL}/api/bucketlist/${item.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ is_completed: !item.is_completed }),
      });
      if (res.ok) {
        if (!item.is_completed) setCelebrating(item.id);
        setTimeout(() => setCelebrating(null), 1800);
        fetchItems();
      }
    } catch { setError('Error al actualizar.'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/api/bucketlist/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchItems();
    } catch { setError('Error al eliminar.'); }
  };

  const pending   = items.filter(i => !i.is_completed);
  const completed = items.filter(i => i.is_completed);
  const displayed = filter === 'pending' ? pending : filter === 'completed' ? completed : items;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-pink-400 w-8 h-8" />
            Lista de Sueños
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Todo lo que queremos vivir juntos.{' '}
            <span className="text-pink-400 font-semibold">{completed.length}/{items.length}</span> sueños cumplidos
          </p>
        </div>
        {isEditor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 self-start md:self-auto"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Añadir Sueño'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> Progreso de Sueños</span>
            <span>{Math.round((completed.length / items.length) * 100)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-700"
              style={{ width: `${(completed.length / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Add form */}
      {showForm && isEditor && (
        <form onSubmit={handleAdd} className="glass p-6 rounded-3xl border border-pink-500/20 shadow-xl mb-8 animate-fade-in space-y-4">
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" /> Nuevo Sueño Juntos
          </h3>
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" /> ¿Qué quieren hacer juntos?
            </label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Ver el amanecer en la playa, Cocinar pasta juntos..."
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Categoría
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const { Icon } = meta;
                return (
                  <button
                    key={key} type="button"
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      category === key
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300 scale-105'
                        : 'border-white/10 bg-black/30 text-gray-400 hover:border-pink-500/40 hover:text-pink-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate w-full text-center">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Agregar Sueño
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[['all','Todos'], ['pending','Por Cumplir'], ['completed','Cumplidos']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 ${
              filter === val ? 'bg-pink-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}>
            {val === 'completed' && <CheckCircle2 className="w-3 h-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass text-center py-16 rounded-3xl border border-white/5">
          <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">{filter === 'completed' ? '¡Aún no han cumplido ningún sueño juntos!' : 'No hay sueños en esta lista.'}</p>
          {isEditor && filter !== 'completed' && <p className="text-xs text-gray-500 mt-1">¡Sé el primero en añadir uno arriba!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayed.map(item => {
            const cat = CATEGORY_META[item.category] || CATEGORY_META.otro;
            const { Icon: CatIcon } = cat;
            const isCelebrating = celebrating === item.id;
            return (
              <div key={item.id}
                className={`relative group glass rounded-2xl p-5 border transition-all duration-500 overflow-hidden ${
                  item.is_completed
                    ? 'border-pink-500/20 opacity-80'
                    : 'border-white/5 hover:border-pink-400/30 hover:-translate-y-1'
                } ${isCelebrating ? 'animate-bounce border-pink-500/60' : ''}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-40 pointer-events-none`} />

                <div className="relative flex items-start gap-4">
                  {/* Category icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cat.badge} border`}>
                    <CatIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-base leading-snug transition-all duration-300 ${
                      item.is_completed ? 'line-through text-gray-400' : 'text-white'
                    }`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${cat.badge}`}>
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Propuesto por <span className="text-pink-400">{item.created_by}</span>
                      </span>
                    </div>
                    {item.is_completed && item.completed_at && (
                      <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Cumplido el {item.completed_at.split('-').reverse().join('/')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {isEditor && (
                      <button onClick={() => handleToggle(item)}
                        className={`transition-all duration-300 ${item.is_completed ? 'text-pink-400 hover:text-gray-400' : 'text-gray-500 hover:text-emerald-400'}`}>
                        {item.is_completed
                          ? <CheckCircle2 className="w-6 h-6 fill-pink-500 text-pink-400" />
                          : <Circle className="w-6 h-6" />
                        }
                      </button>
                    )}
                    {isEditor && (
                      <button onClick={() => handleDelete(item.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Celebration overlay */}
                {isCelebrating && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Trophy className="w-12 h-12 text-amber-400 animate-bounce drop-shadow-lg" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
