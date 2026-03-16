'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { StoreService } from '@/services/storeService';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationBell() {
    const { profile } = useProfile();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = async () => {
        if (!profile) return;
        const data = await StoreService.getNotifications(profile);
        setNotifications(data);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // 60s as requested
        return () => clearInterval(interval);
    }, [profile]);

    const handleRead = async (id: string) => {
        await StoreService.markNotificationRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    if (profile !== 'ella') return null; // Only for her in this phase

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors relative"
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-earth-base' : 'text-stone-500'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-stone-900 rounded-full" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-stone-50 dark:border-stone-800 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Notificaciones</h3>
                            {unreadCount > 0 && <span className="text-[10px] bg-earth-soft/20 text-earth-dark px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleRead(n.id)}
                                        className={`p-4 border-b border-stone-50 dark:border-stone-800 last:border-0 cursor-pointer transition-colors ${!n.read ? 'bg-earth-soft/5 dark:bg-earth-soft/5' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}`}
                                    >
                                        <p className={`text-sm ${!n.read ? 'text-stone-900 dark:text-white font-medium' : 'text-stone-500'}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-tighter">
                                            {new Date(n.created_at).toLocaleString('es-CO', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center">
                                    <p className="text-stone-400 text-sm font-light italic">No tienes notificaciones</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
