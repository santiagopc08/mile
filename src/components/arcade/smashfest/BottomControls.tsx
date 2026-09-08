import React from 'react';
import {
  Zap,
  Bomb,
  Hammer,
  CircleDot,
} from 'lucide-react';
import {
  MAX_SHOT_POWER,
  MIN_SHOT_POWER,
  type WildcardType,
  type WildcardAmmo,
} from '@/app/smash-fest/components/SmashFestGame';

interface BottomControlsProps {
  activeWildcard: WildcardType;
  setActiveWildcard: (wildcard: WildcardType) => void;
  wildcardAmmo: WildcardAmmo;
  shotPower: number;
  setShotPower: (power: number) => void;
  overcharge: number;
}

export function BottomControls({
  activeWildcard,
  setActiveWildcard,
  wildcardAmmo,
  shotPower,
  setShotPower,
  overcharge,
}: BottomControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
      <div className="flex items-center gap-1.5 bg-black/85 border border-white/20 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto">
        {[
          { id: 'standard' as const, label: 'ESTÁNDAR', icon: CircleDot, count: '∞', color: '#ff4b89', shortcut: '1' },
          { id: 'bomb' as const, label: 'BOMBA', icon: Bomb, count: wildcardAmmo.bomb, color: '#f43f5e', shortcut: '2' },
          { id: 'triple' as const, label: 'TRIPLE', icon: Zap, count: wildcardAmmo.triple, color: '#38bdf8', shortcut: '3' },
          { id: 'heavy' as const, label: 'DEMOLEDOR', icon: Hammer, count: wildcardAmmo.heavy, color: '#f59e0b', shortcut: '4' },
        ].map((wc) => {
          const Icon = wc.icon;
          const isSelected = activeWildcard === wc.id;
          const isAvailable = wc.id === 'standard' || Number(wc.count) > 0;

          return (
            <button
              key={wc.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && setActiveWildcard(wc.id)}
              className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-[#ff4b89]/30 border-[#ff4b89] shadow-[0_0_15px_rgba(255,75,137,0.5)] scale-105'
                  : isAvailable
                  ? 'border-white/10 hover:border-white/30 hover:bg-white/5'
                  : 'border-white/5 opacity-30 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" style={{ color: wc.color }} />
                <span className="text-[8px] font-mono text-white/50">{wc.shortcut}</span>
              </div>
              <span className="text-[9px] font-bold uppercase text-white mt-0.5">{wc.label}</span>
              <span className="text-[10px] font-black text-white/80 tabular-nums">({wc.count})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-black/85 border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col gap-1.5 min-w-[170px]">
        <div className="flex items-center justify-between text-[9px] font-bold">
          <span className="text-white/60 uppercase">POTENCIA DISPARO</span>
          <span className={shotPower > 1.0 ? 'text-[#c3f400] font-black animate-pulse' : 'text-white'}>
            {Math.round(shotPower * 100)}% {shotPower > 1.0 && `(SOBRECARGA ${overcharge})`}
          </span>
        </div>
        <input
          type="range"
          min={MIN_SHOT_POWER}
          max={overcharge > 0 ? MAX_SHOT_POWER : 1.0}
          step={0.05}
          value={shotPower}
          onChange={(e) => setShotPower(parseFloat(e.target.value))}
          className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#ff4b89]"
        />
      </div>
    </div>
  );
}
