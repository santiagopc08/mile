import React from 'react';
import styles from './styles/Overlay.module.css';

export function GameOverUI({ score = 0, onRestart }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.title} style={{ color: '#ff0055' }}>GAME OVER</div>
        <div className={styles.subtitle}>Final Score: {score}</div>

        <button className={styles.button} onClick={onRestart}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
