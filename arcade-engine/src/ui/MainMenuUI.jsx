import React from 'react';
import styles from './styles/Overlay.module.css';

export function MainMenuUI({ onStartGame, gameTitle = 'ARCADE ENGINE' }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.title}>{gameTitle}</div>
        <div className={styles.subtitle}>Modular 2D/2.5D Engine Workbench</div>

        <button className={styles.button} onClick={onStartGame}>
          START GAME
        </button>
      </div>
    </div>
  );
}
