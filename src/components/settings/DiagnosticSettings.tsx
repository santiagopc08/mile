import { Wifi, ShieldAlert, HelpCircle } from 'lucide-react';

interface DiagnosticSettingsProps {
  isOnline: boolean;
  pushSupported: boolean;
  pushPermission: NotificationPermission;
  isStandalone: boolean;
  isIOS: boolean;
  requestPushPermission: () => Promise<void>;
  accentHex: string;
}

export function DiagnosticSettings({
  isOnline,
  pushSupported,
  pushPermission,
  isStandalone,
  isIOS,
  requestPushPermission,
  accentHex,
}: DiagnosticSettingsProps) {
  return (
    <div className="p-4 space-y-2.5">
      <span className="text-[7.5px] text-[#a88a7e] font-black tracking-widest uppercase block mb-1">DIAGNÓSTICO PWA</span>

      {/* Connection Status */}
      <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1">
        <span className="text-stone-400">CONECTIVIDAD:</span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-none ${isOnline ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: isOnline ? accentHex : '#ef4444' }}
          />
          <span className="font-bold uppercase" style={{ color: isOnline ? '#ffffff' : '#ef4444' }}>
            {isOnline ? 'ONLINE (SYS-OK)' : 'OFFLINE (SYS-DEG)'}
          </span>
        </div>
      </div>

      {/* Push Capability */}
      <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1">
        <span className="text-stone-400">NOTIFICACIONES:</span>
        <span className={`font-bold ${pushSupported ? 'text-white' : 'text-red-400'}`}>
          {pushSupported ? 'SOPORTADO' : 'NO SOPORTADO'}
        </span>
      </div>

      {/* Push Permission Status */}
      <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1 border-b border-white/5 pb-2">
        <span className="text-stone-400">PERMISO ALERTAS:</span>
        <span className="font-bold uppercase" style={{
          color: pushPermission === 'granted' ? accentHex : pushPermission === 'denied' ? '#ef4444' : '#e5e2e1'
        }}>
          {pushPermission === 'granted' ? 'PERMITIDO' : pushPermission === 'denied' ? 'BLOQUEADO' : 'PENDIENTE'}
        </span>
      </div>

      {/* Standalone state */}
      <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1">
        <span className="text-stone-400">ENTORNO APP:</span>
        <span className="font-bold text-white uppercase">
          {isStandalone ? 'INSTALADA (PWA)' : 'NAVEGADOR'}
        </span>
      </div>

      {/* Actions / Guides based on Diagnostic */}
      <div className="mt-3 pt-2">
        {pushPermission === 'default' && pushSupported && (
          <button
            onClick={requestPushPermission}
            className="w-full flex items-center justify-center gap-1.5 border border-dashed py-2 text-[9px] font-bold uppercase tracking-wider text-white transition-colors"
            style={{ borderColor: accentHex, backgroundColor: `${accentHex}08` }}
          >
            <Wifi className="w-3 h-3 animate-pulse" style={{ color: accentHex }} />
            Activar Alertas Push
          </button>
        )}

        {pushPermission === 'denied' && (
          <div className="border border-red-500/20 bg-red-950/10 p-2 text-[8px] leading-relaxed uppercase text-red-400 flex gap-1.5 items-start">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Alertas bloqueadas. Restablece los permisos en los ajustes de tu navegador para recibir notificaciones.</span>
          </div>
        )}

        {isIOS && !isStandalone && (
          <div className="border border-white/10 bg-white/[0.02] p-3 text-[8px] uppercase tracking-normal leading-4 text-[#a88a7e] space-y-1.5">
            <div className="flex items-center gap-1 font-bold text-white">
              <HelpCircle className="w-3 h-3" style={{ color: accentHex }} />
              <span>GUÍA DE INSTALACIÓN IOS</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 font-mono text-[#e5e2e1]">
              <li>Presiona el botón "Compartir" de Safari.</li>
              <li>Selecciona "Añadir a pantalla de inicio".</li>
              <li>Abre la app instalada en tu iPhone.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
