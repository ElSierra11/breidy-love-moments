import React, { useState, useEffect } from 'react';
import Counter from './components/Counter';
import Timeline from './components/Timeline';
import Letters from './components/Letters';
import BucketList from './components/BucketList';
import LoveNotes from './components/LoveNotes';
import Auth from './components/Auth';
import { Camera, Mail, Settings, Heart, Send, Sparkles, StickyNote, Music, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

// Heart Particle Generator Component
function FloatingHearts() {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const createHeart = () => {
      const id = Math.random();
      const left = Math.random() * 100; // random horizontal start
      const duration = 5 + Math.random() * 6; // random speed between 5s and 11s
      const scale = 0.5 + Math.random() * 1.2; // random size
      const rotate = Math.random() * 360;

      const heart = { id, left, duration, scale, rotate };
      setHearts((prev) => [...prev.slice(-30), heart]); // Limit max 30 hearts on screen
    };

    const interval = setInterval(createHeart, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute text-pink-500/20 select-none"
          style={{
            left: `${h.left}%`,
            bottom: `-50px`,
            width: `${20 * h.scale}px`,
            height: `${20 * h.scale}px`,
            animation: `floatUp ${h.duration}s linear forwards`,
            transform: `rotate(${h.rotate}deg)`,
          }}
        >
          <Heart className="w-full h-full fill-current" />
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('moments');
  const [reminderStatus, setReminderStatus] = useState('');
  const [reminderLoading, setReminderLoading] = useState(false);
  const [settings, setSettings] = useState({
    spotify_playlist_url: '',
    our_song_title: '',
    spotify_embed_url: null,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [showSpotifyWidget, setShowSpotifyWidget] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/`);
        if (res.ok) {
          const data = await res.json();
          setSettings({
            spotify_playlist_url: data.spotify_playlist_url || '',
            our_song_title: data.our_song_title || 'Nuestra Canción',
            spotify_embed_url: data.spotify_embed_url,
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, [user, API_URL]);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('love_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('love_user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('love_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('love_user');
  };

  const handleCheckReminders = async () => {
    try {
      setReminderLoading(true);
      setReminderStatus('');
      const res = await fetch(`${API_URL}/api/check-reminders/`);
      const data = await res.json();
      if (res.ok) {
        if (data.emails_sent.length === 0) {
          setReminderStatus('Revisión completada: No hay correos pendientes por enviar hoy.');
        } else {
          const names = data.emails_sent.map(e => `${e.title} (${e.status})`).join(', ');
          setReminderStatus(`¡Éxito! Correos procesados: ${names}`);
        }
      } else {
        setReminderStatus('Error al verificar recordatorios.');
      }
    } catch (err) {
      setReminderStatus('Error de conexión con el servidor.');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    try {
      setSettingsLoading(true);
      setSettingsStatus('');
      const res = await fetch(`${API_URL}/api/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          spotify_playlist_url: settings.spotify_playlist_url,
          our_song_title: settings.our_song_title,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings({
          spotify_playlist_url: data.spotify_playlist_url || '',
          our_song_title: data.our_song_title || 'Nuestra Canción',
          spotify_embed_url: data.spotify_embed_url,
        });
        setSettingsStatus('¡Configuración de música guardada exitosamente!');
      } else {
        setSettingsStatus(data.error || 'Error al guardar la configuración.');
      }
    } catch (err) {
      setSettingsStatus('Error de conexión con el servidor.');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-16 flex flex-col justify-between">
      {/* Background Hearts */}
      <FloatingHearts />

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-30 w-full glass shadow-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('moments')}>
            <Heart className="w-6 h-6 text-pink-500 fill-current animate-pulse" />
            <span className="font-cursive font-bold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-rose-200 tracking-wide">
              Nuestro Espacio
            </span>
          </div>

          <Auth user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-4 md:px-8 pt-8 flex-grow">
        
        {/* Real-time Anniversary Counter Widget */}
        <section className="mb-12">
          <Counter />
        </section>

        {/* Tab Navigation Menu */}
        <div className="flex justify-start md:justify-center border-b border-white/10 mb-8 max-w-2xl mx-auto overflow-x-auto whitespace-nowrap scrollbar-none relative">
          <button
            onClick={() => setActiveTab('moments')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-300 shrink-0 ${
              activeTab === 'moments'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Momentos
          </button>
          
          <button
            onClick={() => setActiveTab('letters')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-300 shrink-0 ${
              activeTab === 'letters'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            Cartas
          </button>

          <button
            onClick={() => setActiveTab('bucket')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-300 shrink-0 ${
              activeTab === 'bucket'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Sueños
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-300 shrink-0 ${
              activeTab === 'notes'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            Muro de Notas
          </button>

          {user && (user.is_editor || ['alejosierra656@gmail.com', 'yelenabreidy@gmail.com'].includes(user.email)) && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-300 shrink-0 ${
                activeTab === 'settings'
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Ajustes
            </button>
          )}
        </div>

        {/* Component Routing */}
        <div className="transition-all duration-500">
          {activeTab === 'moments' && <Timeline user={user} />}
          {activeTab === 'letters' && <Letters user={user} />}
          {activeTab === 'bucket' && <BucketList user={user} />}
          {activeTab === 'notes' && <LoveNotes user={user} />}
          {activeTab === 'settings' && user && (user.is_editor || ['alejosierra656@gmail.com', 'yelenabreidy@gmail.com'].includes(user.email)) && (
            <div className="w-full max-w-2xl mx-auto glass rounded-3xl border border-pink-500/10 shadow-xl p-6 md:p-8 animate-fade-in space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                  <Settings className="text-pink-400 w-6 h-6" />
                  Panel de Configuración de Novios
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Aquí pueden gestionar el envío de notificaciones de correos y configuraciones del espacio.
                </p>
              </div>

              {/* Email Alerts Tester */}
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="font-semibold text-pink-300 text-sm md:text-base flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Prueba de Recordatorios por Correo
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Presiona el botón para indicarle al backend que revise si hay aniversarios, cumpleaños o navidades el día de hoy, y envíe los correos correspondientes a: 
                  <br /><strong className="text-gray-300">alejosierra656@gmail.com</strong> y <strong className="text-gray-300">yelenabreidy@gmail.com</strong>.
                </p>

                <button
                  onClick={handleCheckReminders}
                  disabled={reminderLoading}
                  className="bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {reminderLoading ? 'Comprobando...' : 'Verificar y Enviar Correos de Hoy'}
                </button>

                {reminderStatus && (
                  <div className="bg-pink-950/20 border border-pink-800/40 rounded-xl p-3 text-pink-300 text-xs">
                    {reminderStatus}
                  </div>
                )}
              </div>

              {/* Space Settings (Spotify Player) */}
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="font-semibold text-pink-300 text-sm md:text-base flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Configuración del Reproductor de Música
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Define una canción o playlist de Spotify para reproducir en el fondo de toda la aplicación.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1">Nombre de la Canción / Mensaje</label>
                    <input
                      type="text"
                      value={settings.our_song_title}
                      onChange={(e) => setSettings({ ...settings, our_song_title: e.target.value })}
                      placeholder="Nuestra Canción..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1">Enlace de Spotify (Canción, Álbum o Playlist)</label>
                    <input
                      type="text"
                      value={settings.spotify_playlist_url}
                      onChange={(e) => setSettings({ ...settings, spotify_playlist_url: e.target.value })}
                      placeholder="https://open.spotify.com/track/..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {settingsLoading ? 'Guardando...' : 'Guardar Configuración de Música'}
                </button>

                {settingsStatus && (
                  <div className="bg-pink-950/20 border border-pink-800/40 rounded-xl p-3 text-pink-300 text-xs">
                    {settingsStatus}
                  </div>
                )}
              </div>

              {/* Active SMTP Confirmation Banner */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-200/80 leading-relaxed">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Configuración de Correo SMTP Activa
                </p>
                <p>
                  El servidor de correo SMTP está configurado correctamente y listo para enviar notificaciones a sus correos cuando agreguen recuerdos, escriban cartas o cumplan sueños en su espacio de amor.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Decorative footer */}
      <footer className="relative z-10 w-full mt-12 text-center text-gray-500 text-xs px-4">
        <p className="flex items-center justify-center gap-1">
          Hecho con <Heart className="w-3.5 h-3.5 text-pink-600 fill-current" /> por Alejo para la niña más linda, Breidy Diaz Hernández.
        </p>
        <p className="mt-1 text-[10px] text-gray-600">
          © {new Date().getFullYear()} • Espacio Inmortal de Amor. Todos los derechos reservados.
        </p>
      </footer>

      {/* Floating Spotify Player Widget */}
      {settings.spotify_embed_url && (
        <div className="fixed bottom-4 right-4 z-40 max-w-[320px] w-[90vw] glass rounded-2xl border border-pink-500/20 shadow-2xl p-3 transition-all duration-300 animate-fade-in">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Music className="w-4 h-4 text-pink-400 fill-current animate-pulse shrink-0" />
              <span className="text-xs font-serif font-semibold text-white truncate">
                {settings.our_song_title || 'Música de Fondo'}
              </span>
            </div>
            <button 
              onClick={() => setShowSpotifyWidget(!showSpotifyWidget)} 
              className="text-gray-400 hover:text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
            >
              {showSpotifyWidget ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showSpotifyWidget && (
            <div className="rounded-xl overflow-hidden shadow">
              <iframe
                src={settings.spotify_embed_url}
                width="100%"
                height="80"
                frameBorder="0"
                allowFullScreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="bg-transparent"
              ></iframe>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
