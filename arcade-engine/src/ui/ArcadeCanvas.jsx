import React, { useEffect, useRef, useState } from 'react';
import { ArcadeEngine } from '../engine/ArcadeEngine.js';
import { ArcadeHUD } from './ArcadeHUD.jsx';
import { MainMenuUI } from './MainMenuUI.jsx';
import { PauseUI } from './PauseUI.jsx';
import { GameOverUI } from './GameOverUI.jsx';

/**
 * Arcade Canvas React Component.
 * Mounts ArcadeEngine instance outside React render loop.
 */
export function ArcadeCanvas({ gamePlugin, debug = true }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [engineInstance, setEngineInstance] = useState(null);
  const [gameState, setGameState] = useState('MAIN_MENU'); // 'MAIN_MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate Arcade Engine
    const engine = new ArcadeEngine({
      container: containerRef.current,
      cameraMode: 'orthographic',
      debug: debug,
    });

    engineRef.current = engine;
    setEngineInstance(engine);

    // Register UI bridge state updates
    const unsubscribe = engine.uiBridge.subscribe((state) => {
      if (state.gameState === 'GAMEOVER') {
        setFinalScore(state.score);
        setGameState('GAMEOVER');
      }
    });

    // Load Plugin
    if (gamePlugin) {
      engine.loadGame(gamePlugin).then(() => {
        engine.start();
      });
    }

    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
      setEngineInstance(null);
    };
  }, [gamePlugin, debug]);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.uiBridge.reset();
      engineRef.current.resume();
      setGameState('PLAYING');
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setGameState('PAUSED');
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
      setGameState('PLAYING');
    }
  };

  const handleRestart = () => {
    if (engineRef.current && gamePlugin) {
      engineRef.current.uiBridge.reset();
      engineRef.current.loadGame(gamePlugin).then(() => {
        engineRef.current.resume();
        setGameState('PLAYING');
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* React UI Overlays */}
      {engineInstance && <ArcadeHUD engine={engineInstance} />}

      {gameState === 'MAIN_MENU' && (
        <MainMenuUI onStartGame={handleStartGame} gameTitle={gamePlugin ? gamePlugin.name : 'ARCADE ENGINE'} />
      )}

      {gameState === 'PAUSED' && <PauseUI onResume={handleResume} />}

      {gameState === 'GAMEOVER' && <GameOverUI score={finalScore} onRestart={handleRestart} />}
    </div>
  );
}
