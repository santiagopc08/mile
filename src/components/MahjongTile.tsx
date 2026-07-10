'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import Image from 'next/image';

export interface TileContent {
    type: 'custom' | 'local_image' | 'traditional' | 'bottle_message' | 'calendar_date' | 'clock_time' | 'drawing_tile';
    value: string;
}

export interface TileState {
    id: string;
    x: number;
    y: number;
    z: number;
    content: TileContent;
    isMatched: boolean;
    isSelected: boolean;
    isHinted?: boolean;
    isFlippedDown?: boolean;
    // Hardening mechanics
    isMirrored?: 'flipX' | 'flipY' | 'rot90' | 'rot270';
    isGhost?: boolean;
    lockId?: string;
    isLocked?: boolean;
    iceCounter?: number;
    isBomb?: boolean;
    bombTimer?: number;
    isSmoked?: boolean;
}

export const TileVisual = memo(({ tile }: { tile: TileState }) => {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

    if (tile.content.type === 'custom') {
        return (
            <div className="relative h-full w-full overflow-hidden p-[2px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#aa7c11] opacity-70"></div>
                {/* inner dark bezel */}
                <div className="absolute inset-[3px] bg-black z-0"></div>
                <div className="relative z-10 h-full w-full select-none rounded-none pointer-events-none">
                    <Image
                        src={tile.content.value}
                        alt="Memory"
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>
                {/* top glossy shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 z-20 pointer-events-none"></div>
            </div>
        );
    }

    if (tile.content.type === 'bottle_message') {
        return (
            <div className="relative h-full w-full overflow-hidden p-[2px] flex items-center justify-center bg-[#0a2323]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#008080] via-[#004d4d] to-[#001a1a] opacity-75"></div>
                {/* inner dark bezel */}
                <div className="absolute inset-[3px] bg-black z-0"></div>
                {/* Vintage Letter Scroll or Bottle emoji */}
                <div className="relative z-10 text-[2rem] select-none pointer-events-none animate-pulse">🍾</div>
                {/* top glossy shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-[#00ffcc]/20 z-20 pointer-events-none"></div>
            </div>
        );
    }

    if (tile.content.type === 'calendar_date') {
        const parts = tile.content.value.split(' ');
        const dayStr = parts[0] || '';
        const monthStr = parts[1] || '';
        return (
            <div className="relative h-full w-full overflow-hidden p-[2px] flex flex-col items-center justify-center bg-stone-900 border border-red-500/30">
                <div className="w-full bg-red-600 text-white text-[7px] font-black tracking-widest text-center py-[2px] uppercase select-none leading-none pointer-events-none">
                    CAL
                </div>
                <div className="w-full flex-1 bg-stone-950 flex flex-col items-center justify-center leading-none select-none pointer-events-none">
                    <span className="text-[12px] font-black text-white">{dayStr}</span>
                    <span className="text-[8px] font-bold text-red-400 mt-[2px] uppercase">{monthStr}</span>
                </div>
            </div>
        );
    }

    if (tile.content.type === 'clock_time') {
        return (
            <div className="relative h-full w-full overflow-hidden p-[2px] flex flex-col items-center justify-center bg-stone-950 border border-emerald-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-black to-emerald-950/40 opacity-70"></div>
                <div className="relative z-10 flex flex-col items-center justify-center leading-none select-none pointer-events-none">
                    <span className="text-[7px] font-bold text-emerald-500/40 tracking-wider mb-[2px] uppercase">HORA</span>
                    <span className="text-[10px] font-black text-emerald-400 font-mono tracking-tighter shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                        {tile.content.value}
                    </span>
                </div>
            </div>
        );
    }

    if (tile.content.type === 'local_image') {
        return (
            <div className="relative h-full w-full overflow-hidden p-[2px]">
                <div className="relative z-10 h-full w-full select-none rounded-none pointer-events-none">
                    <Image
                        src={tile.content.value}
                        alt="Tile"
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-full w-full select-none items-center justify-center text-[2rem] leading-none pointer-events-none md:text-[2.2rem] ${tile.content.value === '🀄' || tile.content.value === '🀆' ? '' : 'text-[#e5e2e1]'}`} style={tile.content.value === '🀄' || tile.content.value === '🀆' ? { color: accentColor } : {}}>
            {tile.content.value}
        </div>
    );
});

TileVisual.displayName = 'TileVisual';

interface MahjongTileProps {
    tile: TileState;
    isFree: boolean;
    onPointerDown: (id: string) => void;
    positionStyle: {
        left: string;
        top: string;
        zIndex: number;
        width: string;
        height: string;
    };
}

const MahjongTile = memo(({ tile, isFree, onPointerDown, positionStyle }: MahjongTileProps) => {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const vOffset = tile.isSelected ? -8 : 0;

    return (
        <motion.div
            layoutId={tile.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}

            onPointerDown={(e) => {
                if (isFree) onPointerDown(tile.id);
            }}
            style={{
                position: 'absolute',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                ...positionStyle,
                // Apply selection offset via transform to avoid layout recalculation
                transform: `translateY(${vOffset}px)`,
                ...(tile.isHinted ? { borderColor: accentColor, boxShadow: `0 0 15px ${accentColor}99` } : tile.isSelected ? { borderColor: accentColor, boxShadow: `0 0 22px ${accentColor}44` } : {})
            }}
            className={`
                tile-item flex items-center justify-center overflow-hidden rounded-none
                shadow-none
                ${isFree
                    ? `cursor-pointer border-[#4b403a] hover:border-${accentClass} hover:brightness-125 active:scale-95`
                    : 'cursor-not-allowed border-white/10 opacity-35 grayscale-[0.9] brightness-50'}
                ${tile.isHinted
                    ? `z-50 animate-pulse border-${accentClass} bg-[#0a0a0a]`
                    : tile.isSelected
                        ? `border-2 border-${accentClass} bg-[#0a0a0a]`
                        : 'border border-r-[3px] border-b-[4px] bg-[#111]'}
            `}
        >
            {tile.isSelected && (
                <div className="pointer-events-none absolute inset-0 rounded-none ring-1" style={{ ringColor: `${accentColor}80` } as any} />
            )}

            <TileVisual tile={tile} />

            {/* Geometric corner mark */}
            <div className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t" style={{ borderColor: `${accentColor}66` }} />
        </motion.div>
    );
});

MahjongTile.displayName = 'MahjongTile';

export default MahjongTile;
