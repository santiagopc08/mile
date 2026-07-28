import React, { useState, useEffect } from 'react';
import styles from './PacmanHUD.module.css';
import { PacmanEvents } from '../PacmanEvents.js';
import { PacmanSaveManager } from '../PacmanSaveManager.js';

export function PacmanHUD({ engine }) {
  const saveManager = new PacmanSaveManager();
  const [highScore, setHighScore] = useState(saveManager.getHighScore());
  const [telemetry, setTelemetry] = useState({
    score: 0,
    lives: 3,
    level: 1,
    fps: 60,
  });

  useEffect(() => {
    if (!engine) return;

    const unsubTelemetry = engine.uiBridge.subscribe(setTelemetry);

    const unsubHighScore = engine.eventBus.on(PacmanEvents.HIGH_SCORE_CHANGED, (val) => setHighScore(val));
    const unsubLives = engine.eventBus.on(PacmanEvents.LIVES_CHANGED, (val) => setTelemetry((prev) => ({ ...prev, lives: val })));
    const unsubLevel = engine.eventBus.on(PacmanEvents.LEVEL_CHANGED, (val) => setTelemetry((prev) => ({ ...prev, level: val })));

    return () => {
      unsubTelemetry();
      unsubHighScore();
      unsubLives();
      unsubLevel();
    };
  }, [engine]);

  return (
    <div className={styles.hudContainer}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <span className={styles.label}>1UP</span>
          <span className={styles.value}>{telemetry.score}</span>
        </div>

        <div className={styles.badge} style={{ alignItems: 'center' }}>
          <span className={styles.label}>HIGH SCORE</span>
          <span className={`${styles.value} ${styles.highScoreValue}`}>{highScore}</span>
        </div>

        <div className={styles.badge} style={{ alignItems: 'flex-end' }}>
          <span className={styles.label}>LIVES & LEVEL</span>
          <div className={styles.livesRow}>
            <span>{'🟡'.repeat(Math.max(0, telemetry.lives))}</span>
            <span style={{ fontSize: '11px', color: '#00ffff', alignSelf: 'center', marginLeft: '8px' }}>
              LVL {telemetry.level}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.controlsNote}>
        <strong>CONTROLS:</strong> WASD / Arrows (Move) | ESC / P (Pause)
      </div>
    </div>
  );
}
