'use client';

import React from 'react';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';

interface RevealDrawingModalProps {
    data: { sender: string; image: string; caption: string };
    onClose: () => void;
}

export const RevealDrawingModal: React.FC<RevealDrawingModalProps> = ({ data, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-mono">
            <BrutalistPanel
                accentColor="#c084fc"
                cornerSize={12}
                className="w-full max-w-md !bg-[#0d0914] p-6 shadow-[0_0_40px_rgba(139,92,246,0.3)] flex flex-col items-center"
            >
                <h3 className="mb-1 text-lg font-bold uppercase tracking-wider text-purple-400 text-center">
                    Dibujo de {data.sender} 🖼️
                </h3>
                <span className="mb-4 text-[10px] text-slate-500 uppercase tracking-widest">
                    Regalo Especial de Hoy
                </span>

                <div className="relative w-full border border-purple-500/20 bg-black aspect-[4/3] p-1 flex justify-center items-center">
                    {data.image ? (
                        <img
                            src={data.image}
                            alt="Dibujo de amor"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-slate-600 text-xs italic">No se pudo cargar el dibujo</div>
                    )}
                </div>

                <p className="w-full mt-4 text-center text-xs leading-relaxed text-purple-200 border-t border-purple-500/10 pt-4 italic">
                    "{data.caption}"
                </p>

                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-purple-600 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white hover:bg-purple-500 active:scale-95 transition-all"
                >
                    Cerrar Dibujo ✨
                </button>
            </BrutalistPanel>
        </div>
    );
};
