import React from 'react';
import { Trophy, CircleDot, HelpCircle } from 'lucide-react';
import { StarRow } from './Shared';

interface ModalsProps {
  isVictoryModalOpen: boolean;
  isOutOfAmmoModalOpen: boolean;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  lastRun: { stars: number; shotsUsed: number; isRecord: boolean } | null;
  handleResetLevel: () => void;
  handleNextLevel: () => void;
}

export function Modals({
  isVictoryModalOpen,
  isOutOfAmmoModalOpen,
  isHelpOpen,
  setIsHelpOpen,
  lastRun,
  handleResetLevel,
  handleNextLevel,
}: ModalsProps) {
  return (
    <>
      {isVictoryModalOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-md w-full border border-[#ff4b89]/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(255,75,137,0.5)] text-center font-mono">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
              ¡ESTRUCTURA DEMOLIDA! 💥
            </h2>
            <div className="flex justify-center mb-4">
              <StarRow count={lastRun?.stars || 3} size={24} />
            </div>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              Has liberado todos los bloques de memoria usando {lastRun?.shotsUsed} disparos.
              {lastRun?.isRecord && <span className="block text-[#c3f400] font-bold mt-1">¡NUEVO RÉCORD DE EFICIENCIA! 🏆</span>}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleResetLevel}
                className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-white/20 transition-all"
              >
                REPETIR 🔄
              </button>
              <button
                onClick={handleNextLevel}
                className="flex-1 py-3 bg-gradient-to-r from-[#ff4b89] to-pink-600 text-black font-black uppercase text-xs tracking-wider rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,75,137,0.6)]"
              >
                SIGUIENTE NIVEL ⏩
              </button>
            </div>
          </div>
        </div>
      )}

      {isOutOfAmmoModalOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-md w-full border border-red-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center font-mono">
            <CircleDot className="w-12 h-12 text-red-400 mx-auto mb-3 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
              MUNICIÓN AGOTADA 🛑
            </h2>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              Te has quedado sin proyectiles antes de poder liberar todas las memorias. ¡Ajusta tu ángulo y dispara a los puntos débiles de la base!
            </p>

            <button
              onClick={handleResetLevel}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black uppercase text-sm tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_25px_rgba(239,68,68,0.6)]"
            >
              REINTENTAR 🔄
            </button>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-lg w-full border border-cyan-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.4)] text-left font-mono">
            <h3 className="text-xl font-black text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> GUÍA DE DEMOLICIÓN SMASH FEST
            </h3>
            <ul className="text-xs text-white/80 space-y-3 leading-relaxed mb-6">
              <li>🎯 <strong>Apuntar y Disparar:</strong> Haz clic y arrastra con el ratón o desliza con el dedo para ver la trayectoria parabólica. Suelta para disparar el cañón.</li>
              <li>🌀 <strong>Girar Cámara:</strong> Arrastra con dos dedos en móvil o usa el botón derecho en PC para rotar alrededor de la estructura y buscar vigas débiles.</li>
              <li>💣 <strong>Comodines Especiales:</strong> Usa las teclas 1-4 o la barra inferior para cambiar entre Balas Estándar, Bombas de Choque, Disparo Triple y Bola de Demolición.</li>
              <li>✨ <strong>Bloques de Memoria:</strong> Haz caer los bloques brillantes fuera de su pedestal para liberar los recuerdos de la relación y ganar estrellas.</li>
            </ul>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-cyan-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-cyan-400 transition-all"
            >
              ¡ENTENDIDO, A DEMOLER! 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
}
