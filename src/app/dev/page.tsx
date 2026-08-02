'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Gamepad2,
  Flame,
  Layers,
  Target,
  Sparkles,
  Palette,
  Terminal,
  Activity,
  RotateCcw,
  Sliders,
  Maximize2,
  Play,
  Pause,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  Shield,
  ArrowLeft,
  Box,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Cpu
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { AmbientField, type AmbientPreset } from '@/components/AmbientField';
import { BrutalistSkeleton } from '@/components/ui/BrutalistSkeleton';
import { PROFILE_PALETTE, type ProfileKey } from '@/lib/profilePalette';

// Dynamic game imports with smooth brutalist skeleton loaders
const Mahjong = dynamic(
  () => import('@/components/Mahjong').then((m) => m.Mahjong),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Módulo Mahjong 3D" className="h-[600px] w-full rounded-2xl" />
    ),
    ssr: false,
  }
);

const HillClimbCanvas = dynamic(
  () => import('@/components/hill-climb/HillClimbCanvas').then((m) => m.HillClimbCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor Físico Hill Climb (Matter.js)" className="h-[600px] w-full rounded-2xl" />
    ),
    ssr: false,
  }
);

const SmashFestPage = dynamic(
  () => import('@/app/smash-fest/page'),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor 3D Smash Fest (Three.js/Cannon.js)" className="h-[600px] w-full rounded-2xl" />
    ),
    ssr: false,
  }
);

const DesignLab = dynamic(
  () => import('@/app/design-lab/page'),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando UI Design Lab" className="h-[600px] w-full rounded-2xl" />
    ),
    ssr: false,
  }
);

type ActiveView = 'menu' | 'cpp' | 'mahjong' | 'hillclimb' | 'smashfest' | 'designlab' | 'engineprofiler';

interface LogEntry {
  id: number;
  timestamp: string;
  subsystem: string;
  level: 'info' | 'warn' | 'success';
  message: string;
}

