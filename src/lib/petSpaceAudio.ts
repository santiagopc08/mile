/**
 * petSpaceAudio — ambiente sonoro sintetizado de la estación orbital.
 *
 * No usa archivos: todo se genera con osciladores y ruido (Web Audio), así que
 * no añade peso al bundle. Incluye un drone ambiental continuo (zumbido de
 * estación + aire) y blips de interacción.
 *
 * IMPORTANTE: arranca DESACTIVADO por defecto — el audio ambiental es intrusivo,
 * así que solo suena si la persona lo activa explícitamente. La preferencia se
 * persiste y el contexto se crea con el gesto del usuario (política de autoplay).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = false;

// Nodos del drone ambiental (para poder detenerlo)
let ambient: {
  oscA: OscillatorNode;
  oscB: OscillatorNode;
  air: AudioBufferSourceNode;
  gain: GainNode;
  lfo: OscillatorNode;
} | null = null;

const STORAGE_KEY = 'mile_petspace_audio';
const MASTER_VOLUME = 0.32;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;

  if (!ctx || !(ctx instanceof AC)) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);

    // Buffer de ruido blanco reutilizable
    const len = Math.floor(ctx.sampleRate * 2);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// ─── Primitivas ──────────────────────────────────────────────────────────────

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  dur: number;
  gain?: number;
  glideTo?: number;
  delay?: number;
}

function tone(c: AudioContext, dest: AudioNode, o: ToneOpts) {
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.glideTo), t0 + o.dur);

  const peak = o.gain ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
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
  if (o.filterGlideTo) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, o.filterGlideTo), t0 + o.dur);
  }
  filter.Q.value = o.q ?? 1;

  const g = c.createGain();
  const peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  src.connect(filter).connect(g).connect(dest);
  src.start(t0);
  src.stop(t0 + o.dur + 0.02);
}

// ─── Drone ambiental de la estación ──────────────────────────────────────────

function startAmbient() {
  const c = ensureContext();
  if (!c || !master || ambient) return;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.055, c.currentTime + 2.2); // fade-in suave
  gain.connect(master);

  // Zumbido grave del casco (fundamental + quinta justa)
  const oscA = c.createOscillator();
  oscA.type = 'sine';
  oscA.frequency.value = 58;
  const oscB = c.createOscillator();
  oscB.type = 'triangle';
  oscB.frequency.value = 87; // quinta
  const oscBGain = c.createGain();
  oscBGain.gain.value = 0.35;

  // Aire del soporte vital: ruido filtrado grave
  const air = c.createBufferSource();
  air.buffer = noiseBuffer;
  air.loop = true;
  const airFilter = c.createBiquadFilter();
  airFilter.type = 'lowpass';
  airFilter.frequency.value = 190;
  const airGain = c.createGain();
  airGain.gain.value = 0.5;

  // LFO lento: la estación "respira"
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain).connect(gain.gain);

  oscA.connect(gain);
  oscB.connect(oscBGain).connect(gain);
  air.connect(airFilter).connect(airGain).connect(gain);

  oscA.start();
  oscB.start();
  air.start();
  lfo.start();

  ambient = { oscA, oscB, air, gain, lfo };
}

function stopAmbient() {
  if (!ctx || !ambient) return;
  const { oscA, oscB, air, gain, lfo } = ambient;
  const t = ctx.currentTime;
  try {
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); // fade-out
    oscA.stop(t + 0.55);
    oscB.stop(t + 0.55);
    air.stop(t + 0.55);
    lfo.stop(t + 0.55);
  } catch {
    /* ya detenidos */
  }
  ambient = null;
}

// ─── API pública ─────────────────────────────────────────────────────────────

/** Lee la preferencia persistida (por defecto: desactivado). */
export function loadAudioPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    enabled = false;
  }
  return enabled;
}

/** Activa/desactiva el audio. Llamar desde un gesto del usuario. */
export function setAudioEnabled(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* noop */
  }
  if (on) {
    ensureContext();
    startAmbient();
  } else {
    stopAmbient();
  }
}

export function isAudioEnabled() {
  return enabled;
}

/** Detiene el ambiente sin tocar la preferencia (para desmontajes). */
export function suspendAmbient() {
  stopAmbient();
}

/** Reanuda el ambiente si la preferencia está activa (para montajes). */
export function resumeAmbientIfEnabled() {
  if (enabled) {
    ensureContext();
    startAmbient();
  }
}

// ─── Blips de interacción ────────────────────────────────────────────────────

/** Selección de tripulante: blip corto de interfaz. */
export function playSelect() {
  const c = ensureContext();
  if (!c || !master || !enabled) return;
  tone(c, master, { freq: 880, glideTo: 1250, type: 'triangle', dur: 0.07, gain: 0.16 });
}

/** Salto entre tripulantes: whoosh de warp. */
export function playWarp() {
  const c = ensureContext();
  if (!c || !master || !enabled) return;
  noise(c, master, { dur: 0.4, filterFreq: 380, filterGlideTo: 2600, q: 0.9, gain: 0.13 });
  tone(c, master, { freq: 150, glideTo: 420, type: 'sine', dur: 0.35, gain: 0.1 });
}

/** Mimos: acorde cálido y alegre. */
export function playCuddle() {
  const c = ensureContext();
  if (!c || !master || !enabled) return;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    tone(c, master!, { freq: f, type: 'triangle', dur: 0.45, gain: 0.14, delay: i * 0.06 });
  });
}

/** Cobijar: swell grave y acogedor. */
export function playWarmth() {
  const c = ensureContext();
  if (!c || !master || !enabled) return;
  tone(c, master, { freq: 196, glideTo: 294, type: 'sine', dur: 0.4, gain: 0.2 });
  noise(c, master, { dur: 0.3, filterType: 'lowpass', filterFreq: 500, gain: 0.07 });
}

/** Captura de archivo visual: obturador. */
export function playCapture() {
  const c = ensureContext();
  if (!c || !master || !enabled) return;
  noise(c, master, { dur: 0.05, filterType: 'highpass', filterFreq: 2600, gain: 0.16 });
  tone(c, master, { freq: 1400, type: 'square', dur: 0.04, gain: 0.08, delay: 0.05 });
}
