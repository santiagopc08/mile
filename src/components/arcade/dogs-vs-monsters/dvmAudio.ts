'use client';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMuted = false;

function ensureAudio() {
    if (typeof window === 'undefined') return false;
    if (!audioCtx) {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioClass) return false;
        audioCtx = new AudioClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.35;
        masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return true;
}

export function setDvmMuted(muted: boolean) {
    isMuted = muted;
    if (masterGain) {
        masterGain.gain.value = muted ? 0 : 0.35;
    }
}

export function isDvmMuted(): boolean {
    return isMuted;
}

function playTone(
    freq: number,
    type: OscillatorType = 'sine',
    duration = 0.1,
    gainVal = 0.3,
    endFreq?: number,
    delay = 0
) {
    if (isMuted || !ensureAudio() || !audioCtx || !masterGain) return;

    setTimeout(() => {
        if (!audioCtx || !masterGain) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        const t0 = audioCtx.currentTime;
        osc.frequency.setValueAtTime(freq, t0);
        if (endFreq) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + duration);
        }

        gain.gain.setValueAtTime(gainVal, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(t0);
        osc.stop(t0 + duration);
    }, delay * 1000);
}

function playNoise(duration = 0.15, gainVal = 0.25, filterFreq = 800) {
    if (isMuted || !ensureAudio() || !audioCtx || !masterGain) return;

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = audioCtx.createGain();
    const t0 = audioCtx.currentTime;
    gain.gain.setValueAtTime(gainVal, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(t0);
    noise.stop(t0 + duration);
}

export const DvmAudio = {
    init: () => {
        ensureAudio();
    },
    // Croqueta collect sound (Crisp satisfying crunch)
    croquetaCrunch: () => {
        playTone(600, 'triangle', 0.08, 0.28, 950);
        playTone(950, 'sine', 0.12, 0.35, 1400, 0.04);
    },
    // Dog Planted in dirt
    plantDog: () => {
        playTone(280, 'triangle', 0.12, 0.3, 140);
        playNoise(0.08, 0.2, 500);
    },
    // Shovel Dig
    shovel: () => {
        playNoise(0.12, 0.3, 700);
        playTone(180, 'sawtooth', 0.09, 0.2, 90);
    },
    // Tennis ball shot (Kiaro Peashooter pop)
    tennisShoot: () => {
        playTone(450, 'square', 0.07, 0.25, 200);
    },
    // Ice frisbee shot (Nika Snowpea)
    iceShoot: () => {
        playTone(880, 'triangle', 0.09, 0.22, 1200);
        playNoise(0.06, 0.15, 1800);
    },
    // Sonic Bark
    sonicBark: () => {
        playTone(320, 'sawtooth', 0.16, 0.35, 640);
        playNoise(0.12, 0.25, 1200);
    },
    // Melee Punch / Bite
    punch: () => {
        playTone(240, 'triangle', 0.08, 0.3, 120);
        playNoise(0.06, 0.25, 900);
    },
    // Enemy hit impact
    enemyHit: () => {
        playTone(380, 'triangle', 0.05, 0.2, 220);
    },
    // Ice freeze effect
    iceFreeze: () => {
        playTone(1100, 'sine', 0.18, 0.28, 600);
        playNoise(0.1, 0.2, 2200);
    },
    // Potato Mine Arming
    mineArmed: () => {
        playTone(520, 'sine', 0.1, 0.25, 780);
    },
    // Potato / Bomb Explosion
    explosion: () => {
        playNoise(0.45, 0.5, 400);
        playTone(150, 'sawtooth', 0.35, 0.45, 30);
    },
    // Lawnmower / Cart Zoom
    lawnmower: () => {
        playTone(180, 'sawtooth', 0.8, 0.35, 420);
        playNoise(0.6, 0.3, 900);
    },
    // Super Cookie Plant Food activation
    superCookie: () => {
        const notes = [440, 554, 659, 880, 1108];
        notes.forEach((f, idx) => {
            playTone(f, 'sine', 0.12, 0.32, f * 1.1, idx * 0.05);
        });
    },
    // Huge wave alarm
    hugeWave: () => {
        playTone(350, 'sawtooth', 0.25, 0.4, 180);
        setTimeout(() => playTone(350, 'sawtooth', 0.25, 0.4, 180), 280);
        setTimeout(() => playTone(350, 'sawtooth', 0.35, 0.45, 180), 560);
    },
    // Victory jingle
    victory: () => {
        const notes = [523, 659, 783, 1046, 1318];
        notes.forEach((f, idx) => {
            playTone(f, 'triangle', 0.2, 0.35, f, idx * 0.1);
        });
    },
    // Defeat siren
    defeat: () => {
        playTone(400, 'sawtooth', 0.5, 0.35, 120);
    },
    // Not enough croquetas buzz
    buzzer: () => {
        playTone(140, 'square', 0.12, 0.25, 120);
    },
};
