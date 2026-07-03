import { Volume2, VolumeX, Smartphone } from 'lucide-react';

interface InteractionSettingsProps {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  toggleSound: () => void;
  toggleHaptic: () => void;
  accentHex: string;
}

export function InteractionSettings({
  soundEnabled,
  hapticEnabled,
  toggleSound,
  toggleHaptic,
  accentHex,
}: InteractionSettingsProps) {
  return (
    <div className="p-4 space-y-3 border-b border-white/10">
      <span className="text-[7.5px] text-[#a88a7e] font-black tracking-widest uppercase block mb-1">INTERACCIÓN</span>

      {/* Sound Toggle */}
      <div className="flex items-center justify-between border border-white/5 bg-black/20 px-3 py-2">
        <div className="flex items-center gap-2">
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5" style={{ color: accentHex }} />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-stone-500" />
          )}
          <span className="text-[10px] font-bold text-white uppercase">Efectos Sonoros</span>
        </div>
        <button
          onClick={toggleSound}
          className="border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all"
          style={{
            borderColor: soundEnabled ? accentHex : 'rgba(255,255,255,0.1)',
            color: soundEnabled ? accentHex : '#a88a7e',
            backgroundColor: soundEnabled ? `${accentHex}11` : 'transparent'
          }}
        >
          {soundEnabled ? 'ACTIVO' : 'INACTIVO'}
        </button>
      </div>

      {/* Haptics Toggle */}
      <div className="flex items-center justify-between border border-white/5 bg-black/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5" style={{ color: hapticEnabled ? accentHex : undefined }} />
          <span className="text-[10px] font-bold text-white uppercase">Vibración Háptica</span>
        </div>
        <button
          onClick={toggleHaptic}
          className="border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all"
          style={{
            borderColor: hapticEnabled ? accentHex : 'rgba(255,255,255,0.1)',
            color: hapticEnabled ? accentHex : '#a88a7e',
            backgroundColor: hapticEnabled ? `${accentHex}11` : 'transparent'
          }}
        >
          {hapticEnabled ? 'ACTIVO' : 'INACTIVO'}
        </button>
      </div>
    </div>
  );
}
