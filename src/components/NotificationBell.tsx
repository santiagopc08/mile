'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckSquare, Trash2, ShieldAlert } from 'lucide-react';
import { StoreService } from '@/services/storeService';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
    const { profile } = useProfile();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    
    const isInitialLoadRef = useRef(true);
    const notifiedIdsRef = useRef<Set<string>>(new Set());

    const unreadCount = notifications.filter(n => !n.read).length;
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const profileLabel = profile === 'ella' ? 'Milena' : 'Santiago';

    // Request permissions for desktop notifications
    const requestPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                try {
                    await Notification.requestPermission();
                } catch (err) {
                    console.warn('Failed to request notification permission:', err);
                }
            }
        }
    };

    const fetchNotifications = async () => {
        if (!profile) return;
        try {
            const data = await StoreService.getNotifications(profile);
            setNotifications(data);

            // Populate notified IDs list initially to avoid spamming historical push notifications
            if (data && data.length > 0 && isInitialLoadRef.current) {
                data.forEach((n: any) => notifiedIdsRef.current.add(n.id));
                isInitialLoadRef.current = false;
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    // Trigger local push notification on browser
    const triggerDesktopNotification = (n: any) => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification('Nuestro Espacio', {
                    body: n.message,
                    icon: '/icon-192.png',
                    tag: n.id // Prevent duplicates
                });
            } catch (e) {
                console.error('Failed to trigger native desktop notification:', e);
            }
        }
    };

    useEffect(() => {
        if (!profile) return;
        
        requestPermission();
        fetchNotifications();
        
        // --- SUPABASE REAL-TIME SUBSCRIPTION ---
        // Instantly catches all new notification records matching this user's profile
        const channel = supabase
            .channel(`realtime-notifications-${profile}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERTs, UPDATEs and DELETEs
                    schema: 'public',
                    table: 'notifications',
                    filter: `target_profile=eq.${profile}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new;
                        setNotifications((prev) => [newNotif, ...prev]);
                        
                        // Fire desktop push notifications instantly
                        if (!notifiedIdsRef.current.has(newNotif.id)) {
                            notifiedIdsRef.current.add(newNotif.id);
                            triggerDesktopNotification(newNotif);
                        }
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

        // Fallback polling at a highly energy-efficient 90-second interval to protect mobile batteries
        const fallbackInterval = setInterval(fetchNotifications, 90000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(fallbackInterval);
        };
    }, [profile]);

    const handleRead = async (id: string) => {
        try {
            await StoreService.markNotificationRead(id);
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

    if (!profile) return null;

    return (
        <div className="relative">
            {/* Bell Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex h-9 w-9 items-center justify-center border border-white/10 bg-[#0a0a0a]/90 text-[#a88a7e] transition-all hover:border-white/20 hover:text-white"
                style={{
                    borderColor: unreadCount > 0 ? `${accentColor}50` : undefined,
                    boxShadow: unreadCount > 0 ? `0 0 10px ${accentColor}15` : undefined
                }}
                title="Bandeja de alertas"
            >
                <Bell 
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12"
                    style={{ color: unreadCount > 0 ? accentColor : undefined }} 
                />
                
                {/* Glowing notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                    <span 
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span 
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ 
                        backgroundColor: accentColor,
                        boxShadow: `0 0 6px ${accentColor}` 
                      }}
                    />
                  </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay backdrop to close */}
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsOpen(false)} 
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className={`absolute mt-3 w-80 border border-white/10 bg-[#0a0a0a]/98 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden font-mono ${
                                align === 'left' ? 'left-0 lg:left-full lg:top-0 lg:mt-0 lg:ml-4' : 'right-0'
                            }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Alertas</span>
                                {unreadCount > 0 && (
                                    <span 
                                        className="text-[8px] font-black uppercase px-2 py-0.5 border select-none"
                                        style={{ borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}11` }}
                                    >
                                        {unreadCount} nuevas
                                    </span>
                                )}
                            </div>

                            {/* Alert Items List */}
                            <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleRead(n.id)}
                                            className={`p-4 cursor-pointer transition-colors relative group ${
                                                !n.read 
                                                    ? 'bg-white/[0.03] hover:bg-white/[0.06]' 
                                                    : 'bg-transparent hover:bg-white/[0.01]'
                                            }`}
                                        >
                                            {/* Unread indicator left bar */}
                                            {!n.read && (
                                                <div 
                                                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                                                    style={{ backgroundColor: accentColor }}
                                                />
                                            )}
                                            
                                            <p className={`text-[11px] leading-relaxed tracking-normal ${!n.read ? 'text-white font-bold' : 'text-white/40 font-light'}`}>
                                                {n.message}
                                            </p>
                                            
                                            <div className="mt-2 flex items-center justify-between text-[8px] font-bold tracking-widest text-[#a88a7e] opacity-40 group-hover:opacity-80 transition-opacity uppercase">
                                                <span>{n.type || 'Sincronía'}</span>
                                                <span>
                                                    {new Date(n.created_at).toLocaleString('es-CO', { 
                                                        hour: 'numeric', 
                                                        minute: 'numeric',
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-[#a88a7e] opacity-45">
                                        <ShieldAlert className="w-8 h-8 mb-2 stroke-[1.2]" />
                                        <p className="text-[9px] uppercase tracking-widest">Sin alertas nuevas</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            {notifications.length > 0 && (
                                <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 bg-black/60 text-center">
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="flex items-center justify-center gap-1.5 py-3 text-[9px] font-bold uppercase tracking-widest text-[#a88a7e] hover:text-white transition-colors"
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        Leído
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="flex items-center justify-center gap-1.5 py-3 text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Vaciar
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
