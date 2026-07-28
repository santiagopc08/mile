import React, { useState, useEffect } from 'react';
import styles from './TechnicalHUD.module.css';

export function TechnicalHUD({ engine }) {
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    score: 0,
    gameState: 'IDLE',
  });

  const [cameraMode, setCameraMode] = useState('PERSPECTIVE');
  const [eventLog, setEventLog] = useState([]);

  useEffect(() => {
    if (!engine) return;

    // Subscribe to UIBridge Telemetry
    const unsubTelemetry = engine.uiBridge.subscribe(setTelemetry);

    // Subscribe to Camera Mode changes
    const unsubCamera = engine.eventBus.on('CameraChanged', ({ mode }) => {
      setCameraMode(mode);
    });

    // Event Logger
    const logEvent = (name, data) => {
      const timeStr = new Date().toLocaleTimeString().split(' ')[0];
      const payloadStr = data ? JSON.stringify(data) : '';
      setEventLog((prev) => [
        { id: Math.random(), time: timeStr, text: `[${name}] ${payloadStr}` },
        ...prev.slice(0, 15), // Keep last 16 events
      ]);
    };

    const unsubEvents = [
      engine.eventBus.on('PlayerMoved', (d) => logEvent('PlayerMoved', d)),
      engine.eventBus.on('ObjectCollected', (d) => logEvent('ObjectCollected', d)),
      engine.eventBus.on('PortalEntered', (d) => logEvent('PortalEntered', d)),
      engine.eventBus.on('CollisionDetected', (d) => logEvent('CollisionDetected', d)),
      engine.eventBus.on('AudioPlayed', (d) => logEvent('AudioPlayed', d)),
      engine.eventBus.on('ObjectPoolSpawned', (d) => logEvent('ObjectPoolSpawned', d)),
      engine.eventBus.on('ObjectPoolDespawned', (d) => logEvent('ObjectPoolDespawned', d)),
    ];

    return () => {
      unsubTelemetry();
      unsubCamera();
      unsubEvents.forEach((unsub) => unsub());
    };
  }, [engine]);

  return (
    <div className={styles.hudContainer}>
      <div className={styles.topBar}>
        <div className={styles.badge}>
          <div className={styles.title}>Arcade Engine Technical Demo</div>
          <div className={styles.statRow}>
            <span><span className={styles.label}>FPS:</span> <span className={styles.value}>{telemetry.fps}</span></span>
            <span><span className={styles.label}>CAMERA:</span> <span className={styles.cameraValue}>{cameraMode}</span></span>
            <span><span className={styles.label}>SCORE:</span> <span className={styles.value}>{telemetry.score}</span></span>
          </div>

          <div className={styles.controlsBar}>
            <strong>CONTROLS:</strong> WASD/Arrows (Move) | SHIFT (Sprint) | F1 (Debug) | F2 (Camera) | F3 (Spawn 200 Pool) | F4 (Despawn Pool) | F5 (Reset) | ESC (Pause)
          </div>
        </div>
      </div>

      {/* Scrolling Event Log Overlay Panel */}
      <div className={styles.eventLogPanel}>
        <div className={styles.eventLogTitle}>⚡ EventBus Live Telemetry</div>
        {eventLog.length === 0 ? (
          <div className={styles.eventItem} style={{ color: '#888' }}>Awaiting engine events...</div>
        ) : (
          eventLog.map((ev) => (
            <div key={ev.id} className={styles.eventItem}>
              <span className={styles.eventTime}>{ev.time}</span>
              <span>{ev.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
