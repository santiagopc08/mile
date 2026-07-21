'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import { BrutalistPanel } from "@/components/ui/BrutalistPanel";
import BirthdayScrollContainer from "./components/BirthdayScrollContainer";

// Synth Scheduler Class to avoid memory leaks
// --- Happy Birthday Melody Configuration for Lofi Synthesizer ---
const MELODY = [
  { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 2 },
  { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 },
  { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'C5', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 1 }, { note: 'D4', dur: 1 },
  { note: 'Bb4', dur: 0.5 }, { note: 'Bb4', dur: 0.5 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 }
];

const NOTE_FREQS: Record<string, number> = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25
};

class BdaySynth {
  private ctx: AudioContext | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private index = 0;
  private isPlaying = false;
  private isTempMuted = false;

  start() {
    if (this.isPlaying) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.isPlaying = true;
    this.index = 0;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) clearTimeout(this.timerId);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  setTempMute(muted: boolean) {
    this.isTempMuted = muted;
  }

  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;
    const note = MELODY[this.index];
    const freq = NOTE_FREQS[note.note];

    // Play warm tri tone
    this.playTone(freq, note.dur * 0.45);

    this.index = (this.index + 1) % MELODY.length;
    this.timerId = setTimeout(() => this.scheduler(), note.dur * 550); // ~110 BPM
  }

  private playTone(freq: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle'; // Retro lo-fi tone
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime); // Cozy dampening

    const targetGain = this.isTempMuted ? 0 : 0.12;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(targetGain, this.ctx.currentTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

// --- Main Page Component handling the Secure Loader and auth wrapper ---
export default function BirthdayPage() {
  const { profile } = useProfile();
  const [phase, setPhase] = useState<'PHASE_PRELOADING' | 'PHASE_READY_TRIGGER' | 'PHASE_SCROLLING_STORY'>('PHASE_PRELOADING');
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [decryptLogs, setDecryptLogs] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const synthRef = useRef<BdaySynth | null>(null);
  const [bgmActive, setBgmActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    synthRef.current = new BdaySynth();
    return () => {
      synthRef.current?.stop();
    };
  }, []);

  const toggleBgm = () => {
    if (bgmActive) {
      synthRef.current?.stop();
      setBgmActive(false);
    } else {
      synthRef.current?.start();
      setBgmActive(true);
    }
  };

  // Mount effect: Automatically start preloader logs and run decryption progress
  useEffect(() => {
    if (phase !== 'PHASE_PRELOADING') return;

    const logMessages = [
      "INICIALIZANDO SECUENCIA...",
      "CARGANDO REGISTROS...",
      "SINTETIZANDO ESTRUCTURAS...",
      "ESTABLECIENDO CONEXION DE COMPANEROS...",
      "SINTONIZANDO FRECUENCIA...",
      "PREPARANDO SISTEMAS DE CELEBRACION...",
      "DESENCRIPTANDO ARCHIVOS...",
      "SISTEMA LISTO.",
      "BIENVENIDA, MILE."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setDecryptProgress(prev => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 100) {
          clearInterval(interval);
          setPhase('PHASE_READY_TRIGGER');
          return 100;
        }
        const logTrigger = Math.floor(100 / logMessages.length);
        if (prev > logTrigger * currentLogIndex && currentLogIndex < logMessages.length) {
          setDecryptLogs(logs => [...logs, logMessages[currentLogIndex]]);
          currentLogIndex++;
        }
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 'PHASE_PRELOADING') {
    return (
      <PrivateRoute>
        <div className="fixed inset-0 z-[-1] bg-black overflow-hidden select-none">
          <div className="absolute inset-0 bg-mosaic opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-dot-matrix opacity-30 pointer-events-none" />
        </div>
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative text-[#e5e2e1] font-sans">
          <BrutalistPanel accentColor="#ff4b89" borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={16} cornerThickness={1.5} className="w-full max-w-xl p-6 sm:p-10">
            <div className="space-y-6">
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-[10px] uppercase tracking-widest text-[#a88a7e]">Cargando sorpresas para Mile...</span>
                <span className="text-sm font-black text-white">{decryptProgress}%</span>
              </div>

              <div className="w-full h-4 border border-white/15 bg-black p-[2px] flex gap-[2px]">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const filled = decryptProgress >= (idx + 1) * 5;
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full transition-all duration-300"
                      style={{
                        backgroundColor: filled ? '#ff4b89' : 'transparent',
                        boxShadow: filled ? '0 0 4px #ff4b89' : 'none'
                      }}
                    />
                  );
                })}
              </div>

              <div className="border border-white/5 bg-black p-4 h-40 overflow-y-auto font-mono text-[9px] leading-relaxed text-[#a88a7e] custom-scrollbar flex flex-col justify-start">
                {decryptLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 uppercase">
                    <span className="text-[#ff4b89]">{'>'}</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="text-white mt-1 animate-pulse uppercase">{'>'} CARGANDO...</div>
              </div>
            </div>
          </BrutalistPanel>
        </main>
      </PrivateRoute>
    );
  }

  const birthdayMidnight = new Date(2026, 5, 17, 0, 0, 0); // June = month 5 (0-indexed)
  const isBirthdayUnlocked = currentTime >= birthdayMidnight || profile === 'el';

  if (!isBirthdayUnlocked) {
    return (
      <PrivateRoute>
        <div className="fixed inset-0 z-[-1] bg-black overflow-hidden select-none">
          <div className="absolute inset-0 bg-mosaic opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-dot-matrix opacity-30 pointer-events-none" />
        </div>
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative text-[#e5e2e1] font-sans">
          <BrutalistPanel accentColor="#ff4b89" borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={16} cornerThickness={1.5} className="w-full max-w-md p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="text-3xl font-mono font-black text-white"
            >
              [ BLOQUEADO ]
            </motion.div>
            <h1 className="text-xl font-mono font-black uppercase tracking-widest text-[#ff4b89]">ACCESO DENEGADO</h1>
            <p className="text-xs text-[#a88a7e] leading-relaxed max-w-xs font-mono uppercase">
              ESTA SECCION SE DESBLOQUEA A LA MEDIANOCHE DEL <span className="text-white font-bold">17 DE JUNIO</span>. REGRESA LUEGO.
            </p>
            <div className="border border-white/10 bg-black/50 px-4 py-2 font-mono text-[10px] text-[#a88a7e] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-none animate-pulse"></span>
              FALTAN: {Math.max(0, Math.ceil((birthdayMidnight.getTime() - currentTime.getTime()) / (1000 * 60 * 60)))} HORAS
            </div>
          </BrutalistPanel>
        </main>
      </PrivateRoute>
    );
  }

  if (phase === 'PHASE_READY_TRIGGER') {
    return (
      <PrivateRoute>
        <div className="fixed inset-0 z-[-1] bg-black overflow-hidden select-none">
          <div className="absolute inset-0 bg-mosaic opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-dot-matrix opacity-30 pointer-events-none" />
        </div>
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative text-[#e5e2e1] font-sans">
          <BrutalistPanel accentColor="#ff4b89" borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={16} cornerThickness={1.5} className="w-full max-w-md p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="text-4xl font-mono font-black text-white"
            >
              [ LISTO ]
            </motion.div>
            <h1 className="text-2xl font-mono font-black uppercase tracking-widest text-[#ff4b89]">ESPACIO SECRETO</h1>
            <p className="text-xs text-[#a88a7e] leading-relaxed max-w-xs font-mono uppercase">
              SE HA DISENADO UN PROTOCOLO ESPECIAL PARA TI. REQUIERE VOLUMEN ALTO PARA SU EJECUCION.
            </p>
            <button
              onClick={() => {
                synthRef.current?.start();
                setBgmActive(true);
                setPhase('PHASE_SCROLLING_STORY');
              }}
              className="px-8 py-4 bg-[#ff4b89] border-b-2 border-r-2 border-black font-mono text-xs font-black uppercase tracking-widest text-black hover:bg-[#ffb1c3] active:scale-95 transition-all"
            >
              INICIAR PROTOCOLO
            </button>
          </BrutalistPanel>
        </main>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <BirthdayScrollContainer
        setBgmTempMute={(muted) => synthRef.current?.setTempMute(muted)}
      />
    </PrivateRoute>
  );
}
