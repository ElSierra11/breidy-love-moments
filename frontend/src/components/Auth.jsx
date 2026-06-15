import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogIn, LogOut, ShieldAlert, User, CheckCircle } from 'lucide-react';

export default function Auth({ user, onLogin, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  useEffect(() => {
    // We can try to load the Google script dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // When the modal opens, we initialize Google Identity if we have a client ID
  useEffect(() => {
    if (isOpen) {
      // Define the callback globally so Google script can reach it
      window.handleGoogleCredential = async (response) => {
        try {
          setError('');
          const res = await fetch(`${API_URL}/api/auth/google-login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential: response.credential }),
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess('Sesión iniciada con éxito con Google');
            setTimeout(() => {
              onLogin(data);
              setIsOpen(false);
              setSuccess('');
            }, 1500);
          } else {
            setError(data.error || 'No se pudo iniciar sesión con Google.');
          }
        } catch (err) {
          setError('Error al conectar con el servidor.');
        }
      };

      // Try to render the google button if window.google is loaded
      if (window.google) {
        // Fetch or guess client ID, or ask the user to provide it.
        // We will default to a placeholder, or we can check if it exists in environment.
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        setGoogleClientId(clientId);
        
        if (clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: window.handleGoogleCredential,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'outline', size: 'large', shape: 'pill', width: '250' }
          );
        }
      }
    }
  }, [isOpen, googleClientId]);

  return (
    <div>
      {/* Auth Button in Header */}
      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/30">
            <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
            <span className="text-xs md:text-sm font-semibold text-pink-300">{user.name}</span>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold px-4.5 py-1.5 rounded-full text-sm transition-all duration-300 shadow-md shadow-pink-600/20"
        >
          <LogIn className="w-4 h-4" />
          Acceso Editor
        </button>
      )}

      {/* Modal rendered via Portal to escape sticky glass header limitations */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass rounded-3xl max-w-md w-full p-6 relative border border-white/10 shadow-2xl animate-fade-in">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              &times;
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-pink-500/10 rounded-full border border-pink-500/30 text-pink-400 mb-3">
                <User className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">Espacio de Novios</h3>
              <p className="text-gray-400 text-sm mt-1">
                Autentícate para poder gestionar vuestra página de recuerdos.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-300 text-xs flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-4 py-2">
              {/* Google login container */}
              {googleClientId ? (
                <div className="flex flex-col items-center gap-2">
                  <div id="google-signin-btn"></div>
                </div>
              ) : (
                <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-xs mb-2 max-w-xs">
                  <p className="font-semibold">Nota de Google Auth:</p>
                  <p className="mt-1">
                    Crea tu Google Client ID en tu panel y agrégalo en tu `.env` para usar Google Login real.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
