'use client';

import { useState, useEffect } from 'react';
import { NotificationActionBar } from './NotificationsFeed/NotificationActionBar';
import { NotificationItem } from './NotificationsFeed/NotificationItem';
import { NotificationEmptyState } from './NotificationsFeed/NotificationEmptyState';
import { NotificationService } from '@/services/notificationService';
import { useProfile } from '@/context/ProfileContext';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

export function NotificationsFeed() {
    const { profile } = useProfile();
    const { confirm, success, error: notifyError } = useToast();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            .channel(`feed-realtime-notifications-${profile}-${crypto.randomUUID()}`)
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

        // Borra la bitácora entera de un toque: sin confirmación era la acción
        // más destructiva de la app.
        const ok = await confirm({
            title: 'Vaciar bitácora',
            message: `Se eliminarán ${notifications.length} avisos. No se pueden recuperar.`,
            confirmLabel: 'Vaciar',
            tone: 'danger',
        });
        if (!ok) return;

        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('target_profile', profile);
            setNotifications([]);
            success('Bitácora vaciada.');
        } catch (err) {
            console.error('Failed to clear notifications:', err);
            notifyError('No se pudo vaciar la bitácora. Inténtalo de nuevo.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-36 w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-[#a88a7e]">
                <span>Cargando bitácora de actividad...</span>
            </div>
        );
    }
    return (
        <div className="space-y-6 font-mono relative z-10">
            {notifications.length > 0 && (
                <NotificationActionBar onMarkAllRead={handleMarkAllRead} onClearAll={handleClearAll} />
            )}

            <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                <AnimatePresence initial={false}>
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <NotificationItem key={n.id} notification={n} onRead={handleRead} />
                        ))
                    ) : (
                        <NotificationEmptyState />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
