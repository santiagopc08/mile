import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface NotificationItemProps {
    notification: any;
    onRead: (id: string) => void;
}

// ⚡ Bolt Optimization: Wrap with React.memo to prevent unnecessary re-renders of the entire list when parent state changes.
export const NotificationItem = memo(function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
    const notifColor = getNotificationColor(n.message);

    return (
        <motion.div
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
                    onClick={() => onRead(n.id)}
                    className="group flex h-7 w-7 items-center justify-center border border-white/10 bg-black text-[#a88a7e] transition-colors hover:border-white/40 hover:text-white"
                    title="Marcar como leído"
                >
                    <Check className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                </button>
            )}
        </motion.div>
    );
});
