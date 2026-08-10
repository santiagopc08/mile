'use client';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckSquare, Trash2, ShieldAlert } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
export function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
    const { profile } = useProfile();
    const [isOpen, setIsOpen] = useState(false);
    const {
        notificationsArray,
        unreadCount,
        handleRead,
        handleMarkAllRead,
        handleClearAll
    } = useNotifications(profile);
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    if (!profile) return null;
    return (
        <div className="relative">
            {/* Bell Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="touch-target group relative flex h-9 w-9 items-center justify-center border border-white/12 bg-white/[0.04] backdrop-blur-md text-[#a88a7e] transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                style={{
                    borderColor: unreadCount > 0 ? `${accentColor}60` : undefined,
                    boxShadow: unreadCount > 0 ? `0 0 14px ${accentColor}25` : undefined
                }}
                title="Bandeja de alertas"
                aria-label="Bandeja de alertas"
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
                            className={`absolute mt-3 w-80 border border-white/15 bg-[#120b15]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-50 overflow-hidden font-mono ${
                                align === 'left' ? 'left-0 lg:left-full lg:top-0 lg:mt-0 lg:ml-4' : 'right-0'
                            }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] p-4">
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
                                {notificationsArray.length > 0 ? (
                                    notificationsArray.map((n) => (
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
                            {notificationsArray.length > 0 && (
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
