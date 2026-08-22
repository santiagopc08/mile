/**
 * arcadeAudio.ts — Motor de sonido sintetizado procedural (Web Audio API)
 * para los juegos arcade del ecosistema C++ (Brick Storm, Void Runner, Pac-Man).
 *
 * Cero dependencias externas ni archivos de audio estáticos.
 * Sintetiza ondas senoidales, cuadradas, sierra y ruido blanco en tiempo real.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let noiseBuffer: AudioBuffer | null = null;

const BASE_VOLUME = 0.25;
const STORAGE_KEY = 'arcade_audio_muted';

function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : BASE_VOLUME;
        master.connect(ctx.destination);

        // Buffer de ruido blanco precalculado (1 segundo a sampleRate)
        const len = Math.floor(ctx.sampleRate * 1.0);
        noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    return ctx;
}

export function initArcadeAudio() {
    ensureContext();
}

export function loadMutedPreference(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        muted = window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        muted = false;
    }
    if (master) master.gain.value = muted ? 0 : BASE_VOLUME;
    return muted;
}

export function setMuted(m: boolean) {
    muted = m;
    if (master && ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.value = m ? 0 : BASE_VOLUME;
    }
    try {
        window.localStorage.setItem(STORAGE_KEY, m ? '1' : '0');
    } catch {
        // noop
    }
}

export function isMuted(): boolean {
    return muted;
}

// ─── Primitivas de Sonido ──────────────────────────────────────────────────

function tone(freq: number, type: OscillatorType, dur: number, gain = 0.3, glideTo?: number) {
    const c = ensureContext();
    if (!c || !master || muted) return;

    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);
    }

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(master);

    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, filterFreq = 1000, gain = 0.3) {
    const c = ensureContext();
    if (!c || !master || !noiseBuffer || muted) return;

    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(50, t0 + dur);

    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(master);

    src.start(t0);
    src.stop(t0 + dur + 0.05);
}

// ─── Efectos para Brick Storm ──────────────────────────────────────────────

export const BrickAudio = {
    paddleHit: () => {
        tone(320, 'square', 0.06, 0.25, 480);
    },
    wallBounce: () => {
        tone(220, 'triangle', 0.04, 0.15, 180);
    },
    brickHit: (combo = 1) => {
        const baseFreq = Math.min(880, 440 + combo * 40);
        tone(baseFreq, 'sine', 0.08, 0.3, baseFreq * 1.5);
    },
    brickDestroy: (combo = 1) => {
        const baseFreq = Math.min(1200, 520 + combo * 55);
        tone(baseFreq, 'square', 0.12, 0.32, baseFreq * 0.7);
        noise(0.08, 1800, 0.15);
    },
    goldenHit: () => {
        tone(880, 'triangle', 0.15, 0.35, 1320);
        setTimeout(() => tone(1320, 'sine', 0.2, 0.35, 1760), 40);
    },
    powerupSpawn: () => {
        tone(400, 'sine', 0.15, 0.2, 800);
    },
    powerupCollect: () => {
        tone(523.25, 'square', 0.08, 0.3, 659.25);
        setTimeout(() => tone(659.25, 'square', 0.08, 0.3, 783.99), 50);
        setTimeout(() => tone(1046.5, 'square', 0.16, 0.35, 1318.5), 100);
    },
    laserFire: () => {
        tone(800, 'sawtooth', 0.08, 0.22, 180);
    },
    ballLost: () => {
        tone(300, 'sawtooth', 0.35, 0.3, 80);
        noise(0.25, 600, 0.2);
    },
    levelCleared: () => {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.18, 0.35, freq * 1.05), idx * 80);
        });
    },
    gameOver: () => {
        const notes = [400, 350, 300, 220];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sawtooth', 0.25, 0.3, freq * 0.8), idx * 120);
        });
    }
};

// ─── Efectos para Void Runner ──────────────────────────────────────────────

export const VoidAudio = {
    laser: () => {
        tone(920, 'sawtooth', 0.09, 0.25, 220);
    },
    thrust: () => {
        noise(0.06, 320, 0.12);
    },
    rockHit: (tier: number) => {
        const dur = tier === 3 ? 0.35 : tier === 2 ? 0.22 : 0.14;
        const freq = tier === 3 ? 300 : tier === 2 ? 600 : 1000;
        noise(dur, freq, 0.35);
        tone(tier === 3 ? 90 : tier === 2 ? 140 : 220, 'triangle', dur * 0.8, 0.25, 40);
    },
    shipHit: () => {
        noise(0.45, 800, 0.4);
        tone(180, 'sawtooth', 0.4, 0.35, 45);
    },
    waveStart: () => {
        tone(440, 'triangle', 0.15, 0.3, 660);
        setTimeout(() => tone(660, 'triangle', 0.15, 0.3, 880), 90);
        setTimeout(() => tone(880, 'sine', 0.25, 0.35, 1100), 180);
    },
    extraLife: () => {
        tone(587.33, 'square', 0.1, 0.28);
        setTimeout(() => tone(880, 'square', 0.2, 0.35), 70);
    }
};

// ─── Efectos para Pac-Man ──────────────────────────────────────────────────

export const PacmanAudio = {
    waka: (toggle: boolean) => {
        tone(toggle ? 360 : 420, 'triangle', 0.06, 0.18, toggle ? 480 : 340);
    },
    energizer: () => {
        tone(600, 'sine', 0.1, 0.25, 300);
    },
    eatGhost: () => {
        const notes = [400, 600, 800, 1200];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sawtooth', 0.1, 0.3, freq * 1.4), idx * 60);
        });
    },
    eatFruit: () => {
        tone(523, 'sine', 0.08, 0.3, 783);
        setTimeout(() => tone(1046, 'sine', 0.15, 0.35, 1318), 70);
    },
    death: () => {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                tone(600 - i * 55, 'sawtooth', 0.08, 0.25, 400 - i * 50);
            }, i * 65);
        }
    }
};

// ─── Efectos para Neon Striker (Galaxy Shmup) ──────────────────────────────

export const StrikerAudio = {
    laser: (level = 1) => {
        const baseFreq = 880 + level * 60;
        tone(baseFreq, 'sawtooth', 0.06, 0.22, baseFreq * 0.35);
    },
    missile: () => {
        tone(350, 'triangle', 0.12, 0.25, 680);
        noise(0.08, 600, 0.15);
    },
    bomb: () => {
        noise(0.7, 400, 0.45);
        tone(220, 'sawtooth', 0.6, 0.4, 30);
        setTimeout(() => tone(90, 'sine', 0.8, 0.45, 20), 80);
    },
    enemyHit: () => {
        tone(420, 'square', 0.04, 0.18, 200);
    },
    explosion: (isBoss = false) => {
        const dur = isBoss ? 0.8 : 0.28;
        noise(dur, isBoss ? 300 : 900, isBoss ? 0.5 : 0.35);
        tone(isBoss ? 110 : 180, 'sawtooth', dur * 0.8, 0.3, 30);
    },
    graze: () => {
        tone(1200, 'sine', 0.04, 0.18, 1600);
    },
    powerup: () => {
        const notes = [587.33, 739.99, 880.0, 1174.66];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.1, 0.3, freq * 1.1), idx * 45);
        });
    },
    shieldHit: () => {
        tone(600, 'sawtooth', 0.1, 0.25, 120);
        noise(0.1, 1200, 0.2);
    },
    bossAlarm: () => {
        tone(880, 'square', 0.18, 0.35);
        setTimeout(() => tone(620, 'square', 0.18, 0.35), 200);
        setTimeout(() => tone(880, 'square', 0.18, 0.35), 400);
    },
    waveCleared: () => {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sine', 0.2, 0.3, freq * 1.05), idx * 80);
        });
    }
};

// ─── Efectos para Cyber Viper 2088 ─────────────────────────────────────────

export const ViperAudio = {
    turn: () => {
        tone(600, 'square', 0.03, 0.12, 750);
    },
    eat: (combo = 1) => {
        const base = Math.min(1200, 480 + combo * 60);
        tone(base, 'triangle', 0.08, 0.28, base * 1.4);
    },
    golden: () => {
        const notes = [587.33, 739.99, 880.0, 1174.66];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sine', 0.12, 0.3, freq * 1.2), idx * 40);
        });
    },
    boost: () => {
        tone(300, 'sawtooth', 0.25, 0.3, 900);
    },
    crash: () => {
        noise(0.4, 500, 0.4);
        tone(240, 'sawtooth', 0.35, 0.35, 40);
    }
};

// ─── Efectos para Tetris Matrix ────────────────────────────────────────────

export const TetrisAudio = {
    move: () => {
        tone(450, 'square', 0.02, 0.08, 500);
    },
    rotate: () => {
        tone(580, 'triangle', 0.04, 0.16, 780);
    },
    drop: () => {
        tone(160, 'sine', 0.08, 0.25, 60);
        noise(0.04, 800, 0.15);
    },
    hold: () => {
        tone(400, 'sine', 0.06, 0.15, 650);
    },
    clear: (lines = 1) => {
        const chords: number[][] = [
            [523.25, 659.25], // Single: C-E
            [523.25, 659.25, 783.99], // Double: C-E-G
            [523.25, 659.25, 783.99, 1046.50], // Triple: C-E-G-C
            [523.25, 659.25, 783.99, 1046.50, 1318.51], // Tetris: C-E-G-C-E
        ];
        const freqs = chords[Math.min(3, Math.max(0, lines - 1))];
        freqs.forEach((f, i) => {
            setTimeout(() => {
                tone(f, lines === 4 ? 'square' : 'triangle', 0.15 + lines * 0.05, 0.3, f * 1.02);
            }, i * 35);
        });
    },
    levelUp: () => {
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.14, 0.35, freq * 1.08), idx * 60);
        });
    },
    gameOver: () => {
        const notes = [400, 350, 300, 240, 180];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sawtooth', 0.2, 0.3, freq * 0.8), idx * 100);
        });
    }
};

// ─── Efectos para Ball Shooters (Swipe Brick Breaker) ──────────────────────

export const BallShooterAudio = {
    shoot: () => {
        tone(600, 'triangle', 0.03, 0.12, 900);
    },
    bounce: (combo = 1) => {
        const base = Math.min(1400, 350 + (combo % 24) * 35);
        tone(base, 'sine', 0.04, 0.18, base * 1.05);
    },
    destroy: () => {
        noise(0.08, 1200, 0.25);
        tone(280, 'sawtooth', 0.08, 0.22, 100);
    },
    addBall: () => {
        tone(880, 'sine', 0.08, 0.25, 1320);
        setTimeout(() => tone(1320, 'sine', 0.12, 0.28, 1760), 60);
    },
    laser: () => {
        tone(1200, 'sawtooth', 0.18, 0.3, 200);
        noise(0.12, 1600, 0.25);
    },
    bomb: () => {
        noise(0.35, 400, 0.4);
        tone(180, 'sawtooth', 0.3, 0.35, 30);
    },
    roundComplete: () => {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.1, 0.25, freq * 1.05), idx * 50);
        });
    }
};

// ─── Efectos para Tanks: Base Defense (Battle City 1990) ───────────────────

export const TankAudio = {
    fire: () => {
        tone(180, 'triangle', 0.09, 0.35, 45);
        noise(0.08, 900, 0.28);
    },
    hit: () => {
        tone(420, 'square', 0.05, 0.2, 120);
    },
    brickHit: () => {
        noise(0.06, 1400, 0.22);
    },
    explosion: () => {
        noise(0.38, 450, 0.45);
        tone(110, 'sawtooth', 0.35, 0.4, 25);
    },
    powerup: () => {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sine', 0.1, 0.28, freq * 1.08), idx * 45);
        });
    },
    baseAlert: () => {
        tone(480, 'sawtooth', 0.15, 0.35, 320);
        setTimeout(() => tone(480, 'sawtooth', 0.15, 0.35, 320), 220);
    },
    stageClear: () => {
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.16, 0.35, freq * 1.05), idx * 75);
        });
    },
    gameOver: () => {
        const notes = [320, 290, 240, 180, 120];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sawtooth', 0.25, 0.35, freq * 0.8), idx * 120);
        });
    }
};

// ─── Efectos para Turbo Highway Race ───────────────────────────────────────

export const RaceAudio = {
    nitro: () => {
        tone(220, 'sawtooth', 0.35, 0.4, 650);
        noise(0.2, 1400, 0.3);
    },
    graze: () => {
        tone(880, 'sine', 0.06, 0.2, 1100);
        setTimeout(() => tone(1320, 'sine', 0.08, 0.25, 1760), 40);
    },
    skid: () => {
        noise(0.18, 2200, 0.25);
    },
    pickup: () => {
        tone(659.25, 'triangle', 0.08, 0.25, 987.77);
    },
    crash: () => {
        noise(0.45, 380, 0.5);
        tone(140, 'sawtooth', 0.4, 0.45, 20);
    },
    checkpoint: () => {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.12, 0.3, freq * 1.05), idx * 60);
        });
    }
};

// ─── Efectos para Cyber Frogger (Road & River Crossing) ────────────────────

export const FroggerAudio = {
    hop: () => {
        tone(320, 'sine', 0.05, 0.18, 520);
    },
    splash: () => {
        noise(0.22, 900, 0.35);
        tone(240, 'triangle', 0.12, 0.2, 80);
    },
    squash: () => {
        noise(0.28, 400, 0.4);
        tone(140, 'sawtooth', 0.25, 0.35, 40);
    },
    home: () => {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sine', 0.1, 0.3, freq * 1.05), idx * 50);
        });
    },
    fly: () => {
        tone(987.77, 'sine', 0.08, 0.25, 1318.51);
    },
    stageClear: () => {
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.15, 0.35, freq * 1.08), idx * 70);
        });
    },
    gameOver: () => {
        const notes = [320, 280, 240, 180, 120];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sawtooth', 0.22, 0.35, freq * 0.8), idx * 110);
        });
    }
};

// ─── Efectos para Supplement Shooting (Quarth / Block Hole) ────────────────

export const SupplementAudio = {
    shoot: () => {
        tone(520, 'square', 0.03, 0.12, 780);
    },
    snap: () => {
        tone(740, 'sine', 0.04, 0.16, 920);
    },
    complete: (blocks = 4) => {
        const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        chords.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'triangle', 0.14, 0.3, freq * 1.05), idx * 45);
        });
    },
    bigCombo: () => {
        const chords = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760.0];
        chords.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'square', 0.16, 0.35, freq * 1.08), idx * 35);
        });
        noise(0.2, 800, 0.3);
    },
    laser: () => {
        tone(1400, 'sawtooth', 0.15, 0.28, 280);
        noise(0.1, 1600, 0.2);
    },
    gameOver: () => {
        const notes = [360, 320, 280, 220, 150];
        notes.forEach((freq, idx) => {
            setTimeout(() => tone(freq, 'sawtooth', 0.22, 0.35, freq * 0.8), idx * 110);
        });
    }
};
