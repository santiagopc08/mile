'use client';

import React from 'react';
import type { WishlistActivity } from '@/services/storeService';
import { timeAgo } from './constants';

const ACTION_ICONS: Record<string, string> = {
    added: '＋',
    contributed: '💰',
    reacted: '💫',
    state_changed: '→',
    completed: '✓',
};

export function ActivityFeed({ activity }: { activity: WishlistActivity[] }) {
    if (activity.length === 0) {
        return (
            <div className="border border-dashed border-white/10 p-6 text-center">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/25 italic">Sin actividad reciente</p>
            </div>
        );
    }

    return (
        <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {activity.slice(0, 20).map((evt, i) => (
                <div
                    key={evt.id}
                    className="activity-line flex items-start gap-3 border-b border-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                    style={{ animationDelay: `${i * 40}ms` }}
                >
                    <span className="mt-0.5 text-xs shrink-0">{ACTION_ICONS[evt.action] || '•'}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/70 truncate">
                            <span className={evt.actor === 'el' ? 'text-user-b' : 'text-user-a'}>
                                {evt.actor === 'el' ? 'Santiago' : 'Milena'}
                            </span>
                            <span className="text-white/30 mx-1.5">·</span>
                            <span className="text-white/40 normal-case tracking-normal">
                                {evt.action === 'contributed' && `contribuyó ${evt.detail}`}
                                {evt.action === 'added' && `agregó "${evt.detail}"`}
                                {evt.action === 'reacted' && `reaccionó ${evt.detail === 'LIKE' ? '❤️' : evt.detail === 'PRIORITY' ? '⚡' : '💫'}`}
                                {evt.action === 'state_changed' && `cambió estado: ${evt.detail}`}
                                {evt.action === 'completed' && `completó "${evt.detail}"`}
                            </span>
                        </p>
                    </div>
                    <span className="text-[8px] font-mono text-white/20 shrink-0 mt-0.5">{timeAgo(evt.createdAt)}</span>
                </div>
            ))}
        </div>
    );
}
