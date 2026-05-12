'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

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

export const TileVisual = memo(({ tile }: { tile: TileState }) => (
    tile.content.type === 'custom' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tile.content.value} alt="Memory" className="h-full w-full select-none rounded-none object-cover p-0.5 opacity-95 saturate-[0.9] pointer-events-none" />
    ) : (
        <div className={`flex h-full w-full select-none items-center justify-center text-[2rem] leading-none pointer-events-none md:text-[2.2rem] ${tile.content.value === '🀄' || tile.content.value === '🀆' ? 'text-[#ff7020]' : 'text-[#e5e2e1]'}`}>
            {tile.content.value}
        </div>
    )
));

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
    const vOffset = tile.isSelected ? -8 : 0;

    return (
        <motion.div
            layoutId={tile.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
                opacity: 0,
                scale: 1.3,
                transition: { duration: 0.3 }
            }}
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
            }}
            className={`
                tile-item flex items-center justify-center overflow-hidden rounded-none
                shadow-none transition-transform duration-300
                ${isFree
                    ? 'cursor-pointer border-[#4b403a] hover:border-[#00dbe9] hover:brightness-125 active:scale-95'
                    : 'cursor-not-allowed border-white/10 opacity-35 grayscale-[0.9] brightness-50'}
                ${tile.isHinted
                    ? 'z-50 animate-pulse border-[#00dbe9] bg-[#0a0a0a] ring-4 ring-[#00dbe9]/60'
                    : tile.isSelected
                        ? 'border-2 border-[#ff7020] bg-[#0a0a0a] shadow-[0_0_22px_rgba(255,112,32,0.28)]'
                        : 'border border-r-[3px] border-b-[4px] bg-[#111]'}
            `}
        >
            {tile.isSelected && (
                <div className="pointer-events-none absolute inset-0 rounded-none ring-1 ring-[#ff7020]/50" />
            )}

            <TileVisual tile={tile} />

            {/* Geometric corner mark */}
            <div className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-[#00dbe9]/40" />
        </motion.div>
    );
});

MahjongTile.displayName = 'MahjongTile';

export default MahjongTile;
