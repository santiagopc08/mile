import React, { useState, useEffect } from 'react';
import styles from './styles/ArcadeHUD.module.css';

/**
 * Arcade HUD displaying real-time engine telemetry.
 * React ONLY subscribes to telemetry signals via UIBridge observer.
 */
export function ArcadeHUD({ engine }) {
  const [telemetry, setTelemetry] = useState({
    score: 0,
    lives: 3,
    coins: 0,
    fps: 60,
    gameState: 'IDLE',
  });

  useEffect(() => {
    if (!engine) return;
    const unsubscribe = engine.uiBridge.subscribe(setTelemetry);
    return () => unsubscribe();
  }, [engine]);

  return (
    <div className={styles.hudContainer}>
      <div className={styles.topBar}>
        <div className={styles.scoreGroup}>
          <span className={styles.label}>SCORE</span>
          <span className={styles.value}>{telemetry.score}</span>
        </div>

        <div className={styles.livesGroup}>
          <span className={styles.label}>LIVES</span>
          <span className={`${styles.value} ${styles.livesValue}`}>
            {'♥'.repeat(Math.max(0, telemetry.lives))}
          </span>
        </div>

        <div className={styles.coinsGroup}>
          <span className={styles.label}>COINS</span>
          <span className={styles.value}>{telemetry.coins}</span>
        </div>

        <div className={styles.fpsGroup}>
          <span className={styles.label}>FPS</span>
          <span className={styles.value}>{telemetry.fps}</span>
        </div>
      </div>
    </div>
  );
}
