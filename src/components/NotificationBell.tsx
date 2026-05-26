'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { StoreService } from '@/services/storeService';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationBell() {
    const { profile } = useProfile();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    
    // Refs for push notifications tracking
    const isInitialLoadRef = useRef(true);
    const notifiedIdsRef = useRef<Set<string>>(new Set());

    const unreadCount = notifications.filter(n => !n.read).length;
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

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

            // Handle browser push notifications for newly fetched alerts
            if (data && data.length > 0) {
                if (isInitialLoadRef.current) {
                    // Populate initial list of IDs to avoid notifying historical alerts
                    data.forEach((n: any) => notifiedIdsRef.current.add(n.id));
                    isInitialLoadRef.current = false;
                } else {
                    // Detect and trigger notification for new unread alerts
                    data.forEach((n: any) => {
                        if (!n.read && !notifiedIdsRef.current.has(n.id)) {
                            notifiedIdsRef.current.add(n.id);
                            
                            // Trigger native HTML5 push notification
                            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                                try {
                                    new Notification('Symmetry Link', {
                                        body: n.message,
                                        icon: '/icon-192.png',
                                        tag: n.id // Prevent duplicate windows/alerts
                                    });
                                } catch (e) {
                                    console.error('Failed to trigger native desktop notification:', e);
                                }
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    useEffect(() => {
        if (!profile) return;
        
        requestPermission();
        fetchNotifications();
        
        // Poll every 30 seconds for new events (more responsive than 60s)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [profile]);

    const handleRead = async (id: string) => {
        await StoreService.markNotificationRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    if (!profile) return null; // Render for both el and ella!

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors relative"
            >
                <Bell 
                    className="w-5 h-5 transition-colors"
                    style={{ color: unreadCount > 0 ? accentColor : 'var(--color-[#a88a7e])' }} 
                />
                {unreadCount > 0 && (
                    <span 
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0c0c0c] border border-stone-200 dark:border-white/10 rounded-none shadow-xl z-50 overflow-hidden font-mono"
                    >
                        <div className="p-4 border-b border-stone-100 dark:border-white/10 flex justify-between items-center bg-black/40">
                            <h3 className="text-xs font-black uppercase tracking-wider text-white">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <span 
                                    className="text-[8px] font-black uppercase px-2 py-0.5 border"
                                    style={{ borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}11` }}
                                >
                                    {unreadCount} nuevas
                                </span>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleRead(n.id)}
                                        className={`p-4 border-b border-stone-100 dark:border-white/5 last:border-0 cursor-pointer transition-colors ${
                                            !n.read 
                                                ? 'bg-stone-50 dark:bg-white/[0.02] hover:bg-stone-100 dark:hover:bg-white/[0.04]' 
                                                : 'hover:bg-stone-50 dark:hover:bg-white/[0.01]'
                                        }`}
                                    >
                                        <p className={`text-xs leading-relaxed ${!n.read ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-500 dark:text-white/40'}`}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-2 text-[8px] font-bold text-stone-400 dark:text-white/20 uppercase tracking-tighter">
                                            <span>
                                                {new Date(n.created_at).toLocaleString('es-CO', { 
                                                    hour: 'numeric', 
                                                    minute: 'numeric', 
                                                    day: 'numeric', 
                                                    month: 'short' 
                                                })}
                                            </span>
                                            {!n.read && (
                                                <span className="text-[6px] tracking-widest" style={{ color: accentColor }}>[ MARCAR_LEÍDO ]</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                             ) : (
                                <div className="p-10 text-center">
                                    <p className="text-stone-400 dark:text-white/20 text-xs italic tracking-wide">No tienes notificaciones</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
