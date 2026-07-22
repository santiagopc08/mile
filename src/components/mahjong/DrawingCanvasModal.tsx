'use client';

import React, { useRef, useState, useEffect } from 'react';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';

interface DrawingCanvasModalProps {
    profile: 'el' | 'ella';
    accentColor: string;
    onClose: () => void;
    onSave: (dataUrl: string, caption: string) => Promise<void> | void;
}

export const DrawingCanvasModal: React.FC<DrawingCanvasModalProps> = ({ profile, accentColor, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#ffffff');
    const [thickness, setThickness] = useState(4);
    const [caption, setCaption] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        return { x, y };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            canvas.setPointerCapture(e.pointerId);
        } catch { }
        
        isDrawingRef.current = true;
        const pos = getCoordinates(e);
        lastPosRef.current = pos;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, thickness / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getCoordinates(e);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastPosRef.current = pos;
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (canvas) {
            try {
                if (canvas.hasPointerCapture(e.pointerId)) {
                    canvas.releasePointerCapture(e.pointerId);
                }
            } catch { }
        }
        isDrawingRef.current = false;
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setErrorMsg(null);
    };

    const handleSend = async () => {
        const canvas = canvasRef.current;
        if (!canvas || isSubmitting) return;
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const dataUrl = canvas.toDataURL('image/png');
            await onSave(dataUrl, caption);
        } catch (err) {
            console.error('Error sending drawing:', err);
            setErrorMsg('Error al enviar el dibujo. Por favor intenta de nuevo.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md font-mono">
            <BrutalistPanel
                accentColor="#c084fc"
                cornerSize={12}
                className="w-full max-w-lg !bg-[#0d0914] p-5 shadow-[0_0_40px_rgba(139,92,246,0.25)] flex flex-col"
            >

                <h3 className="mb-2 text-xl font-bold uppercase tracking-wider text-purple-400">
                    Lienzo de Amor 🎨
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-slate-400">
                    ¡Dibuja algo especial para tu pareja! Tu dibujo aparecerá en su tablero de juego hoy.
                </p>

                {errorMsg && (
                    <div className="mb-3 p-2 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono">
                        {errorMsg}
                    </div>
                )}

                <div className="relative w-full border border-purple-500/20 bg-black overflow-hidden flex justify-center items-center">
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={300}
                        className="touch-none cursor-crosshair max-w-full"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    />
                </div>

                <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        {['#ffffff', '#ef4444', '#3b82f6', '#eab308', '#22c55e', '#d946ef'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                disabled={isSubmitting}
                                className={`w-6 h-6 border transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white">
                        <span>Grosor:</span>
                        {[2, 4, 8, 14].map((t) => (
                            <button
                                key={t}
                                onClick={() => setThickness(t)}
                                disabled={isSubmitting}
                                className={`px-2 py-0.5 border ${thickness === t ? 'border-purple-400 text-purple-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                            >
                                {t === 2 ? 'Fino' : t === 4 ? 'Med' : t === 8 ? 'Grueso' : 'Max'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleClear}
                        disabled={isSubmitting}
                        className="px-3 py-1 border border-red-500/30 text-red-400 text-xs uppercase tracking-wider hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                        Limpiar
                    </button>
                </div>

                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Escribe un mensaje o dedicatoria aquí... (opcional)"
                    className="w-full mt-4 border border-purple-500/20 bg-black/50 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none placeholder:text-purple-900/60 disabled:opacity-50"
                />

                <div className="mt-5 flex gap-3">
                    <button
                        onClick={handleSend}
                        disabled={isSubmitting}
                        className="flex-1 bg-purple-600 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Dibujo 🎨'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </BrutalistPanel>
        </div>
    );
};
