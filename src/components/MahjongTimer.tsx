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
        <div className="flex flex-col items-center">
            <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">
                <Clock className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                Tiempo
            </span>
            <span className="text-xl font-mono text-earth-base tabular-nums">
                {formatTime(time)}
            </span>
        </div>
    );
}));

MahjongTimer.displayName = 'MahjongTimer';

export default MahjongTimer;
