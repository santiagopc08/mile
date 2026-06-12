'use client';

import { useState, useEffect } from 'react';
import { Activity, Check, CheckSquare, Trash2 } from 'lucide-react';
import { StoreService } from '@/services/storeService';
import { NotificationService } from '@/services/notificationService';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export function NotificationsFeed() {
    const { profile } = useProfile();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

    const fetchNotifications = async () => {
        if (!profile) return;
        try {
            const data = await NotificationService.getNotifications(profile);
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications in feed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!profile) return;

        fetchNotifications();

        // Subscribe to real-time events to push alerts instantly into the feed log
        const channel = supabase
            .channel(`feed-realtime-notifications-${profile}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `target_profile=eq.${profile}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications((prev) => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications((prev) =>
                            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        // Standard 90-second fallback polling
        const polling = setInterval(fetchNotifications, 90000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(polling);
        };
    }, [profile]);

    const handleRead = async (id: string) => {
        try {
            await NotificationService.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        if (!profile) return;
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('target_profile', profile)
                .eq('read', false);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const handleClearAll = async () => {
        if (!profile) return;
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('target_profile', profile);
            setNotifications([]);
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-36 w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-[#a88a7e]">
                <span>Cargando bitácora de actividad...</span>
            </div>
        );
    }

    // Classify notification accents based on content
    const getNotificationColor = (message: string) => {
        const lower = message.toLowerCase();
        if (lower.includes('santiago') || lower.includes('él')) {
            return 'var(--color-user-b)'; // Lime
        }
        if (lower.includes('milena') || lower.includes('ella')) {
            return 'var(--color-user-a)'; // Pink
        }
        return '#00dbe9'; // Shared / default Cyan
    };

    return (
        <div className="space-y-6 font-mono relative z-10">
            {/* Action Bar */}
            {notifications.length > 0 && (
                <div className="flex justify-end gap-4 border-b border-white/5 pb-4">
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#a88a7e] hover:text-white transition-colors border border-white/10 px-3 py-1.5 bg-black/40 hover:bg-black/80"
                    >
                        <CheckSquare className="w-3 h-3" />
                        Marcar Leídos
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors border border-red-500/10 px-3 py-1.5 bg-red-950/10 hover:bg-red-950/30"
                    >
                        <Trash2 className="w-3 h-3" />
                        Vaciar Bitácora
                    </button>
                </div>
            )}

            {/* List Feed */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                <AnimatePresence initial={false}>
                    {notifications.length > 0 ? (
                        notifications.map((n) => {
                            const notifColor = getNotificationColor(n.message);
                            return (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className={`relative flex items-center justify-between border border-white/5 bg-black/40 p-4 transition-all hover:bg-black/60 ${
                                        !n.read ? 'border-l-2' : ''
                                    }`}
                                    style={{ borderLeftColor: !n.read ? notifColor : undefined }}
                                >
                                    <div className="flex items-start gap-4 pr-4">
                                        {/* Status Dot */}
                                        <div className="mt-1 flex h-2 w-2 items-center justify-center">
                                            <span 
                                                className={`h-2 w-2 rounded-full ${!n.read ? 'animate-pulse' : 'opacity-25'}`}
                                                style={{ 
                                                    backgroundColor: notifColor,
                                                    boxShadow: !n.read ? `0 0 6px ${notifColor}` : undefined 
                                                }}
                                            />
                                        </div>

                                        {/* Message Body */}
                                        <div>
                                            <p className={`text-xs leading-relaxed ${!n.read ? 'text-white font-bold' : 'text-white/40 font-light'}`}>
                                                {n.message}
                                            </p>
                                            <div className="mt-2 flex items-center gap-4 text-[8px] font-bold tracking-widest text-[#a88a7e] opacity-50">
                                                <span 
                                                    className="border border-white/10 px-1 py-0.5"
                                                    style={{ color: notifColor, borderColor: `${notifColor}33` }}
                                                >
                                                    {n.type || 'Sincronía'}
                                                </span>
                                                <span>
                                                    {new Date(n.created_at).toLocaleString('es-CO', {
                                                        hour: 'numeric',
                                                        minute: 'numeric',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button to mark single as read */}
                                    {!n.read && (
                                        <button
                                            onClick={() => handleRead(n.id)}
                                            className="group flex h-7 w-7 items-center justify-center border border-white/10 bg-black text-[#a88a7e] transition-colors hover:border-white/40 hover:text-white"
                                            title="Marcar como leído"
                                        >
                                            <Check className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#a88a7e] opacity-40 border border-dashed border-white/10 bg-black/10">
                            <Activity className="w-10 h-10 mb-2 stroke-[1.2] animate-pulse" />
                            <p className="text-[10px] uppercase tracking-widest text-center px-4">Ningún evento registrado en la bitácora aún</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
