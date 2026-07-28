import React from 'react';
import styles from './styles/Overlay.module.css';

export function PauseUI({ onResume }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.title}>PAUSED</div>
        <div className={styles.subtitle}>Game Simulation Suspended</div>

        <button className={styles.button} onClick={onResume}>
          RESUME
        </button>
      </div>
    </div>
  );
}
