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
        <img src={tile.content.value} alt="Memory" className="w-full h-full object-cover p-0.5 rounded-none select-none pointer-events-none" />
    ) : (
        <div className={`w-full h-full flex items-center justify-center text-[2rem] md:text-[2.2rem] leading-none select-none pointer-events-none ${tile.content.value === '🀄' || tile.content.value === '🀆' ? 'text-rose-500' : 'text-stone-800 dark:text-stone-300'}`}>
            {tile.content.value}
        </div>
    )
));

TileVisual.displayName = 'TileVisual';

interface MahjongTileProps {
    tile: TileState;
    isFree: boolean;
    onClick: (id: string) => void;
    getTilePosition: (tile: TileState) => { left: string; top: string; zIndex: number };
}

const MahjongTile = memo(({ tile, isFree, onClick, getTilePosition }: MahjongTileProps) => {
    const pos = getTilePosition(tile);
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
            onClick={() => onClick(tile.id)}
            style={{
                position: 'absolute',
                left: pos.left,
                top: `calc(${pos.top} + ${vOffset}px)`,
                zIndex: pos.zIndex,
            }}
            className={`
                tile-item rounded-none flex items-center justify-center overflow-hidden
                transition-all duration-300 shadow-none relative
                ${isFree
                    ? 'cursor-pointer hover:brightness-110 active:scale-95 border-geometric-border dark:border-stone-600'
                    : 'brightness-50 dark:brightness-[0.35] grayscale-[0.8] cursor-not-allowed opacity-60 dark:opacity-40 border-stone-300 dark:border-stone-800'}
                ${tile.isHinted
                    ? 'bg-white dark:bg-stone-900 ring-4 ring-geometric-accent shadow-2xl z-50 animate-pulse'
                    : tile.isSelected
                        ? 'bg-white dark:bg-stone-900 border-2 border-geometric-accent shadow-xl'
                        : 'bg-white dark:bg-stone-800 border border-geometric-border border-r-[3px] border-b-[4px]'}
            `}
        >
            {tile.isSelected && (
                <div className="absolute inset-0 ring-1 ring-geometric-accent/40 rounded-none pointer-events-none" />
            )}

            <TileVisual tile={tile} />

            {/* Geometric corner mark */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-geometric-accent/30 pointer-events-none" />
        </motion.div>
    );
});

MahjongTile.displayName = 'MahjongTile';

export default MahjongTile;
