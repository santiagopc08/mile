import React, { useEffect, useRef, useState } from 'react';
import { ArcadeEngine } from './engine/ArcadeEngine.js';
import { TechnicalDemoPlugin } from './demo/TechnicalDemoPlugin.js';
import { PacmanPlugin } from './pacman/PacmanPlugin.js';
import { TechnicalHUD } from './demo/ui/TechnicalHUD.jsx';
import { PacmanHUD } from './pacman/ui/PacmanHUD.jsx';
import { PauseUI } from './ui/PauseUI.jsx';

export function App() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [engineInstance, setEngineInstance] = useState(null);
  const [activeGameId, setActiveGameId] = useState('pacman');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Arcade Engine Facade
    const engine = new ArcadeEngine({
      container: containerRef.current,
      cameraMode: 'orthographic',
      debug: false,
    });

    engineRef.current = engine;
    setEngineInstance(engine);

    // Listen to Pause/Resume events
    let disposed = false;

    const unsubPause = engine.eventBus.on('GamePaused', () => setIsPaused(true));
    const unsubResume = engine.eventBus.on('GameResumed', () => setIsPaused(false));

    // Initial Plugin Load (Pac-Man).
    // La guarda `disposed` evita arrancar un engine que ya fue destruido: en
    // StrictMode el efecto se monta dos veces y el cleanup corre antes de que
    // loadGame resuelva, dejando un engine zombi con su propio rAF vivo.
    engine.loadGame(new PacmanPlugin()).then(() => {
      if (disposed) return;
      engine.start();
    });

    return () => {
      disposed = true;
      unsubPause();
      unsubResume();
      engine.destroy();
      engineRef.current = null;
      setEngineInstance(null);
    };
  }, []);

  const handleSwitchGame = async (gameId) => {
    if (!engineRef.current || gameId === activeGameId) return;

    setActiveGameId(gameId);
    let plugin;

    switch (gameId) {
      case 'demo':
        plugin = new TechnicalDemoPlugin();
        break;
      case 'pacman':
        plugin = new PacmanPlugin();
        break;
      default:
        return;
    }

    await engineRef.current.loadGame(plugin);
    engineRef.current.start();
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000000' }}>
      {/* Top Arcade Engine Plugin Switcher Bar */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        gap: 8,
        background: 'rgba(10, 10, 25, 0.85)',
        border: '1px solid rgba(0, 255, 170, 0.3)',
        padding: '6px 12px',
        borderRadius: 24,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}>
        <button
          onClick={() => handleSwitchGame('pacman')}
          style={{
            background: activeGameId === 'pacman' ? 'linear-gradient(135deg, #ffff00, #ffaa00)' : 'transparent',
            color: activeGameId === 'pacman' ? '#000' : '#8888aa',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 16,
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          🟡 PAC-MAN
        </button>

        <button
          onClick={() => handleSwitchGame('demo')}
          style={{
            background: activeGameId === 'demo' ? 'linear-gradient(135deg, #00ffaa, #00dbe9)' : 'transparent',
            color: activeGameId === 'demo' ? '#000' : '#8888aa',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 16,
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          🕹️ DEMO TÉCNICA
        </button>

        <button
          disabled
          style={{
            background: 'transparent',
            color: '#444455',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 16,
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'not-allowed',
          }}
        >
          🐍 SNAKE (Próximamente)
        </button>

        <button
          disabled
          style={{
            background: 'transparent',
            color: '#444455',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 16,
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'not-allowed',
          }}
        >
          🧱 BREAKOUT (Próximamente)
        </button>

        <button
          disabled
          style={{
            background: 'transparent',
            color: '#444455',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 16,
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'not-allowed',
          }}
        >
          👾 SPACE INVADERS (Próximamente)
        </button>
      </div>

      {/* 3D WebGL Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Active Game HUD */}
      {engineInstance && activeGameId === 'pacman' && <PacmanHUD engine={engineInstance} />}
      {engineInstance && activeGameId === 'demo' && <TechnicalHUD engine={engineInstance} />}

      {/* Global Pause UI */}
      {isPaused && <PauseUI onResume={handleResume} />}
    </div>
  );
}

export default App;
