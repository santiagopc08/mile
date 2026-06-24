'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { Clock } from 'lucide-react';

interface MahjongTimerProps {
    isActive: boolean;
    formatTime: (seconds: number) => string;
    accentColor: string;
}

export interface MahjongTimerHandle {
    getTime: () => number;
    resetTime: () => void;
}

const MahjongTimer = memo(forwardRef<MahjongTimerHandle, MahjongTimerProps>(({ isActive, formatTime, accentColor }, ref) => {
    const [time, setTime] = useState(0);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => {
                setTime(prev => {
                    setPulse(true);
                    setTimeout(() => setPulse(false), 200);
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    useImperativeHandle(ref, () => ({
        getTime: () => time,
        resetTime: () => setTime(0)
    }));

    return (
        <div className="relative group select-none">
            {/* 3D shadow layer */}
            <div 
                className="absolute inset-0 translate-x-[3px] translate-y-[3px] border-2 border-black transition-transform duration-200" 
                style={{ backgroundColor: accentColor }}
            />
            {/* Foreground container */}
            <div 
                className={`relative flex items-center gap-1.5 md:gap-2 border-2 border-white bg-[#0a0a0a] px-2 py-1 md:px-3.5 md:py-2 transition-all duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-active:translate-x-[2px] group-active:translate-y-[2px]`}
                style={{
                    boxShadow: isActive ? `0 0 12px ${accentColor}40` : 'none'
                }}
            >
                <Clock 
                    className={`h-3.5 w-3.5 md:h-4.5 md:w-4.5 transition-all duration-200 ${pulse ? 'scale-125 rotate-12' : 'scale-100 rotate-0'}`} 
                    style={{ color: accentColor }} 
                />
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mb-0.5">Tiempo</span>
                    <span className="font-mono text-xs md:text-sm font-black tabular-nums tracking-tight text-white">
                        {formatTime(time)}
                    </span>
                </div>
            </div>
        </div>
    );
}));

MahjongTimer.displayName = 'MahjongTimer';

export default MahjongTimer;
