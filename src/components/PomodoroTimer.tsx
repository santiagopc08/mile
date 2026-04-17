'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Focus } from 'lucide-react';
import { motion } from 'framer-motion';

export function PomodoroTimer() {
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            if (mode === 'work') {
                new Audio('/sounds/bell.mp3').play().catch(() => {});
                setMode('break');
                setTimeLeft(5 * 60);
            } else {
                new Audio('/sounds/bell.mp3').play().catch(() => {});
                setMode('work');
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, mode]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleMode = (newMode: 'work' | 'break') => {
        setMode(newMode);
        setIsRunning(false);
        setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
    };

    return (
        <div className="w-full h-full flex flex-col justify-center relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-2">
                    <Focus className={`w-4 h-4 ${mode === 'work' ? 'text-geometric-accent' : 'text-stone-600'}`} />
                    <span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${mode === 'work' ? 'text-white' : 'text-stone-600'}`}>Ciclo Enfoque</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${mode === 'break' ? 'text-white' : 'text-stone-600'}`}>Pausa Técnica</span>
                    <Coffee className={`w-4 h-4 ${mode === 'break' ? 'text-geometric-accent' : 'text-stone-600'}`} />
                </div>
            </div>

            <div className="relative mb-10 flex flex-col items-center">
                <div className="text-7xl font-light tracking-tighter text-white tabular-nums">
                    {formatTime(timeLeft)}
                </div>
                
                {/* Technical Progress Bar */}
                <div className="w-full h-[1px] bg-stone-800 mt-6 relative">
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-geometric-accent"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(timeLeft / (mode === 'work' ? 25 * 60 : 5 * 60)) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="flex gap-1">
                    <button 
                        onClick={() => toggleMode('work')}
                        className={`w-8 h-8 flex items-center justify-center border transition-all ${
                            mode === 'work' ? 'border-geometric-accent bg-geometric-accent/10 text-white' : 'border-stone-800 text-stone-600 hover:border-stone-600'
                        }`}
                        title="Work Mode"
                    >
                        <Focus className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={() => toggleMode('break')}
                        className={`w-8 h-8 flex items-center justify-center border transition-all ${
                            mode === 'break' ? 'border-geometric-accent bg-geometric-accent/10 text-white' : 'border-stone-800 text-stone-600 hover:border-stone-600'
                        }`}
                        title="Break Mode"
                    >
                        <Coffee className="w-3 h-3" />
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => { setIsRunning(false); setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60); }}
                        className="text-stone-600 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setIsRunning(!isRunning)}
                        className={`px-6 py-2 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                            isRunning 
                                ? 'border-stone-700 text-stone-400 hover:text-white hover:border-white' 
                                : 'border-geometric-accent bg-geometric-accent text-white hover:bg-transparent hover:text-geometric-accent'
                        }`}
                    >
                        {isRunning ? 'Abortar' : 'Iniciar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
