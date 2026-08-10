import { Activity } from 'lucide-react';

export function NotificationEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-[#a88a7e] opacity-40 border border-dashed border-white/10 bg-black/10">
            <Activity className="w-10 h-10 mb-2 stroke-[1.2] animate-pulse" />
            <p className="text-[10px] uppercase tracking-widest text-center px-4">Ningún evento registrado en la bitácora aún</p>
        </div>
    );
}
