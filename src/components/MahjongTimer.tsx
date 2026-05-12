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
        <div className="relative flex min-w-36 flex-col items-center overflow-hidden border border-white/10 bg-black/70 px-5 py-3">
            <div className="absolute left-0 top-0 h-[2px] w-full bg-[#00dbe9] opacity-70" />

            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
                <Clock className="h-3 w-3 text-[#00dbe9]" />
                Tiempo
            </span>
            <span className="font-mono text-2xl font-bold tabular-nums tracking-normal text-white">
                {formatTime(time)}
            </span>

            <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#ff7020]/50" />
        </div>
    );
}));

MahjongTimer.displayName = 'MahjongTimer';

export default MahjongTimer;
