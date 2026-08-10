import { CheckSquare, Trash2 } from 'lucide-react';

interface NotificationActionBarProps {
    onMarkAllRead: () => void;
    onClearAll: () => void;
}

export function NotificationActionBar({ onMarkAllRead, onClearAll }: NotificationActionBarProps) {
    return (
        <div className="flex justify-end gap-4 border-b border-white/5 pb-4">
            <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#a88a7e] hover:text-white transition-colors border border-white/10 px-3 py-1.5 bg-black/40 hover:bg-black/80"
            >
                <CheckSquare className="w-3 h-3" />
                Marcar Leídos
            </button>
            <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors border border-red-500/10 px-3 py-1.5 bg-red-950/10 hover:bg-red-950/30"
            >
                <Trash2 className="w-3 h-3" />
                Vaciar Bitácora
            </button>
        </div>
    );
}
