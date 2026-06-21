'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';

export interface TileContent {
    type: 'custom' | 'traditional';
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
}

export const TileVisual = memo(({ tile }: { tile: TileState }) => {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    
    return tile.content.type === 'custom' ? (
        <div className="relative h-full w-full overflow-hidden p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#aa7c11] opacity-70"></div>
            {/* inner dark bezel */}
            <div className="absolute inset-[3px] bg-black z-0"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={tile.content.value}
                alt="Memory"
                className="relative z-10 h-full w-full select-none rounded-none object-cover saturate-[1.2] sepia-[0.3] contrast-[1.1] brightness-[1.1] pointer-events-none"
            />
            {/* top glossy shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 z-20 pointer-events-none"></div>
        </div>
    ) : (
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
                shadow-none transition-transform duration-300
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
