import React from 'react';
import { HardeningMechanic } from '../hardeningEngine';

interface HardeningBadgesProps {
    activeMechanics: HardeningMechanic[];
    gameMode: string;
}

export function HardeningBadges({ activeMechanics, gameMode }: HardeningBadgesProps) {
    if (activeMechanics.length === 0 || gameMode !== 'solo') return null;

    return (
        <div className="flex flex-wrap gap-1.5 mt-1 justify-center">
            {activeMechanics.map(m => {
                const info: Record<string, { icon: string; label: string; color: string }> = {
                    mirror: { icon: '🪞', label: 'ESPEJO', color: '#c084fc' },
                    ghost: { icon: '👻', label: 'FANTASMA', color: '#22d3ee' },
                    padlock: { icon: '🔒', label: 'CANDADO', color: '#facc15' },
                    ice: { icon: '🧊', label: 'HIELO', color: '#87ceeb' },
                    bomb: { icon: '💣', label: 'BOMBA', color: '#ef4444' },
                    smoke: { icon: '💨', label: 'HUMO', color: '#9ca3af' },
                    gravity: { icon: '🏗️', label: 'GRAVEDAD', color: '#f97316' },
                };
                const { icon, label, color } = info[m] || { icon: '?', label: m, color: '#fff' };
                return (
                    <div
                        key={m}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 border font-mono text-[8px] font-black uppercase tracking-wider select-none"
                        style={{ borderColor: color + '66', color, backgroundColor: color + '15' }}
                    >
                        <span>{icon}</span>
                        <span>{label}</span>
                    </div>
                );
            })}
        </div>
    );
}
