import { useState, useEffect } from 'react';

// Reloj de estación aislado: gestiona su propio estado para no re-renderizar
// el hub (pesado por las animaciones del viewport) cada segundo.
export function StationClock({ accentColor }: { accentColor: string }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('es-CO', { hour12: false }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="font-mono tabular-nums" style={{ color: accentColor }}>
      {time}
    </span>
  );
}
