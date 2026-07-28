import React, { useMemo, useEffect, useRef, useState } from 'react';
import { ArcadeEngine } from './engine/ArcadeEngine.js';
import { PacmanPlugin } from './pacman/PacmanPlugin.js';
import { PacmanHUD } from './pacman/ui/PacmanHUD.jsx';
import { PauseUI } from './ui/PauseUI.jsx';

export function App() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [engineInstance, setEngineInstance] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const plugin = useMemo(() => new PacmanPlugin(), []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate Arcade Engine Facade
    const engine = new ArcadeEngine({
      container: containerRef.current,
      cameraMode: 'orthographic',
      debug: false,
    });

    engineRef.current = engine;
    setEngineInstance(engine);

    // Listen to Pause/Resume events
    const unsubPause = engine.eventBus.on('GamePaused', () => setIsPaused(true));
    const unsubResume = engine.eventBus.on('GameResumed', () => setIsPaused(false));

    // Load Pacman Game Plugin
    engine.loadGame(plugin).then(() => {
      engine.start();
    });

    return () => {
      unsubPause();
      unsubResume();
      engine.destroy();
      engineRef.current = null;
      setEngineInstance(null);
    };
  }, [plugin]);

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000000' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* React UI Overlays */}
      {engineInstance && <PacmanHUD engine={engineInstance} />}
      {isPaused && <PauseUI onResume={handleResume} />}
    </div>
  );
}

export default App;
