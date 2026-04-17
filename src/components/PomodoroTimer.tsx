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
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden h-full flex flex-col justify-center">
            {/* Glowing active state backdrop */}
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 ${
                isRunning && mode === 'work' ? 'from-brand-purple/20 to-brand-pink/20 opacity-100' :
                isRunning && mode === 'break' ? 'from-brand-blue/20 to-brand-cyan/20 opacity-100' : 'opacity-0'
            }`} />

            <div className="relative z-10 flex flex-col items-center">
                <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-sm rounded-full mb-8 border border-white/10">
                    <button 
                        onClick={() => toggleMode('work')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            mode === 'work' ? 'bg-white/20 text-white shadow-sm' : 'text-stone-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Focus className="w-4 h-4" /> Enfoque
                    </button>
                    <button 
                        onClick={() => toggleMode('break')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            mode === 'break' ? 'bg-white/20 text-white shadow-sm' : 'text-stone-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Coffee className="w-4 h-4" /> Descanso
                    </button>
                </div>

                <motion.div 
                    className="text-6xl md:text-7xl font-light tracking-tighter text-white mb-8 cursor-default"
                    animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    {formatTime(timeLeft)}
                </motion.div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsRunning(!isRunning)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg ${
                            isRunning ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-stone-900'
                        }`}
                    >
                        {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>
                    
                    <button 
                        onClick={() => { setIsRunning(false); setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60); }}
                        className="w-10 h-10 rounded-full bg-white/5 text-stone-400 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
                        title="Reiniciar"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