export default function DevDebugPage() {
  const { profile } = useProfile();
  const [devProfile, setDevProfile] = useState<ProfileKey>(profile === 'ella' ? 'ella' : 'el');
  const [activeView, setActiveView] = useState<ActiveView>('menu');
  const [ambientPreset, setAmbientPreset] = useState<AmbientPreset>('juego');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live Performance Diagnostics Simulation & State
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(38.4);
  const [fixedTickCount, setFixedTickCount] = useState(1240);
  const [isTickRunning, setIsTickRunning] = useState(true);
  const [bpm, setBpm] = useState(120);
  const [triggerEventsCount, setTriggerEventsCount] = useState(48);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cppAction, setCppAction] = useState<string | null>(null);
  const [cppOutput, setCppOutput] = useState('');

  const nextLogId = useRef(1);

  const addLog = (subsystem: string, level: 'info' | 'warn' | 'success', message: string) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
    setLogs((prev) => [
      { id: nextLogId.current++, timestamp: time, subsystem, level, message },
      ...prev.slice(0, 49),
    ]);
  };

  // Initial Welcome Log
  useEffect(() => {
    addLog('DEV_HUB', 'success', 'Espacio de Dev Testing & Debugging inicializado correctamente.');
    addLog('ENGINE', 'info', 'Rhythm Core EPIC-001 y Gameplay Stack EPIC-002 activos (100% determinista).');
    addLog('SYSTEM', 'info', `Perfil actual: ${devProfile === 'ella' ? 'Mile (Ella)' : 'Santi (El)'}`);
  }, [devProfile]);

  // Tick counter simulation
  useEffect(() => {
    if (!isTickRunning) return;
    const interval = setInterval(() => {
      setFixedTickCount((prev) => prev + 1);
      setFps(Math.floor(58 + Math.random() * 4));
      setMemoryUsage((prev) => parseFloat((37.5 + Math.random() * 2.5).toFixed(1)));
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [isTickRunning]);

  const activePalette = PROFILE_PALETTE[devProfile];
  const accentColor = activePalette.primary;

  const handleTriggerSimulatedEvent = (eventName: string) => {
    setTriggerEventsCount((prev) => prev + 1);
    addLog('TRIGGER_SYSTEM', 'info', `Evento '${eventName}' ejecutado a Tick #${fixedTickCount} (BPM ${bpm}).`);
  };

  const handleClearScores = () => {
    if (confirm('¿Deseas reiniciar los récords locales de juegos en localStorage?')) {
      localStorage.removeItem('smash_fest_scores_v1');
      localStorage.removeItem('mahjong_high_score');
      addLog('STORAGE', 'warn', 'Récords locales reiniciados.');
    }
  };

  const handleCppAction = async (action: 'hillClimb' | 'editor' | 'arcade' | 'tests') => {
    setCppAction(action);
    if (action === 'tests') setCppOutput('Ejecutando escenas de validación C++…');

    try {
      const response = await fetch('/api/dev/cpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();

      if (action === 'tests') {
        setCppOutput(result.output || result.error || 'Sin salida del runner.');
        addLog('CPP_TESTS', result.ok ? 'success' : 'warn', result.ok ? 'Validation Lab completado correctamente.' : 'Validation Lab terminó con errores.');
      } else {
        addLog('CPP_RUNTIME', response.ok ? 'success' : 'warn', response.ok ? `Ventana ${result.window ?? action} lanzada.` : (result.error || 'No se pudo lanzar el binario.'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión con el runner C++.';
      setCppOutput(message);
      addLog('CPP_RUNTIME', 'warn', message);
    } finally {
      setCppAction(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#08060b] text-[#e5e2e1] font-mono select-none overflow-x-hidden pb-16">
      {/* Dynamic Ambient Field Background */}
      <AmbientField preset={ambientPreset} profile={devProfile} interactive={false} />

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 pt-4 md:pt-6 space-y-6">

        {/* Top Control Bar / Developer Header */}
        <header className="border border-white/12 bg-black/40 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <button
                  type="button"
                  id="btn-dev-back-home"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  <ArrowLeft className="w-4 h-4 text-white/70" />
                  <span className="hidden sm:inline">INICIO</span>
                </button>
              </Link>
              <div className="h-6 w-px bg-white/15 hidden sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm animate-pulse" style={{ color: accentColor }}>◆</span>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
                    DEV TESTING & DEBUGGING HUB
                  </h1>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    ENGINE v1.0
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-widest mt-0.5">
                  ENTORNO DE DIAGNÓSTICO, JUEGOS, PRUEBAS Y PRUEBAS EN VIVO
                </p>
              </div>
            </div>

            {/* Global Controls (Profile & Ambient Preset Switcher) */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/15 shadow-xl">
              {/* Profile Toggle */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                <Shield className="w-3.5 h-3.5 text-white/60 ml-1" />
                <button
                  type="button"
                  id="btn-profile-santi"
                  onClick={() => {
                    setDevProfile('el');
                    addLog('USER', 'info', 'Perfil cambiado a Santi (El).');
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                    devProfile === 'el'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  SANTI
                </button>
                <button
                  type="button"
                  id="btn-profile-mile"
                  onClick={() => {
                    setDevProfile('ella');
                    addLog('USER', 'info', 'Perfil cambiado a Mile (Ella).');
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                    devProfile === 'ella'
                      ? 'bg-[#ff4b89] text-white font-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  MILE
                </button>
              </div>

              {/* Ambient Preset Switcher */}
              <div className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-white/60 ml-1 hidden sm:inline" />
                <select
                  id="select-dev-ambient-preset"
                  value={ambientPreset}
                  onChange={(e) => setAmbientPreset(e.target.value as AmbientPreset)}
                  className="bg-slate-900 border border-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-lg focus:outline-none focus:border-amber-400"
                >
                  <option value="juego">FONDO: JUEGO</option>
                  <option value="home">FONDO: INICIO</option>
                  <option value="dashboard">FONDO: DASHBOARD</option>
                  <option value="planes">FONDO: PLANES</option>
                  <option value="refugio">FONDO: REFUGIO</option>
                  <option value="salud">FONDO: SALUD</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Live Performance Diagnostics Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="border border-white/10 bg-white/[0.03] p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[9px] text-white/50 uppercase tracking-widest">FPS RENDIMIENTO</div>
              <div className="text-lg font-black text-emerald-400">{fps} <span className="text-[10px] text-white/60">FPS</span></div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[9px] text-white/50 uppercase tracking-widest">SIMULATION TICK</div>
              <div className="text-lg font-black text-cyan-400">#{fixedTickCount}</div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
            <Box className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[9px] text-white/50 uppercase tracking-widest">MEMORIA JS ESTIMADA</div>
              <div className="text-lg font-black text-amber-400">{memoryUsage} <span className="text-[10px] text-white/60">MB</span></div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#ff4b89]" />
            <div>
              <div className="text-[9px] text-white/50 uppercase tracking-widest">TIMELINE TRIGGERS</div>
              <div className="text-lg font-black text-[#ff4b89]">{triggerEventsCount} <span className="text-[10px] text-white/60">EVTS</span></div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
            <Flame className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-[9px] text-white/50 uppercase tracking-widest">BPM RÍTMICO</div>
              <div className="text-lg font-black text-purple-400">{bpm} <span className="text-[10px] text-white/60">BPM</span></div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-3 rounded-xl backdrop-blur-md flex items-center justify-between">
            <div>
              <div className="text-[9px] text-white/50 uppercase tracking-widest">ESTADO MOTOR</div>
              <div className="text-xs font-black text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% OK
              </div>
            </div>
            <button
              type="button"
              id="btn-toggle-tick"
              onClick={() => {
                setIsTickRunning(!isTickRunning);
                addLog('ENGINE', 'warn', isTickRunning ? 'Motor de Ticks Pausado' : 'Motor de Ticks Reanudado');
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              title={isTickRunning ? 'Pausar Ticks' : 'Reanudar Ticks'}
            >
              {isTickRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </section>

        {/* View Navigation Tabs / Clear Menu */}
        <nav className="flex flex-wrap items-center gap-2 border border-white/12 bg-black/50 p-2 rounded-2xl backdrop-blur-2xl">
          <button
            type="button"
            id="tab-view-menu"
            onClick={() => setActiveView('menu')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === 'menu'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            PANEL DE JUEGOS Y DEMOS
          </button>

          <button
            type="button"
            id="tab-view-cpp"
            onClick={() => setActiveView('cpp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === 'cpp'
                ? 'bg-gradient-to-r from-sky-400 to-cyan-500 text-slate-950 font-black shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Code2 className="w-4 h-4" />
            C++ PLATFORM
          </button>

          <button
            type="button"
            id="tab-view-mahjong"
            onClick={() => setActiveView('mahjong')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === 'mahjong'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            MAHJONG 3D
          </button>

          <button
            type="button"
            id="tab-view-hillclimb"
            onClick={() => setActiveView('hillclimb')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === 'hillclimb'
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 font-black shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Flame className="w-4 h-4" />
            HILL CLIMB (2D PHYSICS)
          </button>

          <button
            type="button"
            id="tab-view-smashfest"
            onClick={() => setActiveView('smashfest')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === 'smashfest'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Target className="w-4 h-4" />
            SMASH FEST (3D DEMOLITION)
          </button>

          <button
            type="button"
            id="tab-view-designlab"
            onClick={() => setActiveView('designlab')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === 'designlab'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Palette className="w-4 h-4" />
            DESIGN LAB (UI DECO)
          </button>

          <button
            type="button"
            id="tab-view-engineprofiler"
            onClick={() => setActiveView('engineprofiler')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeView === 'engineprofiler'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-4 h-4" />
            ENGINE PROFILER & DEBUGGER
          </button>
        </nav>

        {/* View Content Area */}
        <section className="w-full">
          {/* Main Menu Dashboard View */}
          {activeView === 'menu' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Native C++ Platform Card */}
                <div className="group border border-sky-400/30 bg-slate-950/70 rounded-3xl p-6 hover:border-sky-300/70 transition-all shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-sky-400/10 border border-sky-400/30 text-sky-300">
                        <Code2 className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-300">
                        C++23 · NATIVO
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">
                      C++ PLATFORM LAB
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      Arcade de dos juegos, simulador Hill Climb, editor de escenas y suite de validación sobre el runtime nativo de Mile.
                    </p>
                  </div>
                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <span className="text-[10px] text-sky-300 font-bold uppercase">4 TARGETS · CMAKE</span>
                    <button
                      type="button"
                      onClick={() => setActiveView('cpp')}
                      className="px-4 py-2 rounded-xl bg-sky-300 text-slate-950 font-black text-xs uppercase hover:bg-sky-200 transition-all"
                    >
                      VER DESARROLLOS
                    </button>
                  </div>
                </div>
                
                {/* Mahjong Card */}
                <div className="group border border-white/15 bg-slate-950/70 rounded-3xl p-6 hover:border-amber-400/60 transition-all shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
                        <Layers className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                        JUEGO 3D MAHJONG
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">
                      MAHJONG · MIEL-JONG
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      Juego 3D interactivo de parejas con físicas de fichas, algoritmos de resolución y temas dinámicos.
                    </p>
                  </div>
                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">DISPONIBLE · 3D THREE.JS</span>
                    <button
                      type="button"
                      onClick={() => setActiveView('mahjong')}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase hover:bg-amber-300 transition-all"
                    >
                      EJECUTAR DEMO
                    </button>
                  </div>
                </div>

                {/* Hill Climb Card */}
                <div className="group border border-white/15 bg-slate-950/70 rounded-3xl p-6 hover:border-emerald-400/60 transition-all shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
                        <Flame className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                        FÍSICA 2D MATTER.JS
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">
                      HILL CLIMB · BUGGY MOUNTAIN
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      Simulador de conducción de montaña con física de suspensión 2D, motores, terrenos procedurales y combustible.
                    </p>
                  </div>
                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">DISPONIBLE · MATTER.JS</span>
                    <button
                      type="button"
                      onClick={() => setActiveView('hillclimb')}
                      className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs uppercase hover:bg-emerald-300 transition-all"
                    >
                      EJECUTAR DEMO
                    </button>
                  </div>
                </div>

                {/* Smash Fest Card */}
                <div className="group border border-white/15 bg-slate-950/70 rounded-3xl p-6 hover:border-pink-500/60 transition-all shadow-xl hover:shadow-pink-500/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-500">
                        <Target className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                        DEMOLICIÓN 3D
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">
                      SMASH FEST · DEMOLICIÓN 3D
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      Juego de tiro parabólico 3D con comodines (Bomba, Tríptico, Yunque), sobrecarga y física destructiva de bloques.
                    </p>
                  </div>
                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <span className="text-[10px] text-pink-500 font-bold uppercase">DISPONIBLE · THREE.JS / CANNON</span>
                    <button
                      type="button"
                      onClick={() => setActiveView('smashfest')}
                      className="px-4 py-2 rounded-xl bg-pink-500 text-white font-black text-xs uppercase hover:bg-pink-400 transition-all"
                    >
                      EJECUTAR DEMO
                    </button>
                  </div>
                </div>

                {/* Design Lab Card */}
                <div className="group border border-white/15 bg-slate-950/70 rounded-3xl p-6 hover:border-cyan-400/60 transition-all shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
                        <Palette className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                        KIT DECO UI
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">
                      DESIGN LAB · DECO UI KIT
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      Laboratorio de prueba de componentes UI cibernéticos: DecoRule, CornerBrackets, ContourLines, TickScale y ChamferedPanel.
                    </p>
                  </div>
                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">HERRAMIENTA DISEÑO</span>
                    <button
                      type="button"
                      onClick={() => setActiveView('designlab')}
                      className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs uppercase hover:bg-cyan-300 transition-all"
                    >
                      ABRIR DESIGN LAB
                    </button>
                  </div>
                </div>

                {/* Engine Profiler Card */}
                <div className="group border border-white/15 bg-slate-950/70 rounded-3xl p-6 hover:border-purple-500/60 transition-all shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-500">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                        DIAGNÓSTICO ENGINE
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">
                      ENGINE PROFILER & DEBUGGER
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      Consola interactiva de eventos, pruebas de triggers del Event Bus, profilin rítmico y depurador del estado de simulación.
                    </p>
                  </div>
                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <span className="text-[10px] text-purple-400 font-bold uppercase">HERRAMIENTA MOTOR</span>
                    <button
                      type="button"
                      onClick={() => setActiveView('engineprofiler')}
                      className="px-4 py-2 rounded-xl bg-purple-500 text-white font-black text-xs uppercase hover:bg-purple-400 transition-all"
                    >
                      ABRIR PROFILER
                    </button>
                  </div>
                </div>

                {/* Storage & Utilities Card */}
                <div className="group border border-white/15 bg-slate-950/70 rounded-3xl p-6 hover:border-amber-500/60 transition-all shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                        UTILIDADES DEV
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">
                      LIMPIEZA Y REINICIO
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      Borra datos locales de puntuaciones, reinicia el bus de eventos y limpia cachés en tiempo de ejecución.
                    </p>
                  </div>
                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <button
                      type="button"
                      onClick={handleClearScores}
                      className="w-full px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs uppercase transition-all"
                    >
                      REINICIAR RECORDS LOCALES
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Active Game / Runner Containers */}
          {activeView === 'cpp' && (
            <div className="space-y-6">
              <section className="border border-sky-400/30 bg-slate-950/80 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-sky-500/5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <div className="flex items-center gap-2 text-sky-300 text-[10px] font-black uppercase tracking-[0.2em]">
                      <Code2 className="w-4 h-4" />
                      Desarrollo nativo recién incorporado
                    </div>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                      C++ PLATFORM LAB
                    </h2>
                    <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-white/60 font-sans">
                      Juegos, demos, dummies y validaciones del runtime C++23, reunidos en el mismo centro de pruebas que los experimentos web.
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-300">
                    WORKSPACE DETECTADO
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-pink-400/25 bg-pink-400/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <Gamepad2 className="w-6 h-6 text-pink-300" />
                      <span className="text-[9px] font-black uppercase text-pink-300">ARCADE</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black uppercase text-white">ORBIT ARCADE</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60 font-sans">
                      Dos juegos arcade completos sobre el runtime nativo: <span className="font-bold text-cyan-200">Brick Storm</span> (rompe bloques con power-ups) y <span className="font-bold text-pink-200">Void Runner</span> (nave vectorial y asteroides).
                    </p>
                    <div className="mt-5 border-t border-white/10 pt-3 text-[10px] font-bold uppercase text-pink-300">
                      target: arcade · 2 juegos
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCppAction('arcade')}
                      disabled={cppAction !== null}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-300 px-4 py-2.5 text-xs font-black uppercase text-slate-950 transition hover:bg-pink-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {cppAction === 'arcade' ? 'LANZANDO…' : 'JUGAR'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <Cpu className="w-6 h-6 text-amber-300" />
                      <span className="text-[9px] font-black uppercase text-amber-300">GAME</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black uppercase text-white">HILL CLIMB NATIVE</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60 font-sans">
                      Conducción 2D jugable: buggy con ruedas e inclinación según la pendiente, colinas infinitas, combustible, bidones y cámara que sigue el recorrido.
                    </p>
                    <div className="mt-5 border-t border-white/10 pt-3 text-[10px] font-bold uppercase text-amber-300">
                      target: hill_climb · C++23
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCppAction('hillClimb')}
                      disabled={cppAction !== null}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-black uppercase text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {cppAction === 'hillClimb' ? 'LANZANDO…' : 'VER EN ACCIÓN'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <Terminal className="w-6 h-6 text-cyan-300" />
                      <span className="text-[9px] font-black uppercase text-cyan-300">DUMMY / DEMO</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black uppercase text-white">ENGINE VALIDATION LAB</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60 font-sans">
                      Escenas dummy para comprobar runtime, ECS, cámara, timeline, triggers, terreno, suspensión y gameplay determinista.
                    </p>
                    <div className="mt-5 border-t border-white/10 pt-3 text-[10px] font-bold uppercase text-cyan-300">
                      examples/hill_climb · validation scenes
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCppAction('tests')}
                      disabled={cppAction !== null}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black uppercase text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {cppAction === 'tests' ? 'VALIDANDO…' : 'EJECUTAR LAB'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-purple-400/25 bg-purple-400/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <CheckCircle2 className="w-6 h-6 text-purple-300" />
                      <span className="text-[9px] font-black uppercase text-purple-300">TESTS</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black uppercase text-white">EDITOR DE ESCENAS</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60 font-sans">
                      Editor funcional: crear, duplicar, borrar, mover y recolorear entidades, con undo/redo, gizmos, consola y guardado en disco.
                    </p>
                    <div className="mt-5 border-t border-white/10 pt-3 text-[10px] font-bold uppercase text-purple-300">
                      targets: editor / platform_tests
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCppAction('editor')}
                      disabled={cppAction !== null}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-300 px-4 py-2.5 text-xs font-black uppercase text-slate-950 transition hover:bg-purple-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {cppAction === 'editor' ? 'LANZANDO…' : 'ABRIR EDITOR DE ESCENAS'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60">
                  <span className="text-emerald-300">● C++23</span>
                  <span>·</span>
                  <span>CMake 3.28+</span>
                  <span>·</span>
                  <span>4 targets nativos</span>
                  <span>·</span>
                  <span>validación autónoma</span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-pink-300">Cómo usar el Arcade</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60 font-sans">
                      Elige juego con <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">↑</kbd> <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">↓</kbd> y <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Enter</kbd> (o pulsa 1 / 2). En Brick Storm mueves la paleta con <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">A</kbd> <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">D</kbd> y lanzas con <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Espacio</kbd>; en Void Runner giras con <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">A</kbd> <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">D</kbd>, aceleras con <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">W</kbd> y disparas con <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Espacio</kbd>. <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">R</kbd> reinicia y <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Esc</kbd> vuelve al menú.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Cómo usar Hill Climb</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60 font-sans">
                      Haz clic en la ventana nativa para darle foco. Mantén <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">D</kbd> o <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">→</kbd> para acelerar; mantén <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">A</kbd> o <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">←</kbd> para frenar y retroceder. <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">R</kbd> reinicia y <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Esc</kbd> cierra. Gastas combustible al acelerar: recoge los bidones amarillos del camino.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">Cómo usar el editor</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60 font-sans">
                      Haz clic en una figura del viewport para seleccionarla y arrástrala para moverla; con el botón derecho desplazas la cámara y con la rueda haces zoom. La barra superior crea, duplica, borra, deshace y guarda. Atajos: <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Ctrl+S</kbd> guardar, <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Ctrl+Z</kbd> deshacer, <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">W/E/R</kbd> gizmos, <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">Tab</kbd> maximizar. Para comprobar el engine usa <span className="font-bold text-cyan-200">Ejecutar Lab</span>.
                    </p>
                  </div>
                </div>

                {cppOutput && (
                  <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-black/70 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                      <span>Salida del Engine Validation Lab</span>
                      <button
                        type="button"
                        onClick={() => setCppOutput('')}
                        className="text-white/50 transition hover:text-white"
                      >
                        LIMPIAR
                      </button>
                    </div>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-[10px] leading-relaxed text-white/70">
                      {cppOutput}
                    </pre>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeView === 'mahjong' && (
            <div className="relative w-full rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/60 p-2 sm:p-4">
              <Mahjong />
            </div>
          )}

          {activeView === 'hillclimb' && (
            <div className="relative w-full rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/60 p-2 sm:p-4">
              <HillClimbCanvas accentColor={accentColor} />
            </div>
          )}

          {activeView === 'smashfest' && (
            <div className="relative w-full h-[calc(100vh-14rem)] min-h-[600px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black">
              <SmashFestPage />
            </div>
          )}

          {activeView === 'designlab' && (
            <div className="relative w-full rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/60 p-2 sm:p-4">
              <DesignLab />
            </div>
          )}

          {activeView === 'engineprofiler' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event & Trigger Testing Controls */}
              <div className="space-y-6 border border-white/15 bg-slate-950/80 p-6 rounded-3xl backdrop-blur-2xl">
                <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                  <Zap className="w-5 h-5 text-[#ff4b89]" /> DISPARADOR DE EVENTOS
                </h3>
                <div className="space-y-3">
                  <p className="text-xs text-white/60 font-sans">
                    Prueba la emulación de disparos de Timeline Triggers y eventos en tiempo real:
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTriggerSimulatedEvent('BeatTrigger_SpawnEntity')}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase text-left transition-all flex items-center justify-between"
                  >
                    <span>1. Spawn Entity (Beat 120)</span>
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSimulatedEvent('CameraTimeline_Shake')}
                    className="w-full px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs uppercase text-left transition-all flex items-center justify-between"
                  >
                    <span>2. Camera Shake (Intensity 0.5)</span>
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSimulatedEvent('Modifier_GravityMultiplier')}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold text-xs uppercase text-left transition-all flex items-center justify-between"
                  >
                    <span>3. Apply Modifier (Gravity x1.5)</span>
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSimulatedEvent('Hazard_InstantKill')}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs uppercase text-left transition-all flex items-center justify-between"
                  >
                    <span>4. Hazard Damage Dispatch</span>
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* BPM Regulator */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase">
                    <span>TEMPO RÍTMICO:</span>
                    <span className="text-purple-400">{bpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => {
                      setBpm(Number(e.target.value));
                      addLog('RHYTHM', 'info', `BPM cambiado a ${e.target.value}`);
                    }}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Console Event Log View */}
              <div className="lg:col-span-2 border border-white/15 bg-black/90 p-6 rounded-3xl backdrop-blur-2xl flex flex-col justify-between h-[500px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" /> CONSOLA DE REGISTROS EN VIVO
                  </h3>
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="px-3 py-1 rounded-lg border border-white/20 hover:bg-white/10 text-[10px] uppercase font-bold text-white/70"
                  >
                    LIMPIAR CONSOLA
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/20 font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-center text-white/40 py-12">No hay registros aún...</div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-2 rounded bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
                      >
                        <span className="text-white/40 text-[10px] shrink-0 pt-0.5">{log.timestamp}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                            log.level === 'success'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : log.level === 'warn'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          [{log.subsystem}]
                        </span>
                        <span className="text-white/90 text-xs break-all">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
