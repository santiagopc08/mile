'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Gift,
  Compass,
  Heart,
  Calendar,
  ChevronRight,
  ArrowRight,
  Lock,
  Unlock,
  Sparkles,
  Activity,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import { useStore } from "@/context/StoreContext";
import { supabase } from '@/lib/supabase';
import { AnimatedBrutalistCorners } from "@/components/ui/AnimatedBrutalistCorners";
import Link from 'next/link';

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

// Flower icon assets mapping
const FLOATING_FLOWERS = [
  '/img/flowers/icons8-flor-100-2.png',
  '/img/flowers/icons8-flor-100-3.png',
  '/img/flowers/icons8-flor-100-11.png',
  '/img/flowers/icons8-flor-100-20.png',
  '/img/flowers/icons8-rododendro-100.png',
  '/img/flowers/icons8-adormidera-100.png'
];

// Synth Scheduler Class to avoid memory leaks
class BdaySynth {
  private ctx: AudioContext | null = null;
  private timerId: any = null;
  private index = 0;
  private isPlaying = false;
  private isTempMuted = false;

  start() {
    if (this.isPlaying) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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

// --- Floating Flower Component and Configurations ---
interface FloatingFlowerProps {
  src: string;
  initialTop: string;
  initialSide: 'left' | 'right';
  initialSideValue: string;
  targetYOffset: number;
  targetXOffset: number;
  initialRotate: number;
  targetRotate: number;
  sizeClass: string;
  smoothProgress: any;
  /** Stagger delay: shifts the scroll animation range start (0 = earliest, 0.08 = latest) */
  delay?: number;
  /** Peak opacity (0.0–1.0) for depth layering — farther flowers appear dimmer */
  peakOpacity?: number;
  /** Additional z-index for depth layering */
  zOffset?: number;
}

function FloatingFlower({
  src,
  initialTop,
  initialSide,
  initialSideValue,
  targetYOffset,
  targetXOffset,
  initialRotate,
  targetRotate,
  sizeClass,
  smoothProgress,
  delay = 0,
  peakOpacity = 1,
  zOffset = 0
}: FloatingFlowerProps) {
  const rangeStart = 0.18 + delay;
  const rangeEnd = 0.81 + delay * 0.05;
  const x = useTransform(smoothProgress, [rangeStart, rangeEnd], ['0vw', `${targetXOffset}vw`]);
  const y = useTransform(smoothProgress, [rangeStart, rangeEnd], ['0vh', `${targetYOffset}vh`]);
  const rotate = useTransform(smoothProgress, [rangeStart, rangeEnd], [initialRotate, targetRotate]);

  const sideStyle = initialSide === 'left' ? { left: initialSideValue } : { right: initialSideValue };

  return (
    <motion.img
      src={src}
      alt=""
      style={{
        x,
        y,
        rotate,
        top: initialTop,
        ...sideStyle,
        zIndex: zOffset,
        opacity: peakOpacity
      }}
      className={`absolute object-contain pointer-events-none ${sizeClass}`}
    />
  );
}

// Natural bouquet: varied spacing, staggered depths, asymmetric offsets
const LEFT_FLOWERS_CONFIG: Omit<FloatingFlowerProps, 'smoothProgress'>[] = [
  // Top scattered — small, dim background flowers
  { src: '/img/flowers/icons8-flor-100-2.png', initialTop: '5%', initialSide: 'left', initialSideValue: '4%', targetYOffset: 62, targetXOffset: 8, initialRotate: 18, targetRotate: -12, sizeClass: 'w-8 h-8 sm:w-10 sm:h-10', delay: 0.02, peakOpacity: 0.5, zOffset: 1 },
  { src: '/img/flowers/icons8-flor-100-9.png', initialTop: '11%', initialSide: 'left', initialSideValue: '20%', targetYOffset: 58, targetXOffset: 5, initialRotate: -25, targetRotate: 10, sizeClass: 'w-7 h-7 sm:w-9 sm:h-9', delay: 0.06, peakOpacity: 0.45, zOffset: 0 },
  // Upper-mid — medium accent flowers
  { src: '/img/flowers/icons8-flor-100-11.png', initialTop: '19%', initialSide: 'left', initialSideValue: '14%', targetYOffset: 52, targetXOffset: 14, initialRotate: -8, targetRotate: 22, sizeClass: 'w-14 h-14 sm:w-20 sm:h-20', delay: 0.0, peakOpacity: 0.85, zOffset: 3 },
  { src: '/img/flowers/icons8-rododendro-100.png', initialTop: '26%', initialSide: 'left', initialSideValue: '6%', targetYOffset: 48, targetXOffset: 26, initialRotate: 40, targetRotate: -18, sizeClass: 'w-10 h-10 sm:w-14 sm:h-14', delay: 0.03, peakOpacity: 0.7, zOffset: 2 },
  // Mid — hero flowers (biggest, brightest)
  { src: '/img/flowers/icons8-flor-100-12.png', initialTop: '34%', initialSide: 'left', initialSideValue: '22%', targetYOffset: 30, targetXOffset: 18, initialRotate: -40, targetRotate: 28, sizeClass: 'w-12 h-12 sm:w-16 sm:h-16', delay: 0.01, peakOpacity: 1.0, zOffset: 5 },
  { src: '/img/flowers/icons8-flor-100-22.png', initialTop: '42%', initialSide: 'left', initialSideValue: '8%', targetYOffset: 38, targetXOffset: 22, initialRotate: 15, targetRotate: -8, sizeClass: 'w-16 h-16 sm:w-22 sm:h-22', delay: 0.0, peakOpacity: 1.0, zOffset: 6 },
  { src: '/img/flowers/icons8-flor-100-27.png', initialTop: '50%', initialSide: 'left', initialSideValue: '18%', targetYOffset: 24, targetXOffset: 12, initialRotate: -20, targetRotate: 15, sizeClass: 'w-11 h-11 sm:w-15 sm:h-15', delay: 0.04, peakOpacity: 0.9, zOffset: 4 },
  // Lower-mid — scattered filler
  { src: '/img/flowers/icons8-flor-100-25.png', initialTop: '59%', initialSide: 'left', initialSideValue: '24%', targetYOffset: 14, targetXOffset: 20, initialRotate: -10, targetRotate: 30, sizeClass: 'w-13 h-13 sm:w-17 sm:h-17', delay: 0.02, peakOpacity: 0.8, zOffset: 3 },
  { src: '/img/flowers/icons8-flor-100-10.png', initialTop: '66%', initialSide: 'left', initialSideValue: '10%', targetYOffset: 16, targetXOffset: 28, initialRotate: 30, targetRotate: -22, sizeClass: 'w-9 h-9 sm:w-11 sm:h-11', delay: 0.05, peakOpacity: 0.6, zOffset: 1 },
  { src: '/img/flowers/icons8-flor-100-24.png', initialTop: '72%', initialSide: 'left', initialSideValue: '20%', targetYOffset: 8, targetXOffset: 15, initialRotate: -35, targetRotate: 18, sizeClass: 'w-10 h-10 sm:w-14 sm:h-14', delay: 0.03, peakOpacity: 0.75, zOffset: 2 },
  // Bottom — converging bouquet base
  { src: '/img/flowers/icons8-flor-100-13.png', initialTop: '80%', initialSide: 'left', initialSideValue: '28%', targetYOffset: -6, targetXOffset: 10, initialRotate: -28, targetRotate: 12, sizeClass: 'w-12 h-12 sm:w-16 sm:h-16', delay: 0.01, peakOpacity: 0.9, zOffset: 5 },
  { src: '/img/flowers/icons8-flor-100-14.png', initialTop: '87%', initialSide: 'left', initialSideValue: '12%', targetYOffset: -2, targetXOffset: 22, initialRotate: 22, targetRotate: -30, sizeClass: 'w-14 h-14 sm:w-18 sm:h-18', delay: 0.0, peakOpacity: 1.0, zOffset: 7 },
  { src: '/img/flowers/icons8-oro-rosa-100.png', initialTop: '93%', initialSide: 'left', initialSideValue: '20%', targetYOffset: -12, targetXOffset: 16, initialRotate: -12, targetRotate: 35, sizeClass: 'w-10 h-10 sm:w-14 sm:h-14', delay: 0.04, peakOpacity: 0.7, zOffset: 2 },
];

const RIGHT_FLOWERS_CONFIG: Omit<FloatingFlowerProps, 'smoothProgress'>[] = [
  // Top scattered — small, dim background flowers
  { src: '/img/flowers/icons8-flor-100-3.png', initialTop: '6%', initialSide: 'right', initialSideValue: '6%', targetYOffset: 60, targetXOffset: -10, initialRotate: -15, targetRotate: 8, sizeClass: 'w-9 h-9 sm:w-11 sm:h-11', delay: 0.03, peakOpacity: 0.5, zOffset: 1 },
  { src: '/img/flowers/icons8-flor-100-7.png', initialTop: '14%', initialSide: 'right', initialSideValue: '22%', targetYOffset: 56, targetXOffset: -7, initialRotate: 20, targetRotate: -14, sizeClass: 'w-7 h-7 sm:w-9 sm:h-9', delay: 0.05, peakOpacity: 0.4, zOffset: 0 },
  // Upper-mid — medium accent flowers
  { src: '/img/flowers/icons8-flor-100-20.png', initialTop: '21%', initialSide: 'right', initialSideValue: '12%', targetYOffset: 50, targetXOffset: -16, initialRotate: 10, targetRotate: -20, sizeClass: 'w-14 h-14 sm:w-20 sm:h-20', delay: 0.01, peakOpacity: 0.85, zOffset: 3 },
  { src: '/img/flowers/icons8-adormidera-100.png', initialTop: '28%', initialSide: 'right', initialSideValue: '8%', targetYOffset: 46, targetXOffset: -24, initialRotate: -42, targetRotate: 20, sizeClass: 'w-11 h-11 sm:w-15 sm:h-15', delay: 0.04, peakOpacity: 0.65, zOffset: 2 },
  // Mid — hero flowers (biggest, brightest)
  { src: '/img/flowers/icons8-flor-100-15.png', initialTop: '37%', initialSide: 'right', initialSideValue: '20%', targetYOffset: 32, targetXOffset: -20, initialRotate: 38, targetRotate: -25, sizeClass: 'w-12 h-12 sm:w-16 sm:h-16', delay: 0.0, peakOpacity: 1.0, zOffset: 5 },
  { src: '/img/flowers/icons8-flor-100-26.png', initialTop: '45%', initialSide: 'right', initialSideValue: '6%', targetYOffset: 35, targetXOffset: -24, initialRotate: -14, targetRotate: 12, sizeClass: 'w-16 h-16 sm:w-22 sm:h-22', delay: 0.01, peakOpacity: 1.0, zOffset: 6 },
  { src: '/img/flowers/icons8-flor-100-29.png', initialTop: '52%', initialSide: 'right', initialSideValue: '16%', targetYOffset: 22, targetXOffset: -14, initialRotate: 24, targetRotate: -18, sizeClass: 'w-11 h-11 sm:w-15 sm:h-15', delay: 0.03, peakOpacity: 0.9, zOffset: 4 },
  // Lower-mid — scattered filler
  { src: '/img/flowers/icons8-flor-100-28.png', initialTop: '61%', initialSide: 'right', initialSideValue: '26%', targetYOffset: 12, targetXOffset: -18, initialRotate: 14, targetRotate: -28, sizeClass: 'w-13 h-13 sm:w-17 sm:h-17', delay: 0.02, peakOpacity: 0.8, zOffset: 3 },
  { src: '/img/flowers/icons8-flor-100-16.png', initialTop: '68%', initialSide: 'right', initialSideValue: '8%', targetYOffset: 14, targetXOffset: -26, initialRotate: -32, targetRotate: 20, sizeClass: 'w-8 h-8 sm:w-10 sm:h-10', delay: 0.06, peakOpacity: 0.55, zOffset: 1 },
  { src: '/img/flowers/icons8-flor-100-30.png', initialTop: '74%', initialSide: 'right', initialSideValue: '18%', targetYOffset: 6, targetXOffset: -12, initialRotate: 28, targetRotate: -15, sizeClass: 'w-10 h-10 sm:w-14 sm:h-14', delay: 0.04, peakOpacity: 0.7, zOffset: 2 },
  // Bottom — converging bouquet base
  { src: '/img/flowers/icons8-flor-100-17.png', initialTop: '82%', initialSide: 'right', initialSideValue: '24%', targetYOffset: -8, targetXOffset: -10, initialRotate: 25, targetRotate: -12, sizeClass: 'w-12 h-12 sm:w-16 sm:h-16', delay: 0.0, peakOpacity: 0.9, zOffset: 5 },
  { src: '/img/flowers/icons8-flor-100-18.png', initialTop: '89%', initialSide: 'right', initialSideValue: '10%', targetYOffset: -1, targetXOffset: -20, initialRotate: -18, targetRotate: 32, sizeClass: 'w-14 h-14 sm:w-18 sm:h-18', delay: 0.01, peakOpacity: 1.0, zOffset: 7 },
  { src: '/img/flowers/icons8-flor-de-saúco-100.png', initialTop: '95%', initialSide: 'right', initialSideValue: '18%', targetYOffset: -10, targetXOffset: -22, initialRotate: 12, targetRotate: -38, sizeClass: 'w-10 h-10 sm:w-14 sm:h-14', delay: 0.05, peakOpacity: 0.65, zOffset: 2 },
];

const GIFTS_DATA = [
  {
    id: 'gift-cena',
    title: 'Cena Romántica',
    subtitle: 'Un momento solo para los dos',
    icon: '🥂',
    color: 'from-[#ff4b89] to-[#a178ff]',
    type: 'invitation',
    details: {
      title: 'Cena Sorpresa Secreta',
      place: 'Reservado - 8:00 PM',
      desc: 'Prepara tu outfit favorito, yo me encargo de absolutamente todo el resto.'
    }
  },
  {
    id: 'gift-photos',
    title: 'Nuestra Historia',
    subtitle: 'Un viaje en el tiempo',
    icon: '📸',
    color: 'from-[#a178ff] to-[#c3f400]',
    type: 'timeline'
  },
  {
    id: 'gift-mystery',
    title: 'Paquete Misterioso',
    subtitle: '¿Qué podrá ser?',
    icon: '/cumple/Open Colorful Gift Box.svg',
    color: 'from-[#c3f400] to-[#ff4b89]',
    type: 'mystery',
    details: {
      hint: 'Es un paquete físico envuelto con amor... ¡Pero ni yo sé dónde o cómo va a aparecer!'
    }
  },
  {
    id: 'gift-todos-video',
    title: 'Felicidades',
    subtitle: 'Mensajes de todos',
    icon: '/cumple/Open Colorful Gift Box.svg',
    color: 'from-[#ff4b89] via-[#a178ff] to-[#c3f400]',
    type: 'video-all',
    details: {
      videoUrl: '/cumple/todos.mp4'
    }
  }
];

const petBubbles = [
  {
    id: 'kiaro',
    name: 'Kiaro',
    src: '/img/pets/Kiaro.png',
    video: '/cumple/Kiaro.mp4',
    accent: '#ff7020',
    role: 'GUARDIAN ETERNO',
    msg: 'HUMANA, AUNQUE AHORA TE CUIDO DESDE OTRO LUGAR Y MIS HUELLAS QUEDARON MARCADAS PARA SIEMPRE, HOY BAJO UN RATITO PARA DESEARTE EL MAS FELIZ DE LOS CUMPLEANOS. SIGUE BRILLANDO, TE AMO CON TODA MI ALMA GATUNA.',
    side: 'left',
    avatarBg: 'border-amber-500/40',
    bubbleBg: 'border-amber-500/30'
  },
  {
    id: 'nika',
    name: 'Nika',
    src: '/img/pets/Nika.png',
    video: '/cumple/Nika.mp4',
    accent: '#00dbe9',
    role: 'EXPLORADORA',
    msg: 'FELIZ CUMPLE, MILE. REPORTANDO QUE TUS SUENOS ESTAN EN PERFECTAS CONDICIONES BAJO MI SUPERVISION HOY.',
    side: 'right',
    avatarBg: 'border-cyan-500/40',
    bubbleBg: 'border-cyan-500/30'
  },
  {
    id: 'sam',
    name: 'Sam',
    src: '/img/pets/Sam.png',
    video: '/cumple/Sam.mp4',
    accent: '#a100f0',
    role: 'NAVEGANTE',
    msg: 'CAPITANA. INICIANDO SECUENCIA DE CELEBRACION Y REPARTICION DE PREMIOS EN TU HONOR. FELIZ DIA A BORDO.',
    side: 'left',
    avatarBg: 'border-purple-500/40',
    bubbleBg: 'border-purple-500/30'
  },
  {
    id: 'miel',
    name: 'Miel',
    src: '/img/pets/Miel.png',
    video: '/cumple/Miel.mp4',
    accent: '#ffb595',
    role: 'MIMOSA',
    msg: 'FELIZ CUMPLEANOS. MI INDICACION OFICIAL PARA EL DIA DE HOY ES: CIENTO POR CIENTO DE DESCANSO, TONELADAS DE CARICIAS Y UNA DOSIS GIGANTE DE PASTEL.',
    side: 'right',
    avatarBg: 'border-yellow-500/40',
    bubbleBg: 'border-yellow-500/30'
  }
];

// --- Dynamic Sub-component for the Sticky Scroll Storytelling Interface ---
interface BirthdayScrollProps {
  bgmActive: boolean;
  toggleBgm: () => void;
  setBgmTempMute: (muted: boolean) => void;
}

function BirthdayScrollContainer({ bgmActive, toggleBgm, setBgmTempMute }: BirthdayScrollProps) {
  const { profile } = useProfile();
  const { data } = useStore();
  const events = useMemo(() => (data?.events || []) as any[], [data?.events]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canvasCleanupRef = useRef<(() => void) | null>(null);

  const bgCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    // Clean up previous canvas loop if any
    if (canvasCleanupRef.current) {
      canvasCleanupRef.current();
      canvasCleanupRef.current = null;
    }

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const loadedImages: HTMLImageElement[] = [];
    FLOATING_FLOWERS.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loadedImages.push(img);
      };
      img.src = src;
    });

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rot: number;
      rotSpeed: number;
      imgIdx: number;
      opacity: number;
    }

    interface StaticFlower {
      x: number;
      y: number;
      size: number;
      rot: number;
      imgIdx: number;
      opacity: number;
    }

    let fallingParticles: Particle[] = [];
    const staticFlowers: StaticFlower[] = [];

    const maxFalling = 40;
    const maxStatic = 300;
    let frameId: number;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Canvas debugging indicator dot at top-center
      ctx.fillStyle = '#ff4b89';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Spawn falling flowers
      if (fallingParticles.length < maxFalling && Math.random() < 0.08) {
        fallingParticles.push({
          x: Math.random() * canvas.width,
          y: -40,
          size: Math.random() * 16 + 14,
          speedX: (Math.random() - 0.5) * 1.2,
          speedY: Math.random() * 2.0 + 1.5,
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 1.5,
          imgIdx: Math.floor(Math.random() * FLOATING_FLOWERS.length),
          opacity: Math.random() * 0.4 + 0.4
        });
      }

      // Update and draw falling particles
      fallingParticles = fallingParticles.filter(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rot += p.rotSpeed;

        // Check landing at the bottom
        if (p.y >= canvas.height - p.size / 2) {
          staticFlowers.push({
            x: p.x,
            y: canvas.height - p.size / 2 + (Math.random() * 4),
            size: p.size,
            rot: p.rot,
            imgIdx: p.imgIdx,
            opacity: p.opacity
          });

          if (staticFlowers.length > maxStatic) {
            staticFlowers.shift();
          }
          return false;
        }

        if (p.x < -p.size || p.x > canvas.width + p.size) {
          return false;
        }

        if (loadedImages.length > 0) {
          const img = loadedImages[p.imgIdx % loadedImages.length];
          if (img && img.complete) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
          }
        }
        return true;
      });

      // Draw static flowers
      staticFlowers.forEach(sf => {
        if (loadedImages.length > 0) {
          const img = loadedImages[sf.imgIdx % loadedImages.length];
          if (img && img.complete) {
            ctx.save();
            ctx.translate(sf.x, sf.y);
            ctx.rotate((sf.rot * Math.PI) / 180);
            ctx.globalAlpha = sf.opacity;
            ctx.drawImage(img, -sf.size / 2, -sf.size / 2, sf.size, sf.size);
            ctx.restore();
          }
        }
      });

      ctx.globalAlpha = 1.0;
      frameId = requestAnimationFrame(tick);
    };

    const startTimeout = setTimeout(() => {
      tick();
    }, 200);

    canvasCleanupRef.current = () => {
      cancelAnimationFrame(frameId);
      clearTimeout(startTimeout);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Initialize Framer Motion useScroll hook bound directly to the container
  const { scrollYProgress } = useScroll();

  // Apply spring physics for premium inertial scrolling feel on mobile PWA
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 25, restDelta: 0.001 });

  // --- Interpolation mappings matching the iOS WebKit & Framer Motion specs ---

  // 1. Intro Fade-Out and Collapse (Progress 0.0 to 0.20)
  const introOpacity = useTransform(smoothProgress, [0, 0.18], [1, 0]);
  const introScale = useTransform(smoothProgress, [0, 0.20], [1, 0.90]);
  const introY = useTransform(smoothProgress, [0, 0.20], [0, -150]);
  const introPointerEvents = useTransform(smoothProgress, (v) => v < 0.18 ? "auto" : "none");

  // 2. Staggered Flower Inflow & Parallax Lateral columns (Progress 0.18 to 0.34)
  const flowersOpacity = useTransform(smoothProgress, [0.18, 0.22, 0.31, 0.34], [0, 1, 1, 0]);
  const flowersScale = useTransform(smoothProgress, [0.18, 0.22, 0.31, 0.34], [0.95, 1, 1, 0.95]);
  const flowersPointerEvents = useTransform(smoothProgress, (v) => (v >= 0.18 && v < 0.34) ? "auto" : "none");

  // Flower lateral transformations - they stay visible longer (up to 0.85)
  const flowerLeftOpacity = useTransform(smoothProgress, [0.15, 0.22, 0.81, 0.85], [0, 1, 1, 0]);
  const flowerLeftX = useTransform(smoothProgress, [0.15, 0.22, 0.26, 0.35, 0.81, 0.85], ['-100vw', '35vw', '35vw', '0vw', '0vw', '-50vw']);
  const flowerLeftRotate = useTransform(smoothProgress, [0.15, 0.22, 0.26, 0.35, 0.81, 0.85], [-45, 12, 12, 5, 5, -15]);

  const flowerRightOpacity = useTransform(smoothProgress, [0.17, 0.25, 0.81, 0.85], [0, 1, 1, 0]);
  const flowerRightX = useTransform(smoothProgress, [0.17, 0.25, 0.26, 0.35, 0.81, 0.85], ['100vw', '-35vw', '-35vw', '0vw', '0vw', '50vw']);
  const flowerRightRotate = useTransform(smoothProgress, [0.17, 0.25, 0.26, 0.35, 0.81, 0.85], [45, -12, -12, -8, -8, 15]);

  // Parallax transform calculations for floating scroll decorations
  const yFlow1 = useTransform(smoothProgress, [0.1, 0.9], [0, -150]);
  const yFlow2 = useTransform(smoothProgress, [0.2, 0.8], [0, 150]);
  const yFlow3 = useTransform(smoothProgress, [0.3, 0.95], [0, -100]);

  // 3. Pet Cavalcade Entrance (Progress 0.31 to 0.83)
  // Section stays on screen, but individual cards animate sequentially within this range.
  const petsOpacity = useTransform(smoothProgress, [0.31, 0.33, 0.81, 0.83], [0, 1, 1, 0]);
  const petsScale = useTransform(smoothProgress, [0.31, 0.33, 0.81, 0.83], [0.95, 1, 1, 0.95]);
  const petsPointerEvents = useTransform(smoothProgress, (v) => (v >= 0.31 && v < 0.83) ? "auto" : "none");

  // Pet 0 (Kiaro) transforms: [0.33, 0.45]
  // Bubble fades 0.38→0.40. Video cross-fades starting at 0.36 (0.02 before bubble fade).
  const pet0Opacity = useTransform(smoothProgress, [0.315, 0.345, 0.435, 0.45], [0, 1, 1, 0]);
  const pet0Scale = useTransform(smoothProgress, [0.315, 0.345, 0.435, 0.45], [0.9, 1, 1, 0.9]);
  const pet0AvatarScale = useTransform(smoothProgress, [0.33, 0.35, 0.43, 0.45], [0.8, 1, 1, 0.8]);
  const pet0AvatarOpacity = useTransform(smoothProgress, [0.33, 0.35, 0.43, 0.45], [0, 1, 1, 0]);
  const pet0BubbleOpacity = useTransform(smoothProgress, [0.33, 0.345, 0.37, 0.39], [0, 1, 1, 0]);
  const pet0BubbleScale = useTransform(smoothProgress, [0.33, 0.345, 0.37, 0.39], [0.85, 1, 1, 0.85]);
  const pet0VideoOpacity = useTransform(smoothProgress, [0.36, 0.385, 0.435, 0.45], [0, 1, 1, 0]);
  const pet0VideoScale = useTransform(smoothProgress, [0.36, 0.385, 0.435, 0.45], [0.75, 1.05, 1.05, 0.75]);
  const pet0VideoY = useTransform(smoothProgress, [0.36, 0.39], [40, 0]);
  const pet0PointerEvents = useTransform(pet0Opacity, (v) => v > 0.15 ? "auto" : "none");
  const pet0BubblePointerEvents = useTransform(pet0BubbleOpacity, (v) => v > 0.15 ? "auto" : "none");

  // Pet 1 (Nika) transforms: [0.45, 0.57]
  // Bubble fades 0.50→0.52. Video cross-fades starting at 0.48.
  const pet1Opacity = useTransform(smoothProgress, [0.435, 0.465, 0.555, 0.57], [0, 1, 1, 0]);
  const pet1Scale = useTransform(smoothProgress, [0.435, 0.465, 0.555, 0.57], [0.9, 1, 1, 0.9]);
  const pet1AvatarScale = useTransform(smoothProgress, [0.45, 0.47, 0.55, 0.57], [0.8, 1, 1, 0.8]);
  const pet1AvatarOpacity = useTransform(smoothProgress, [0.45, 0.47, 0.55, 0.57], [0, 1, 1, 0]);
  const pet1BubbleOpacity = useTransform(smoothProgress, [0.45, 0.465, 0.49, 0.51], [0, 1, 1, 0]);
  const pet1BubbleScale = useTransform(smoothProgress, [0.45, 0.465, 0.49, 0.51], [0.85, 1, 1, 0.85]);
  const pet1VideoOpacity = useTransform(smoothProgress, [0.48, 0.505, 0.555, 0.57], [0, 1, 1, 0]);
  const pet1VideoScale = useTransform(smoothProgress, [0.48, 0.505, 0.555, 0.57], [0.75, 1.05, 1.05, 0.75]);
  const pet1VideoY = useTransform(smoothProgress, [0.48, 0.51], [40, 0]);
  const pet1PointerEvents = useTransform(pet1Opacity, (v) => v > 0.15 ? "auto" : "none");
  const pet1BubblePointerEvents = useTransform(pet1BubbleOpacity, (v) => v > 0.15 ? "auto" : "none");

  // Pet 2 (Sam) transforms: [0.57, 0.69]
  // Bubble fades 0.62→0.64. Video cross-fades starting at 0.60.
  const pet2Opacity = useTransform(smoothProgress, [0.555, 0.585, 0.675, 0.69], [0, 1, 1, 0]);
  const pet2Scale = useTransform(smoothProgress, [0.555, 0.585, 0.675, 0.69], [0.9, 1, 1, 0.9]);
  const pet2AvatarScale = useTransform(smoothProgress, [0.57, 0.59, 0.67, 0.69], [0.8, 1, 1, 0.8]);
  const pet2AvatarOpacity = useTransform(smoothProgress, [0.57, 0.59, 0.67, 0.69], [0, 1, 1, 0]);
  const pet2BubbleOpacity = useTransform(smoothProgress, [0.57, 0.585, 0.61, 0.63], [0, 1, 1, 0]);
  const pet2BubbleScale = useTransform(smoothProgress, [0.57, 0.585, 0.61, 0.63], [0.85, 1, 1, 0.85]);
  const pet2VideoOpacity = useTransform(smoothProgress, [0.60, 0.625, 0.675, 0.69], [0, 1, 1, 0]);
  const pet2VideoScale = useTransform(smoothProgress, [0.60, 0.625, 0.675, 0.69], [0.75, 1.05, 1.05, 0.75]);
  const pet2VideoY = useTransform(smoothProgress, [0.60, 0.63], [40, 0]);
  const pet2PointerEvents = useTransform(pet2Opacity, (v) => v > 0.15 ? "auto" : "none");
  const pet2BubblePointerEvents = useTransform(pet2BubbleOpacity, (v) => v > 0.15 ? "auto" : "none");

  // Pet 3 (Miel) transforms: [0.69, 0.83] — extended end for more video time
  // Bubble fades 0.74→0.76. Video cross-fades starting at 0.72. Extended to 0.83.
  const pet3Opacity = useTransform(smoothProgress, [0.675, 0.705, 0.81, 0.83], [0, 1, 1, 0]);
  const pet3Scale = useTransform(smoothProgress, [0.675, 0.705, 0.81, 0.83], [0.9, 1, 1, 0.9]);
  const pet3AvatarScale = useTransform(smoothProgress, [0.69, 0.71, 0.81, 0.83], [0.8, 1, 1, 0.8]);
  const pet3AvatarOpacity = useTransform(smoothProgress, [0.69, 0.71, 0.81, 0.83], [0, 1, 1, 0]);
  const pet3BubbleOpacity = useTransform(smoothProgress, [0.69, 0.705, 0.73, 0.75], [0, 1, 1, 0]);
  const pet3BubbleScale = useTransform(smoothProgress, [0.69, 0.705, 0.73, 0.75], [0.85, 1, 1, 0.85]);
  const pet3VideoOpacity = useTransform(smoothProgress, [0.72, 0.745, 0.81, 0.83], [0, 1, 1, 0]);
  const pet3VideoScale = useTransform(smoothProgress, [0.72, 0.745, 0.81, 0.83], [0.75, 1.05, 1.05, 0.75]);
  const pet3VideoY = useTransform(smoothProgress, [0.72, 0.75], [40, 0]);
  const pet3PointerEvents = useTransform(pet3Opacity, (v) => v > 0.15 ? "auto" : "none");
  const pet3BubblePointerEvents = useTransform(pet3BubbleOpacity, (v) => v > 0.15 ? "auto" : "none");

  // 4. Pastel & Regalos (Progress 0.80 to 1.0)
  const celebrationOpacity = useTransform(smoothProgress, [0.80, 0.84, 1], [0, 1, 1]);
  const celebrationScale = useTransform(smoothProgress, [0.80, 0.84, 1], [0.95, 1, 1]);
  const celebrationPointerEvents = useTransform(smoothProgress, (v) => v >= 0.80 ? "auto" : "none");

  // Corner flowers animation linked to scroll
  const flowerPathLength = useTransform(smoothProgress, [0.18, 0.32], [0, 1]);
  const flowerCircleScale = useTransform(smoothProgress, [0.28, 0.36], [0, 1]);

  // Pet GIF scroll transforms (hoisted to respect Rules of Hooks)
  const petGifOpacity = useTransform(smoothProgress, [0.78, 0.85], [0, 0.85]);
  const petGifScale = useTransform(smoothProgress, [0.78, 0.88], [0.5, 1]);

  // Mic candle states
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastBlowTimeRef = useRef<number>(0);
  const lastExtinguishTimeRef = useRef<number>(0);
  const blowDurationRef = useRef<number>(0);

  // Active Pet Video and Music Synch tracking
  const [activePetIndex, setActivePetIndex] = useState<number>(-1);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Candle status: 4 candles lit by default (initially unlit visually under STATE_IDLE)
  const [candles, setCandles] = useState<boolean[]>([true, true, true, true]);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [cakeState, setCakeState] = useState<'STATE_IDLE' | 'STATE_LIT' | 'STATE_BLOWN_OUT'>('STATE_IDLE');

  // Canvas particle / Confetti elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gift overlays & Phase states
  const [phase, setPhase] = useState<'PHASE_SCROLLING_STORY' | 'PHASE_CAKE_BLOW' | 'PHASE_GIFT_UNBOXING'>('PHASE_SCROLLING_STORY');
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [openedGifts, setOpenedGifts] = useState<Record<string, boolean>>({});
  const [redeemedCoupons, setRedeemedCoupons] = useState<string[]>([]);
  const constraintsRef = useRef<HTMLDivElement | null>(null);

  const handleOpenGift = (gift: any) => {
    setSelectedGift(gift);
    setOpenedGifts(prev => ({ ...prev, [gift.id]: true }));
  };

  // Lock scroll ONLY when a gift detail modal is active
  useEffect(() => {
    if (selectedGift) {
      document.body.style.overflow = 'hidden';
      const preventDefault = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        const isScrollable = target.closest('.overflow-y-auto') !== null;
        if (!isScrollable && e.cancelable) {
          e.preventDefault();
        }
      };
      document.addEventListener('touchmove', preventDefault, { passive: false });
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('touchmove', preventDefault);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedGift]);

  // Transition to PHASE_CAKE_BLOW when Mile reaches the bottom (96% safety threshold)
  useEffect(() => {
    if (phase !== 'PHASE_SCROLLING_STORY') return;

    const unsubscribe = smoothProgress.on("change", (latest) => {
      if (latest >= 0.96) {
        setPhase('PHASE_CAKE_BLOW');
      }
    });

    return () => unsubscribe();
  }, [smoothProgress, phase]);

  // Pre-warm video buffers when user approaches the pets section
  // This forces iOS to allocate media resources before the first play() call
  const videosWarmedRef = useRef(false);
  useEffect(() => {
    if (videosWarmedRef.current) return;
    const unsubscribe = smoothProgress.on("change", (latest) => {
      if (latest >= 0.28 && !videosWarmedRef.current) {
        videosWarmedRef.current = true;
        videoRefs.current.forEach((video) => {
          if (!video) return;
          video.muted = true;
          video.play().then(() => {
            video.pause();
            video.currentTime = 0;
          }).catch(() => { });
        });
      }
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  // Track active pet scroll progress to toggle video and BGM mute states
  // Play triggers start 0.01 before the video becomes visible to pre-buffer playback
  useEffect(() => {
    let prevIdx = -1;
    const unsubscribe = smoothProgress.on("change", (latest) => {
      let activeIdx = -1;
      if (latest >= 0.35 && latest < 0.45) activeIdx = 0;
      else if (latest >= 0.47 && latest < 0.57) activeIdx = 1;
      else if (latest >= 0.59 && latest < 0.69) activeIdx = 2;
      else if (latest >= 0.71 && latest < 0.83) activeIdx = 3;

      if (activeIdx !== prevIdx) {
        prevIdx = activeIdx;
        setActivePetIndex(activeIdx);
      }
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  // Control autoplay and background music muting based on active pet
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activePetIndex) {
        // Unmute and play the active video
        video.muted = false;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // iOS fallback: play muted first, then unmute after a frame
            video.muted = true;
            video.play().then(() => {
              requestAnimationFrame(() => { video.muted = false; });
            }).catch(() => { });
          });
        }
      } else {
        video.muted = true;
        video.pause();
        video.currentTime = 0;
      }
    });

    if (activePetIndex !== -1) {
      setBgmTempMute(true);
    } else {
      setBgmTempMute(false);
    }
  }, [activePetIndex, setBgmTempMute]);

  // Custom connection calculations
  const connectionStats = useMemo(() => {
    if (!data?.lastPulseAt) return { days: 101, eventsCount: events.length };
    const start = new Date("2024-01-01"); // Safe default connection date
    const diff = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return {
      days: diff,
      eventsCount: events.length
    };
  }, [data, events]);

  // Load redeemed coupons from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('redeemed_coupons');
      if (stored) {
        try {
          setRedeemedCoupons(JSON.parse(stored));
        } catch (e) { }
      }
    }
  }, []);

  // Filter 8 events with photos to display in the Polaroid Deck
  const polaroidEvents = useMemo(() => {
    return events.filter(e => e.imageUrl).slice(0, 8);
  }, [events]);

  // Web Audio API Microphone analyzer loop
  const startMicDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMicStream(stream);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicPermission('granted');
      setIsMicEnabled(true);
      setCakeState('STATE_LIT');
    } catch (err) {
      console.warn("Permiso de micrófono denegado o no soportado. Conmutando a modo táctil:", err);
      setMicPermission('denied');
      setCakeState('STATE_LIT');
    }
  };

  const stopMicDetection = () => {
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsMicEnabled(false);
    setMicVolume(0);
  };

  // Check Volume Loop for soplido using DSP Low Frequency Analysis
  useEffect(() => {
    if (!isMicEnabled || !analyserRef.current) return;

    let animId: number;
    const bufferLen = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLen);

    const checkBlow = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      // Low frequency analysis (bins index 0 to 8 focus on blow turbulence)
      let lowFrequencyEnergy = 0;
      for (let i = 0; i < 8; i++) {
        lowFrequencyEnergy += dataArray[i];
      }
      const averageEnergy = lowFrequencyEnergy / 8;

      // Normalize energy (0-255) for the volume visualizer
      setMicVolume(averageEnergy / 255);

      // Blow threshold check: average energy exceeds 165
      if (averageEnergy > 165) {
        blowDurationRef.current += 16.6; // ~16.6ms per frame
        if (blowDurationRef.current > 350) { // sustained for 350ms
          const now = Date.now();
          if (now - lastExtinguishTimeRef.current > 500) {
            lastExtinguishTimeRef.current = now;
            handleBlowOneCandle();
            blowDurationRef.current = 0; // Reset blow duration count
          }
        }
      } else {
        blowDurationRef.current = Math.max(0, blowDurationRef.current - 10);
      }

      animId = requestAnimationFrame(checkBlow);
    };

    animId = requestAnimationFrame(checkBlow);
    return () => cancelAnimationFrame(animId);
  }, [isMicEnabled, candles]);

  // Extinguish the next lit candle
  const handleBlowOneCandle = () => {
    setCandles(prev => {
      const idx = prev.findIndex(lit => lit === true);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = false;
        return copy;
      }
      return prev;
    });
  };

  // Blow out candles check
  useEffect(() => {
    const allBlown = candles.every(lit => lit === false);
    if (allBlown && !candlesBlown) {
      setCandlesBlown(true);
      setCakeState('STATE_BLOWN_OUT');
      stopMicDetection();
      triggerConfetti();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [candles, candlesBlown]);

  const handleCandleClick = (index: number) => {
    if (cakeState === 'STATE_LIT') {
      setCandles(prev => {
        const copy = [...prev];
        copy[index] = false;
        return copy;
      });
    }
  };

  // Canvas flower confetti particle animation
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = 400;

    const loadedImages: HTMLImageElement[] = [];
    FLOATING_FLOWERS.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedImages.push(img);
      };
    });

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rot: number;
      rotSpeed: number;
      imgIdx: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ['#ff4b89', '#c3f400', '#d1bcff', '#00dbe9', '#ffb595'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 60,
        y: canvas.height - 100 + (Math.random() - 0.5) * 20,
        size: Math.random() * 15 + 10,
        speedX: (Math.random() - 0.5) * 12,
        speedY: -Math.random() * 14 - 6,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        imgIdx: Math.floor(Math.random() * FLOATING_FLOWERS.length),
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.35; // Gravity
        p.rot += p.rotSpeed;

        if (p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);

          if (loadedImages.length > 0) {
            const img = loadedImages[p.imgIdx % loadedImages.length];
            if (img && img.complete) {
              ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
            } else {
              ctx.fillStyle = p.color;
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
          } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          }
          ctx.restore();
        }
      });

      frame++;
      if (alive && frame < 180) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    setTimeout(() => {
      draw();
    }, 100);
  };

  const handleRedeemCoupon = async (id: string, name: string) => {
    if (redeemedCoupons.includes(id)) return;

    const confirmRedeem = window.confirm(`¿Seguro que deseas canjear este cupón hoy?`);
    if (!confirmRedeem) return;

    const updated = [...redeemedCoupons, id];
    setRedeemedCoupons(updated);
    localStorage.setItem('redeemed_coupons', JSON.stringify(updated));

    try {
      const { error } = await supabase.from('notifications').insert({
        target_profile: 'el',
        type: 'cumple_coupon',
        message: `¡Mile ha canjeado el vale: "${name}"!`,
        read: false
      });
      if (error) throw error;
      alert(`¡Cupón canjeado con éxito! Santi ya lo sabe.`);
    } catch (e: any) {
      console.error(e);
      alert(`Cupón guardado localmente, pero falló la notificación automática en el servidor.`);
    }
  };



  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[600vh] bg-gradient-to-b from-black via-[#07030e] via-[#12041b] via-[#1c0211] via-[#090108] to-black text-white overflow-x-hidden select-none pt-[env(safe-area-inset-top,59px)] pb-[env(safe-area-inset-bottom,34px)]"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Background falling and accumulating flowers canvas (rendered in portal to stack on top of navbar z-50) */}
      {mounted && typeof window !== 'undefined' && createPortal(
        <canvas ref={bgCanvasRef} className="fixed inset-0 pointer-events-none z-[59]" />,
        document.body
      )}
      {/* Viewport units Safari normalization fix */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .ios-viewport-fix {
          height: 100dvh;
          min-height: -webkit-fill-available;
        }
      `}} />

      {/* Top Fixed Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-900/50 z-[65]">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-500 via-[#c3f400] to-indigo-500 origin-left"
          style={{ scaleX: smoothProgress }}
        />
      </div>

      {/* CAPA DE LAS FLORES (Parallax Lateral y Ramo) */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[20] overflow-hidden"
      >
        {/* Lateral Izquierdo */}
        <motion.div
          style={{
            x: flowerLeftX,
            rotate: flowerLeftRotate,
            opacity: flowerLeftOpacity,
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
          className="absolute top-0 left-0 w-1/3 h-full pr-4"
        >
          {LEFT_FLOWERS_CONFIG.map((flower, idx) => (
            <FloatingFlower
              key={`left-${idx}`}
              {...flower}
              smoothProgress={smoothProgress}
            />
          ))}
        </motion.div>

        {/* Lateral Derecho */}
        <motion.div
          style={{
            x: flowerRightX,
            rotate: flowerRightRotate,
            opacity: flowerRightOpacity,
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
          className="absolute top-0 right-0 w-1/3 h-full pl-4"
        >
          {RIGHT_FLOWERS_CONFIG.map((flower, idx) => (
            <FloatingFlower
              key={`right-${idx}`}
              {...flower}
              smoothProgress={smoothProgress}
            />
          ))}
        </motion.div>

        {/* Pet GIFs — small, scattered among flowers, appear near the end */}
        {[
          { src: '/cumple/Kiaro.gif', top: '20%', left: '10%', size: 'w-24 h-24 sm:w-32 sm:h-32', rotate: 0 },
          { src: '/cumple/Nika.gif', bottom: '5%', left: '22%', size: 'w-20 h-20 sm:w-28 sm:h-28', rotate: 0 },
          { src: '/cumple/Miel.gif', bottom: '5%', right: '28%', size: 'w-20 h-20 sm:w-28 sm:h-28', rotate: 0 },
        ].map((gif, idx) => (
          <motion.img
            key={`pet-gif-${idx}`}
            src={gif.src}
            alt=""
            style={{
              opacity: petGifOpacity,
              scale: petGifScale,
              ...(gif.top ? { top: gif.top } : {}),
              ...(gif.bottom ? { bottom: gif.bottom } : {}),
              ...(gif.left ? { left: gif.left } : { right: gif.right }),
              rotate: gif.rotate,
              zIndex: 8
            }}
            className={`absolute object-contain pointer-events-none ${gif.size}`}
          />
        ))}
      </motion.div>

      {/* --- SECTION 1: INTRO (Progress 0.0 to 0.20) --- */}
      <motion.section
        style={{
          opacity: introOpacity,
          scale: introScale,
          y: introY,
          pointerEvents: introPointerEvents,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
        className="fixed inset-0 w-full ios-viewport-fix flex flex-col items-center justify-end pb-12 sm:pb-20 z-[30]"
      >
        <div className="w-full max-w-2xl px-4 text-center space-y-6 pointer-events-auto pt-[env(safe-area-inset-top,59px)] pb-[env(safe-area-inset-bottom,34px)]">
          <div className="border border-white/10 bg-black/75 backdrop-blur-md pt-8 px-6 pb-6 sm:pt-10 sm:px-10 sm:pb-8 relative">
            <AnimatedBrutalistCorners color="#ff4b89" size={16} thickness={1.5} />
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-[9px] font-mono font-bold uppercase tracking-[0.35em] text-[#a88a7e]">
                <Sparkles size={12} className="text-[#ff4b89] animate-spin-slow" />
                <span>CON TODO MI AMOR</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-mono font-black uppercase tracking-tight text-white leading-none">
                ¡FELIZ CUMPLEAÑOS, MILE! ✨
              </h1>
              <p className="text-xs sm:text-sm tracking-widest text-[#ff4b89] font-mono uppercase font-black">
                17 DE JUNIO DE 2026
              </p>
              <div className="h-px bg-white/10 my-4" />
              <p className="text-xs sm:text-sm leading-relaxed text-[#e1bfb2] font-sans">
                Mile, hoy es un día increíblemente especial. Quería prepararte un detalle único que exprese todo lo que eres para mí: complicidad, alegría y un amor inmenso que crece cada día.
              </p>
            </div>
          </div>
          {/* Scroll Hint */}
          <div className="animate-bounce font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 pt-4">
            Desliza suavemente hacia abajo...
          </div>
        </div>
      </motion.section>

      {/* --- SECTION 2: FLOWERS & STATS (Progress 0.18 to 0.45) --- */}
      <motion.section
        style={{
          opacity: flowersOpacity,
          scale: flowersScale,
          pointerEvents: flowersPointerEvents,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
        className="fixed inset-0 w-full ios-viewport-fix flex flex-col items-center justify-center z-[30]"
      >
        <div className="w-full max-w-2xl px-4 space-y-6 text-center pointer-events-auto relative pt-[env(safe-area-inset-top,59px)] pb-[env(safe-area-inset-bottom,34px)]">

          {/* Floating background images inside active wrapper */}
          <motion.img
            src="/img/flowers/icons8-flor-100-2.png"
            alt=""
            style={{ y: yFlow1 }}
            className="absolute left-[-80px] top-[10%] w-16 h-16 opacity-40 pointer-events-none hidden lg:block"
          />
          <motion.img
            src="/img/flowers/icons8-flor-100-11.png"
            alt=""
            style={{ y: yFlow2 }}
            className="absolute right-[-80px] top-[40%] w-20 h-20 opacity-40 pointer-events-none hidden lg:block"
          />

          <div className="border border-white/10 bg-black/75 backdrop-blur-md pt-6 px-6 pb-4 sm:pt-8 sm:px-8 sm:pb-6 relative space-y-4">
            <AnimatedBrutalistCorners color="#c3f400" size={14} thickness={1.5} />

            {/* Top-Left Corner Flower */}
            <div className="absolute top-3 left-3 pointer-events-none select-none">
              <svg width="44" height="44" viewBox="0 0 100 100" className="stroke-[#c3f400]">
                <motion.path
                  d="M 50,50 C 30,20 10,40 50,50 C 90,40 70,20 50,50 C 30,80 10,60 50,50 C 90,60 70,80 50,50 Z"
                  fill="none"
                  strokeWidth="2.5"
                  style={{ pathLength: flowerPathLength }}
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="7"
                  fill="#ff4b89"
                  style={{ scale: flowerCircleScale }}
                />
              </svg>
            </div>

            {/* Bottom-Right Corner Flower */}
            <div className="absolute bottom-3 right-3 pointer-events-none select-none rotate-180">
              <svg width="44" height="44" viewBox="0 0 100 100" className="stroke-[#c3f400]">
                <motion.path
                  d="M 50,50 C 30,20 10,40 50,50 C 90,40 70,20 50,50 C 30,80 10,60 50,50 C 90,60 70,80 50,50 Z"
                  fill="none"
                  strokeWidth="2.5"
                  style={{ pathLength: flowerPathLength }}
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="7"
                  fill="#ff4b89"
                  style={{ scale: flowerCircleScale }}
                />
              </svg>
            </div>

            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-[#c3f400]">
              NUESTRO TIEMPO JUNTOS
            </h2>
            <p className="text-xs leading-relaxed text-[#e1bfb2] font-sans">
              Cada día a tu lado es una hermosa aventura. Aquí tienes un pequeño recuento de todo lo que compartimos:
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
              <div className="border border-white/10 bg-black/85 p-3">
                <span className="text-[7px] text-[#a88a7e] uppercase tracking-wider block">Días compartidos</span>
                <span className="text-lg font-black text-white">{connectionStats.days} Días</span>
              </div>
              <div className="border border-white/10 bg-black/85 p-3">
                <span className="text-[7px] text-[#a88a7e] uppercase tracking-wider block">Momentos felices</span>
                <span className="text-lg font-black text-[#ff4b89]">{connectionStats.eventsCount} Momentos</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* --- SECTION 3: PETS MESSAGES (Progress 0.44 to 0.76) --- */}
      <motion.section
        style={{
          opacity: petsOpacity,
          scale: petsScale,
          pointerEvents: petsPointerEvents,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
        className="fixed inset-0 w-full ios-viewport-fix flex flex-col items-center justify-center z-[30]"
      >
        <div className="w-full max-w-xl px-4 pointer-events-auto pt-[env(safe-area-inset-top,59px)] pb-[env(safe-area-inset-bottom,34px)] relative h-[60dvh] flex flex-col justify-center">
          {/* Section header */}
          <div className="text-center space-y-1 mb-6 shrink-0">
            <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-[#a88a7e] block">Con cariño</span>
            <h2 className="text-md font-mono font-bold uppercase text-white">LA TRIPULACIÓN TE SALUDA</h2>
          </div>

          {/* Staggered cards container */}
          <div className="w-full relative h-[48dvh] sm:h-[42dvh] flex items-center justify-center">
            {petBubbles.map((pet, idx) => {
              const opacity = idx === 0 ? pet0Opacity : idx === 1 ? pet1Opacity : idx === 2 ? pet2Opacity : pet3Opacity;
              const scale = idx === 0 ? pet0Scale : idx === 1 ? pet1Scale : idx === 2 ? pet2Scale : pet3Scale;
              const avatarScale = idx === 0 ? pet0AvatarScale : idx === 1 ? pet1AvatarScale : idx === 2 ? pet2AvatarScale : pet3AvatarScale;
              const avatarOpacity = idx === 0 ? pet0AvatarOpacity : idx === 1 ? pet1AvatarOpacity : idx === 2 ? pet2AvatarOpacity : pet3AvatarOpacity;
              const bubbleOpacity = idx === 0 ? pet0BubbleOpacity : idx === 1 ? pet1BubbleOpacity : idx === 2 ? pet2BubbleOpacity : pet3BubbleOpacity;
              const bubbleScale = idx === 0 ? pet0BubbleScale : idx === 1 ? pet1BubbleScale : idx === 2 ? pet2BubbleScale : pet3BubbleScale;
              const videoOpacity = idx === 0 ? pet0VideoOpacity : idx === 1 ? pet1VideoOpacity : idx === 2 ? pet2VideoOpacity : pet3VideoOpacity;
              const videoScale = idx === 0 ? pet0VideoScale : idx === 1 ? pet1VideoScale : idx === 2 ? pet2VideoScale : pet3VideoScale;
              const videoY = idx === 0 ? pet0VideoY : idx === 1 ? pet1VideoY : idx === 2 ? pet2VideoY : pet3VideoY;
              const cardPointerEvents = idx === 0 ? pet0PointerEvents : idx === 1 ? pet1PointerEvents : idx === 2 ? pet2PointerEvents : pet3PointerEvents;
              const bubblePointerEvents = idx === 0 ? pet0BubblePointerEvents : idx === 1 ? pet1BubblePointerEvents : idx === 2 ? pet2BubblePointerEvents : pet3BubblePointerEvents;

              return (
                <motion.div
                  key={pet.id}
                  style={{ opacity, scale, pointerEvents: cardPointerEvents, willChange: 'transform, opacity' }}
                  className="absolute inset-0 flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-sm flex flex-col items-center gap-3 relative">

                    {/* Avatar Column */}
                    <div className="flex flex-col items-center flex-shrink-0 relative -mt-10 sm:-mt-14 mb-1">
                      <motion.div
                        style={{ scale: avatarScale, opacity: avatarOpacity, willChange: 'transform, opacity' }}
                        className={`w-20 h-20 sm:w-24 sm:h-24 overflow-hidden border ${pet.avatarBg} flex-shrink-0 relative flex items-center justify-center bg-zinc-950`}
                      >
                        <img
                          src={pet.src}
                          alt={pet.name}
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                        <div className="absolute inset-0 bg-slate-950/20" />
                      </motion.div>
                      <motion.span
                        style={{ opacity: avatarOpacity }}
                        className="mt-2 text-[9px] font-black tracking-wider text-white bg-black px-2.5 py-0.5 border border-white/10 font-mono uppercase z-10"
                      >
                        {pet.name}
                      </motion.span>
                    </div>

                    {/* Shared relative space for Dialog Bubble and Video */}
                    <div className="w-full relative min-h-[235px] sm:min-h-[265px] flex items-center justify-center">

                      {/* Card Message (Stage 1) */}
                      <motion.div
                        style={{
                          opacity: bubbleOpacity,
                          scale: bubbleScale,
                          originX: 0.5,
                          originY: 0,
                          pointerEvents: bubblePointerEvents
                        }}
                        className={`w-full p-4 sm:p-5 border ${pet.bubbleBg} bg-[#0a0a0a] absolute inset-x-0 top-0`}
                      >
                        <div className="flex flex-col gap-2 text-center items-center">
                          <div className="flex justify-between w-full border-b border-white/10 pb-2 mb-2">
                            <span className="text-[7px] text-stone-500 font-mono tracking-widest uppercase">ID: {pet.id.toUpperCase()}</span>
                            <span className="text-[7px] text-white font-mono tracking-widest uppercase">MENSAJE</span>
                          </div>
                          <span className="text-[8px] text-[#a88a7e] uppercase font-mono tracking-wider">{pet.role}</span>
                          <p className="text-[10px] leading-relaxed text-slate-100 antialiased font-mono uppercase mt-2">
                            {pet.msg}
                          </p>
                        </div>
                      </motion.div>

                      {/* Background Video (Stage 2) */}
                      <motion.div
                        style={{
                          opacity: videoOpacity,
                          scale: videoScale,
                          y: videoY
                        }}
                        className="w-full flex justify-center absolute inset-x-0 top-0 pointer-events-none"
                      >
                        <div
                          className="w-[300px] h-[225px] sm:w-[340px] sm:h-[255px] bg-[#0a0a0a] border border-white/10 relative pointer-events-none"
                        >
                          <div className="absolute top-0 left-0 w-full h-4 border-b border-white/10 bg-black flex items-center justify-between px-2">
                            <span className="text-[6px] text-stone-500 font-mono uppercase tracking-widest">VIDEO FEED</span>
                            <span className="text-[6px] text-white font-mono uppercase tracking-widest">ACTIVO</span>
                          </div>
                          <video
                            ref={el => { videoRefs.current[idx] = el; }}
                            src={pet.video}
                            playsInline
                            muted
                            preload="auto"
                            className="w-full h-full object-contain pt-4"
                          />
                          {/* Recording status indicator */}
                          <div className="absolute top-5 left-2 bg-black/80 text-white font-mono text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-red-500/50 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
                            <span>REC</span>
                          </div>
                        </div>
                      </motion.div>

                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* --- SECTION 4: INTERACTIVE CAKE & GIFTS TERMINAL (Progress 0.75 to 1.0) --- */}
      <motion.section
        style={{
          opacity: celebrationOpacity,
          scale: celebrationScale,
          pointerEvents: celebrationPointerEvents,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
        className="fixed inset-0 w-full ios-viewport-fix flex flex-col items-center justify-start pt-20 pb-4 z-[30]"
      >
        <div className="w-full max-w-4xl px-4 space-y-3 sm:space-y-4 pointer-events-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,34px))] max-h-[80vh] sm:max-h-[85vh] overflow-y-auto pr-1 custom-scrollbar">

          <div className="border border-white/10 bg-black/75 backdrop-blur-md pt-4 px-4 pb-2 sm:pt-6 sm:px-6 sm:pb-4 relative text-center space-y-3 sm:space-y-4 max-w-xl mx-auto">
            <AnimatedBrutalistCorners key={`${candlesBlown}-${cakeState}-${micPermission}`} color="#ff4b89" size={14} thickness={1.5} />

            <div className="space-y-1">
              <h3 className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-[#a88a7e]">EL PASTEL DE CUMPLEAÑOS</h3>
              <h2 className="text-md font-mono font-black uppercase text-white">PIDE UN DESEO</h2>
              <p className="text-[10px] text-[#a88a7e] font-sans max-w-sm mx-auto leading-relaxed">
                Sopla fuerte frente a tu pantalla para apagar las velas y descubrir tus sorpresas, o apágalas con un toque.
              </p>
            </div>

            {/* Mic Activation User Gesture & Volume bridge */}
            {!candlesBlown && (
              <div className="flex flex-col items-center justify-center w-full">
                {cakeState === 'STATE_IDLE' ? (
                  <div className="py-2">
                    <button
                      onClick={startMicDetection}
                      className="z-30 px-6 py-3 font-mono text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-none shadow-[0_0_15px_rgba(236,72,153,0.4)] active:scale-95 transition-transform"
                    >
                      ✨ ¡Quiero pedir mi deseo! 🎂 ✨
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-1.5 font-mono">
                    {micPermission === 'granted' ? (
                      <div className="space-y-1.5 w-full max-w-xs">
                        <button
                          onClick={stopMicDetection}
                          className="!min-h-0 border border-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all px-3 py-1 text-[9px] uppercase tracking-wider font-bold flex items-center gap-1.5 mx-auto"
                        >
                          <MicOff size={10} />
                          <span>Apagar Micrófono</span>
                        </button>

                        {/* Visualizer volume meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[6.5px] text-[#a88a7e] uppercase">
                            <span>Fuerza del soplo: {Math.round(micVolume * 100)}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 relative p-[1px]">
                            <div
                              className="h-full bg-[#c3f400] transition-all duration-100"
                              style={{ width: `${Math.min(micVolume * 100, 100)}%` }}
                            />
                            <div className="absolute top-0 bottom-0 left-[65%] w-px bg-red-400 opacity-60" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#ff4b89] font-sans font-bold uppercase tracking-wider text-center max-w-xs leading-relaxed animate-pulse">
                        👉 Toca cada vela para apagarla y pedir tu deseo 👈
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* The Birthday Cake UI */}
            <motion.div
              animate={{
                scale: candlesBlown ? 0.75 : 1,
                opacity: candlesBlown ? 0.7 : 1,
                y: candlesBlown ? -10 : 0
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative py-2 sm:py-4 flex flex-col items-center justify-center"
            >

              {/* Confetti particles canvas */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>

              {/* Candles */}
              <div className="flex justify-center gap-5 sm:gap-7 mb-[-1px] relative z-10">
                {candles.map((lit, idx) => {
                  const isLit = cakeState === 'STATE_LIT' && lit;
                  return (
                    <div
                      key={idx}
                      onClick={() => isLit && handleCandleClick(idx)}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      {/* Flame */}
                      <div className="h-9 flex items-end justify-center overflow-visible w-6 relative">
                        <AnimatePresence>
                          {isLit ? (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{
                                scale: [1, 1.15, 0.92, 1],
                                y: [0, -3, 0],
                                rotate: [0, -4, 4, 0]
                              }}
                              exit={{ opacity: 0, scale: 0, y: -15 }}
                              transition={{
                                scale: { duration: 0.25 },
                                y: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
                                rotate: { repeat: Infinity, duration: 0.9, ease: "easeInOut" }
                              }}
                              viewBox="0 0 24 36"
                              className="w-5 h-8 overflow-visible"
                              style={{ transformOrigin: 'bottom center' }}
                            >
                              <defs>
                                <linearGradient id={`outerFlame-${idx}`} x1="0" y1="1" x2="0" y2="0">
                                  <stop offset="0%" stopColor="#ff003c" stopOpacity="0.9" />
                                  <stop offset="50%" stopColor="#ff7020" stopOpacity="0.95" />
                                  <stop offset="100%" stopColor="#ffc300" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id={`innerFlame-${idx}`} x1="0" y1="1" x2="0" y2="0">
                                  <stop offset="0%" stopColor="#ffb595" />
                                  <stop offset="70%" stopColor="#ffffbb" />
                                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              {/* Outer Glow & Flame */}
                              <motion.path
                                d="M12,4 C17,14 20,22 20,29 C20,34 16,36 12,36 C8,36 4,34 4,29 C4,22 7,14 12,4 Z"
                                fill={`url(#outerFlame-${idx})`}
                                animate={{
                                  d: [
                                    "M12,4 C17,14 20,22 20,29 C20,34 16,36 12,36 C8,36 4,34 4,29 C4,22 7,14 12,4 Z",
                                    "M12,2 C18,14 21,21 21,29 C21,34 17,36 12,36 C7,36 3,34 3,29 C3,21 6,14 12,2 Z",
                                    "M12,5 C16,14 19,22 19,29 C19,34 15,36 12,36 C9,36 5,34 5,29 C5,22 8,14 12,5 Z",
                                    "M12,4 C17,14 20,22 20,29 C20,34 16,36 12,36 C8,36 4,34 4,29 C4,22 7,14 12,4 Z"
                                  ]
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.8,
                                  ease: "linear"
                                }}
                                style={{ filter: 'drop-shadow(0 0 6px #ff7020)' }}
                              />
                              {/* Inner Flame Core */}
                              <motion.path
                                d="M12,12 C15,18 17,24 17,29 C17,32 15,34 12,34 C9,34 7,32 7,29 C7,24 9,18 12,12 Z"
                                fill={`url(#innerFlame-${idx})`}
                                animate={{
                                  d: [
                                    "M12,12 C15,18 17,24 17,29 C17,32 15,34 12,34 C9,34 7,32 7,29 C7,24 9,18 12,12 Z",
                                    "M12,10 C16,18 18,23 18,29 C18,32 15,34 12,34 C9,34 6,32 6,29 C6,23 8,18 12,10 Z",
                                    "M12,13 C14,18 16,24 16,29 C16,32 14,34 12,34 C10,34 8,32 8,29 C8,24 10,18 12,13 Z",
                                    "M12,12 C15,18 17,24 17,29 C17,32 15,34 12,34 C9,34 7,32 7,29 C7,24 9,18 12,12 Z"
                                  ]
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.6,
                                  ease: "linear",
                                  delay: 0.1
                                }}
                              />
                            </motion.svg>
                          ) : (
                            !lit && (
                              <motion.div
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.6 }}
                                className="text-[8px] font-mono text-stone-500 font-bold select-none pointer-events-none"
                              >
                                *puff*
                              </motion.div>
                            )
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Candle body */}
                      <div className="w-2.5 h-9 sm:h-11 bg-gradient-to-b from-zinc-700 to-zinc-900 border-x border-t border-white/20 relative flex items-center justify-center shadow-inner">
                        {/* Glow light line inside candle body */}
                        <div className="w-0.5 h-full bg-gradient-to-b from-[#ff4b89] via-[#c3f400] to-transparent opacity-75" />
                        <div className="absolute inset-x-0 top-2 h-0.5 bg-[#ff4b89]/80" />
                        <div className="absolute inset-x-0 bottom-2.5 h-0.5 bg-[#c3f400]/80" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Layered Birthday Cake */}
              <div className="flex flex-col items-center z-0 relative mt-[-1px]">
                {/* Cake Tier 2 (Top) */}
                <div className="w-36 sm:w-44 h-8 sm:h-10 bg-zinc-900 border border-white/10 relative flex flex-col justify-center p-1 shadow-md">
                  {/* Frosting Top Line */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff4b89] via-[#a178ff] to-[#c3f400]" />
                  {/* Neon frosting sprinkles */}
                  <div className="flex justify-around px-2 opacity-60">
                    <span className="w-1.5 h-1 bg-[#ff4b89] rotate-45" />
                    <span className="w-1.5 h-1 bg-[#c3f400] -rotate-45" />
                    <span className="w-1.5 h-1 bg-cyan-400 rotate-12" />
                    <span className="w-1.5 h-1 bg-[#a178ff] -rotate-12" />
                  </div>
                </div>

                {/* Cake Tier 1 (Bottom) */}
                <div className="w-48 sm:w-60 h-10 sm:h-12 bg-zinc-900 border-x border-b border-white/10 relative flex flex-col justify-end p-2 -mt-[1px] shadow-lg">
                  {/* Frosting Middle Line */}
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#c3f400] via-[#ff4b89] to-[#a178ff]" />

                  {/* Message */}
                  <div className="text-[8px] font-mono tracking-[0.25em] font-black text-center text-[#fbdae0]/40 uppercase mb-0.5">
                    Con mucho amor
                  </div>

                  {/* Sprinkles on bottom tier */}
                  <div className="absolute inset-x-0 bottom-2 flex justify-between px-4 opacity-40">
                    <span className="w-1 h-1 bg-[#c3f400]" />
                    <span className="w-1.5 h-0.5 bg-[#ff4b89]" />
                    <span className="w-1 h-1 bg-cyan-400" />
                    <span className="w-1.5 h-0.5 bg-[#a178ff]" />
                  </div>
                </div>

                {/* Cake Plate/Stand */}
                <div className="w-56 sm:w-68 h-3 bg-zinc-800 border-x border-b border-white/20 relative shadow-2xl flex items-center justify-between px-4">
                  {/* High-tech server details */}
                  <div className="w-1.5 h-1.5 bg-[#c3f400] rounded-none opacity-60 animate-pulse" />
                  <div className="h-0.5 bg-white/10 flex-grow mx-3" />
                  <div className="w-1.5 h-1.5 bg-[#ff4b89] rounded-none opacity-60 animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* Unlock Status Alert */}
            <AnimatePresence>
              {candlesBlown && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 border border-[#c3f400] bg-[#c3f400]/10 text-center font-mono text-[9px] text-white uppercase tracking-widest relative z-30"
                >
                  🎉 ¡Felicidades, Mile! Abre tus regalos aquí abajo: 🎉
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clickable Gifts Grid */}
          {candlesBlown && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-sm mx-auto px-4 mt-6 max-h-[60dvh] overflow-y-auto custom-scrollbar pb-8 relative z-20"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="grid grid-cols-2 gap-4 w-full">
                {GIFTS_DATA.map((gift) => {
                  const isOpened = !!openedGifts[gift.id];
                  const isSvgIcon = gift.icon.endsWith('.svg');
                  return (
                    <motion.div
                      key={gift.id}
                      layoutId={`container-${gift.id}`}
                      onClick={() => handleOpenGift(gift)}
                      className={`relative cursor-pointer rounded-none p-4 bg-gradient-to-br ${gift.color} flex flex-col items-center justify-center text-center shadow-xl active:scale-95 transition-all duration-300 border border-white/10 h-36`}
                      whileHover={{ scale: 1.02 }}
                    >
                      {isSvgIcon ? (
                        <img src={gift.icon} alt="" className="w-20 h-20 mb-1.5 object-contain" />
                      ) : (
                        <span className="text-4xl mb-1.5">{gift.icon}</span>
                      )}
                      <h3 className="font-bold text-white text-sm tracking-wide">{gift.title}</h3>
                      <p className="text-[10px] text-white/80 mt-1 font-mono uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded-none">
                        {isOpened ? 'EXPUESTO' : 'REVELAR'}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>
      </motion.section>

      {/* --- GIFT DETAILS OVERLAYS DRAWER MODALS --- */}
      <AnimatePresence>
        {selectedGift && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden touch-none"
            onClick={() => setSelectedGift(null)}
          >
            <motion.div
              layoutId={`container-${selectedGift.id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 rounded-none p-6 border border-white/10 shadow-2xl overflow-hidden relative flex flex-col"
              style={{ maxHeight: '80dvh' }}
            >
              {/* Box Lid Pop Animation */}
              <motion.div
                initial={{ rotate: 0, y: 0, opacity: 1 }}
                animate={{ rotate: -45, y: -120, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute top-4 left-1/2 -translate-x-1/2 w-44 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-none shadow-lg pointer-events-none z-50 flex items-center justify-center"
                style={{ transformOrigin: 'left bottom' }}
              >
                <div className="absolute -top-3 w-8 h-8 rounded-none border-2 border-amber-300 bg-amber-400 flex items-center justify-center text-xs shadow-md">✨</div>
              </motion.div>

              {/* Close Button with touch optimization for iOS */}
              <button
                onClick={() => setSelectedGift(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 active:bg-white/20 rounded-none text-white text-sm font-bold z-50 hover:bg-white/15 transition-all"
              >
                ✕
              </button>

              {/* Dynamic Content Container (Staggered emerging animation) */}
              <motion.div
                initial={{ y: 150, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 }}
                className="mt-6 flex flex-col flex-grow overflow-y-auto pr-1"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="text-center mb-4 shrink-0">
                  {selectedGift.icon.endsWith('.svg') ? (
                    <img src={selectedGift.icon} alt="" className="w-28 h-28 mx-auto block mb-2 object-contain" />
                  ) : (
                    <span className="text-5xl mx-auto block mb-2">{selectedGift.icon}</span>
                  )}
                  <h2 className="text-xl font-black text-white tracking-tight">{selectedGift.title}</h2>
                  <p className="text-xs text-purple-300/70 mt-1">{selectedGift.subtitle}</p>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 pb-4">
                  {/* Case 1: Dinner Boarding Pass */}
                  {selectedGift.type === 'invitation' && (
                    <div className="w-full border border-amber-400/40 bg-black p-1 relative rounded-xl shadow-lg">
                      <div className="border border-amber-400/20 p-4 space-y-4 rounded-none">
                        <div className="flex justify-between items-baseline font-mono text-[9px] uppercase tracking-wider text-amber-400">
                          <span>Invitación Especial</span>
                          <span className="animate-pulse">● CENA SORPRESA CONFIRMADA</span>
                        </div>
                        <div className="border-t border-dashed border-amber-400/20 pt-3 grid grid-cols-2 gap-3 text-left">
                          <div>
                            <span className="text-[7.5px] text-stone-500 uppercase tracking-wider block font-semibold">Invitada</span>
                            <span className="text-xs font-black text-white uppercase">Milena (Mile)</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-stone-500 uppercase tracking-wider block font-semibold">Con Amor</span>
                            <span className="text-xs font-black text-white uppercase">Santiago (Santi)</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-stone-500 uppercase tracking-wider block font-semibold">Fecha y Hora</span>
                            <span className="text-xs font-black text-white uppercase">21 JUN - 18:00</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-stone-500 uppercase tracking-wider block font-semibold">Destino</span>
                            <span className="text-xs font-black text-amber-400 uppercase">Cena Secreta 🥂</span>
                          </div>
                        </div>
                        <div className="border-t border-amber-400/20 pt-3 text-center space-y-1">
                          <span className="text-[8px] text-stone-500 uppercase tracking-widest block font-semibold">Código Único</span>
                          <span className="text-lg font-black text-white tracking-widest font-mono">MILE-CENA-2026</span>
                          <p className="text-[10.5px] text-[#e1bfb2] leading-relaxed pt-2">
                            {selectedGift.details?.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case 2: Polaroid Stack */}
                  {selectedGift.type === 'timeline' && (
                    <div className="h-full flex flex-col items-center justify-start space-y-4">
                      <p className="text-[10px] text-[#a88a7e] text-center leading-relaxed mb-2">
                        DESLIZA Y MUEVE LAS FOTOS PARA VISUALIZAR LOS REGISTROS HISTORICOS COMPARTIDOS.
                      </p>

                      <div
                        ref={constraintsRef}
                        className="w-full h-80 border border-dashed border-white/10 bg-black/40 relative flex items-center justify-center overflow-hidden rounded-none p-4 shadow-inner"
                      >
                        {polaroidEvents.length === 0 ? (
                          <div className="text-center font-mono text-[#594137] text-[10px] uppercase">
                            Cargando nuestros momentos favoritos...
                          </div>
                        ) : (
                          polaroidEvents.map((ev, idx) => {
                            const rot = (idx % 3 === 0 ? 4 : idx % 2 === 0 ? -4 : 2) * (idx + 1) * 0.45;
                            return (
                              <motion.div
                                key={ev.id}
                                drag
                                dragConstraints={constraintsRef}
                                style={{ rotate: rot }}
                                className="absolute w-48 bg-white p-2.5 pb-6 text-black shadow-2xl rounded-sm cursor-grab active:cursor-grabbing border border-black/10 select-none flex flex-col gap-2 hover:scale-[1.02] transition-transform"
                              >
                                <div className="w-full h-36 bg-zinc-100 overflow-hidden border border-black/5 rounded-none relative">
                                  <img
                                    src={ev.imageUrl}
                                    alt={ev.title}
                                    className="w-full h-full object-cover pointer-events-none select-none"
                                  />
                                </div>
                                <div className="space-y-0.5 text-center font-sans px-1">
                                  <span className="text-[7.5px] font-mono uppercase font-bold text-neutral-400 tracking-wider block">
                                    {ev.date}
                                  </span>
                                  <h4 className="text-[10.5px] font-bold text-neutral-800 uppercase tracking-tight line-clamp-1">
                                    {ev.title}
                                  </h4>
                                  <p className="text-[8.5px] leading-snug text-neutral-500 line-clamp-2">
                                    {ev.description}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Case 3: Mystery Package */}
                  {selectedGift.type === 'mystery' && (
                    <div className="flex flex-col space-y-5">
                      {/* Physical gift hint */}
                      <div className="p-6 bg-cyan-950/40 border border-cyan-500/20 rounded-none text-center shadow-lg space-y-3 flex flex-col items-center">
                        <img 
                          src="/cumple/Stitch.svg" 
                          alt="Stitch" 
                          className="w-28 h-28 object-contain mb-2"
                          style={{ animation: 'holo-float 3s ease-in-out infinite' }}
                        />
                        <p className="text-[#00dbe9] font-mono text-[10px] font-black uppercase tracking-[0.2em]">PAQUETE FÍSICO MISTERIOSO</p>
                        <p className="text-white text-xs italic font-medium leading-relaxed max-w-xs">
                          &quot;{selectedGift.details?.hint}&quot;
                        </p>
                        <div className="h-px bg-cyan-500/20 w-12 mx-auto my-2" />
                        <p className="text-[10px] text-yellow-400 font-black uppercase font-mono tracking-widest leading-normal max-w-xs animate-pulse">
                          ⚠️ ¡NI YO SÉ DÓNDE O CÓMO VA A APARECER!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Case 4: Video de Todos */}
                  {selectedGift.type === 'video-all' && (
                    <div className="w-full flex flex-col items-center justify-center space-y-4">
                      <p className="text-[10px] text-[#a88a7e] text-center leading-relaxed mb-2 uppercase tracking-wider font-mono">
                        Mira el mensaje que tus personas favoritas prepararon para ti.
                      </p>
                      <div className="w-full bg-black border border-white/10 relative shadow-2xl p-1">
                        <video
                          src="/cumple/todos.mp4"
                          controls
                          playsInline
                          className="w-full h-auto max-h-[45dvh] object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
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
          <div className="w-full max-w-xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-10 relative">
            <AnimatedBrutalistCorners color="#ff4b89" size={16} thickness={1.5} />
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
          </div>
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
          <div className="w-full max-w-md border border-white/10 bg-[#0a0a0a] p-8 sm:p-10 relative text-center flex flex-col items-center justify-center space-y-6">
            <AnimatedBrutalistCorners color="#ff4b89" size={16} thickness={1.5} />
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
          </div>
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
          <div className="w-full max-w-md border border-white/10 bg-[#0a0a0a] p-8 sm:p-10 relative text-center flex flex-col items-center justify-center space-y-6">
            <AnimatedBrutalistCorners color="#ff4b89" size={16} thickness={1.5} />
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
          </div>
        </main>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <BirthdayScrollContainer
        bgmActive={bgmActive}
        toggleBgm={toggleBgm}
        setBgmTempMute={(muted) => synthRef.current?.setTempMute(muted)}
      />
    </PrivateRoute>
  );
}
