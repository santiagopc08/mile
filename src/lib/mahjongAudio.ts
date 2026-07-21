/**
 * mahjongAudio — motor de sonido sintetizado (Web Audio API) para el Mahjong.
 *
 * No usa archivos de audio: todos los efectos se generan proceduralmente con
 * osciladores y ruido, así que no añade peso al bundle ni peticiones de red.
 * El AudioContext se crea de forma perezosa en el primer gesto del usuario
 * (política de autoplay del navegador). Respeta un toggle de silencio persistido.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let noiseBuffer: AudioBuffer | null = null;

const BASE_VOLUME = 0.3;
const STORAGE_KEY = 'mahjong_muted';

function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : BASE_VOLUME;
        master.connect(ctx.destination);

        // Buffer de ruido blanco reutilizable (para whooshes e impactos)
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

/** Inicializa/reanuda el contexto de audio. Llamar desde un gesto del usuario. */
export function initAudio() {
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
        /* noop */
    }
}

export function isMuted() {
    return muted;
}

// ─── Primitivas de síntesis ──────────────────────────────────────────────────

interface ToneOpts {
    freq: number;
    type?: OscillatorType;
    dur: number;
    attack?: number;
    gain?: number;
    glideTo?: number;
    delay?: number;
    detune?: number;
}

function tone(c: AudioContext, dest: AudioNode, o: ToneOpts) {
    const t0 = c.currentTime + (o.delay ?? 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.glideTo), t0 + o.dur);
    if (o.detune) osc.detune.setValueAtTime(o.detune, t0);

    const peak = o.gain ?? 0.4;
    const atk = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

    osc.connect(g).connect(dest);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.02);
}

interface NoiseOpts {
    dur: number;
    gain?: number;
    filterType?: BiquadFilterType;
    filterFreq: number;
    filterGlideTo?: number;
    q?: number;
    delay?: number;
}

function noise(c: AudioContext, dest: AudioNode, o: NoiseOpts) {
    if (!noiseBuffer) return;
    const t0 = c.currentTime + (o.delay ?? 0);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = c.createBiquadFilter();
    filter.type = o.filterType ?? 'bandpass';
    filter.frequency.setValueAtTime(o.filterFreq, t0);
    if (o.filterGlideTo) filter.frequency.exponentialRampToValueAtTime(Math.max(60, o.filterGlideTo), t0 + o.dur);
    filter.Q.value = o.q ?? 1;

    const g = c.createGain();
    const peak = o.gain ?? 0.3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

    src.connect(filter).connect(g).connect(dest);
    src.start(t0);
    src.stop(t0 + o.dur + 0.02);
}

// Escala pentatónica (semitonos) para que los combos suban de forma musical
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
function comboFreq(combo: number, base = 330) {
    const semis = PENTATONIC[Math.min(PENTATONIC.length - 1, Math.max(0, combo - 1))];
    return base * Math.pow(2, semis / 12);
}

// ─── Efectos del juego ───────────────────────────────────────────────────────

/** Ficha colocada en la bandeja (sin emparejar todavía). */
export function playPickup() {
    const c = ensureContext();
    if (!c || !master || muted) return;
    tone(c, master, { freq: 420, glideTo: 620, type: 'triangle', dur: 0.09, gain: 0.22 });
}

/** Emparejamiento: whoosh de la ficha volando al dock + nota de combo ascendente. */
export function playMatch(combo: number) {
    const c = ensureContext();
    if (!c || !master || muted) return;
    // Whoosh: ruido filtrado que barre hacia arriba (la ficha vuela)
    noise(c, master, { dur: 0.26, filterFreq: 500, filterGlideTo: 2600, q: 0.8, gain: 0.16 });
    // Nota musical del combo (más aguda cuanto mayor la racha)
    const f = comboFreq(combo);
    tone(c, master, { freq: f, type: 'triangle', dur: 0.22, gain: 0.16, delay: 0.02 });
    tone(c, master, { freq: f * 1.5, type: 'sine', dur: 0.18, gain: 0.08, delay: 0.03 });
    if (combo >= 5) playInferno();
}

/** Impacto: las dos fichas chocan en el dock (clink metálico + golpe grave). */
export function playCollision(combo: number) {
    const c = ensureContext();
    if (!c || !master || muted) return;
    const pitch = 1 + Math.min(1.4, (combo - 1) * 0.12);
    // Golpe grave del choque
    tone(c, master, { freq: 150 * pitch, glideTo: 60, type: 'sine', dur: 0.16, gain: 0.34 });
    // Clink metálico (dos osciladores detonados)
    tone(c, master, { freq: 900 * pitch, type: 'square', dur: 0.08, gain: 0.12 });
    tone(c, master, { freq: 1340 * pitch, type: 'square', dur: 0.06, gain: 0.08, detune: 12 });
    // Chispa de impacto (ruido corto y brillante)
    noise(c, master, { dur: 0.1, filterType: 'highpass', filterFreq: 3000, gain: 0.12 });
}

/** Riser de "modo infierno" al alcanzar el combo máximo. */
export function playInferno() {
    const c = ensureContext();
    if (!c || !master || muted) return;
    noise(c, master, { dur: 0.7, filterFreq: 300, filterGlideTo: 4000, q: 1.2, gain: 0.14 });
    tone(c, master, { freq: 110, glideTo: 440, type: 'sawtooth', dur: 0.7, gain: 0.1 });
}

/** Fallo: la bandeja se llenó / bomba. Zumbido descendente. */
export function playError() {
    const c = ensureContext();
    if (!c || !master || muted) return;
    tone(c, master, { freq: 300, glideTo: 90, type: 'sawtooth', dur: 0.45, gain: 0.28 });
    tone(c, master, { freq: 150, glideTo: 60, type: 'square', dur: 0.5, gain: 0.14, delay: 0.03 });
}

/** Victoria: acorde ascendente alegre. */
export function playVictory() {
    const c = ensureContext();
    if (!c || !master || muted) return;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    chord.forEach((f, i) => {
        tone(c, master!, { freq: f, type: 'triangle', dur: 0.6, gain: 0.16, delay: i * 0.08 });
    });
}
