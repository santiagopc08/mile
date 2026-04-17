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
        <img src={tile.content.value} alt="Memory" className="w-full h-full object-cover p-0.5 rounded-md select-none pointer-events-none" />
    ) : (
        <div className={`w-full h-full flex items-center justify-center text-[2rem] md:text-[2.2rem] leading-none select-none pointer-events-none ${tile.content.value === '🀄' || tile.content.value === '🀆' ? 'text-red-500' : 'text-stone-800 dark:text-stone-300'}`}>
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
                tile-item rounded-lg flex items-center justify-center overflow-hidden
                transition-all duration-300 shadow-md relative
                ${isFree
                    ? 'cursor-pointer hover:brightness-110 active:scale-95 dark:border-stone-600'
                    : 'brightness-50 dark:brightness-[0.35] grayscale-[0.8] cursor-not-allowed opacity-60 dark:opacity-40'}
                ${tile.isHinted
                    ? 'bg-amber-50 dark:bg-amber-900/60 ring-[5px] ring-amber-400 dark:ring-amber-500 shadow-amber-400/50 shadow-2xl z-50 animate-pulse'
                    : tile.isSelected
                        ? 'bg-amber-100 dark:bg-amber-900/80 ring-2 ring-earth-base shadow-xl shadow-earth-base/20'
                        : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 border-r-[3px] border-b-[4px]'}
            `}
        >
            {tile.isSelected && (
                <div className="absolute inset-0 ring-3 ring-earth-base/40 rounded-lg animate-pulse pointer-events-none" />
            )}

            <TileVisual tile={tile} />
        </motion.div>
    );
});

MahjongTile.displayName = 'MahjongTile';

export default MahjongTile;
