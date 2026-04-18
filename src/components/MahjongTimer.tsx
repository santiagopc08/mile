'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { Clock } from 'lucide-react';

interface MahjongTimerProps {
    isActive: boolean;
    formatTime: (seconds: number) => string;
}

export interface MahjongTimerHandle {
    getTime: () => number;
    resetTime: () => void;
}

const MahjongTimer = memo(forwardRef<MahjongTimerHandle, MahjongTimerProps>(({ isActive, formatTime }, ref) => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    useImperativeHandle(ref, () => ({
        getTime: () => time,
        resetTime: () => setTime(0)
    }));

    return (
        <div className="flex flex-col items-center border border-geometric-border px-6 py-2 bg-white dark:bg-stone-900 relative overflow-hidden">
            {/* Geometric Accent Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-geometric-accent opacity-30" />

            <span className="text-[10px] text-stone-400 uppercase tracking-[0.2em] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-geometric-accent" />
                Tiempo
            </span>
            <span className="text-2xl font-mono text-stone-800 dark:text-stone-100 tabular-nums font-bold">
                {formatTime(time)}
            </span>

            {/* Decorative corner mark */}
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-geometric-accent/20" />
        </div>
    );
}));

MahjongTimer.displayName = 'MahjongTimer';

export default MahjongTimer;
