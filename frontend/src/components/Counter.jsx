import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Lock, X } from 'lucide-react';

const START_DATE = new Date('2026-02-14T00:00:00');

const MILESTONE_MESSAGES = {
  1:  { title: '¡1 Mes Juntos!',     msg: 'El primer mes fue lleno de mariposas, risas nerviosas y descubrir lo maravillosos que son el uno para el otro. ¡El inicio de algo eterno!' },
  2:  { title: '¡2 Meses de Amor!',  msg: 'Dos meses construyendo una historia única. Ya conocen sus risas favoritas, sus manías y siguen eligiéndose cada día. ¡Eso es amor de verdad!' },
  3:  { title: '¡3 Meses Enamorados!',msg: 'Tres meses y el corazón sigue latiendo igual de fuerte. Han superado los primeros momentos difíciles y salieron más fuertes. ¡Son increíbles juntos!' },
  4:  { title: '¡Felices 4 Meses!',   msg: '¡Hoy se cumplen exactamente 4 meses desde que eligieron amarse el 14 de febrero de 2026! Cuatro meses de recuerdos, risas, planes y un amor que no para de crecer. ¡Por muchísimos meses más, Breidy!' },
  5:  { title: '¡5 Meses de Historia!', msg: 'Cinco meses y siguen escribiendo capítulos hermosos juntos. ¡Ya casi medio año de amor!' },
  6:  { title: '¡Medio Año de Amor!', msg: '¡6 meses — medio año entero de risas, abrazos y momentos que atesorarán para siempre. Son la prueba de que el amor más bonito existe!' },
};

export default function Counter() {
  const [timeElapsed, setTimeElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMonths: 0 });
  const [activeModal, setActiveModal] = useState(null);
  const today = new Date();

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = now.getTime() - START_DATE.getTime();
      if (diff <= 0) return;

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));

      let totalMonths = (now.getFullYear() - START_DATE.getFullYear()) * 12 + (now.getMonth() - START_DATE.getMonth());
      if (now.getDate() < START_DATE.getDate()) totalMonths--;

      setTimeElapsed({ days, hours, minutes, seconds, totalMonths });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAnniversaryDay = today.getDate() === 14;

  // Calculate milestone months to show (current + 2 upcoming)
  const milestonesShown = Math.max(6, timeElapsed.totalMonths + 2);

  const getMilestoneInfo = (month) => {
    const unlockDate = new Date(START_DATE);
    unlockDate.setMonth(unlockDate.getMonth() + month);
    const isUnlocked = today >= unlockDate;
    const daysUntil  = Math.ceil((unlockDate - today) / (1000 * 60 * 60 * 24));
    return { unlockDate, isUnlocked, daysUntil };
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {/* Pulse heart */}
      <div className="relative mb-6 cursor-pointer group">
        <div className="absolute inset-0 bg-pink-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
        <div className="relative bg-gradient-to-tr from-pink-500 to-rose-400 p-6 rounded-full shadow-lg border border-pink-300/30 animate-heartbeat">
          <Heart className="w-16 h-16 text-white fill-current" />
        </div>
      </div>

      <h1 className="font-cursive text-6xl md:text-7xl font-bold text-pink-400 mb-3 drop-shadow-lg tracking-wide">
        Breidy &amp; Alejo
      </h1>
      <p className="text-gray-200 text-base md:text-lg font-medium max-w-md mb-8 leading-relaxed">
        Nuestra historia de amor comenzó el <span className="text-pink-300 font-bold">14 de Febrero de 2026</span>. Cada segundo a tu lado es un regalo del cielo.
      </p>

      {/* Time counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full mb-8">
        {[
          { label: 'Días',    value: timeElapsed.days    },
          { label: 'Horas',   value: timeElapsed.hours   },
          { label: 'Minutos', value: timeElapsed.minutes },
          { label: 'Segundos',value: timeElapsed.seconds },
        ].map((item, idx) => (
          <div key={idx} className="glass p-4 rounded-2xl flex flex-col justify-center items-center shadow-lg transform hover:scale-105 transition-all duration-300">
            <span className="text-3xl md:text-4xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">
              {String(item.value).padStart(2, '0')}
            </span>
            <span className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold mt-1">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Anniversary banner */}
      <div className="glass-accent py-4 px-6 rounded-2xl max-w-xl w-full shadow-md mb-10">
        {isAnniversaryDay ? (
          <div>
            <p className="text-pink-300 font-serif font-bold text-lg md:text-xl animate-pulse">¡Feliz Aniversario Mensual!</p>
            <p className="text-gray-200 text-xs md:text-sm mt-1">
              Hoy cumplimos exactamente <span className="text-pink-400 font-semibold">{timeElapsed.totalMonths} meses</span> juntos. ¡Por miles de meses más, Breidy!
            </p>
          </div>
        ) : (
          <p className="text-gray-200 text-xs md:text-sm">
            Llevamos <span className="text-pink-400 font-semibold">{timeElapsed.days} días</span> construyendo recuerdos, risas y momentos inolvidables.
          </p>
        )}
      </div>

      {/* Monthly Milestones */}
      <div className="w-full max-w-2xl">
        <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
          <Heart className="text-pink-400 w-5 h-5 fill-current" />
          Nuestros Hitos de Amor
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: milestonesShown }, (_, i) => i + 1).map(month => {
            const { isUnlocked, daysUntil } = getMilestoneInfo(month);
            const isToday = timeElapsed.totalMonths === month && isAnniversaryDay;
            return (
              <button
                key={month}
                onClick={() => isUnlocked && setActiveModal(month)}
                className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  isUnlocked
                    ? isToday
                      ? 'bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-500/40 animate-heartbeat scale-110'
                      : 'bg-gradient-to-br from-pink-500/30 to-rose-600/20 text-pink-300 hover:scale-110 hover:shadow-md hover:shadow-pink-500/20 border border-pink-500/30 cursor-pointer'
                    : 'bg-white/5 text-gray-600 border border-white/5 cursor-default'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <Heart className={`w-5 h-5 mb-0.5 ${isToday ? 'fill-white text-white' : 'fill-pink-400 text-pink-400'}`} />
                    <span>{month}m</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mb-0.5 text-gray-500" />
                    <span className="text-[10px] text-gray-500">{daysUntil}d</span>
                  </>
                )}
                {isToday && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[8px] font-black px-1 rounded-full">HOY</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-gray-500 text-[10px] mt-3">Toca un corazón para ver el mensaje de ese mes</p>
      </div>

      {/* Milestone Modal rendered via Portal to escape layout context restrictions */}
      {activeModal && MILESTONE_MESSAGES[activeModal] && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#1a0d20] border border-pink-500/30 rounded-3xl max-w-md w-full p-8 relative shadow-2xl shadow-pink-900/30"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex p-4 bg-pink-500/10 rounded-full border border-pink-500/30 mb-4">
                <Heart className="w-10 h-10 text-pink-400 fill-pink-400" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-white mb-3">{MILESTONE_MESSAGES[activeModal].title}</h3>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">{MILESTONE_MESSAGES[activeModal].msg}</p>
              <div className="mt-6 font-cursive text-4xl font-bold text-pink-400 flex items-center justify-center gap-1.5 tracking-wide">
                Breidy &amp; Alejo
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
