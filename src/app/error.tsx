'use client';

/**
 * error.tsx — frontera de error de segmento (App Router).
 *
 * Sin esto, cualquier excepción no capturada en una página dejaba la PWA
 * instalada en blanco, sin barra de direcciones ni botón de recarga: la única
 * salida era cerrar la app desde el conmutador de tareas. Aquí se conserva la
 * navegación y se ofrece `reset()`, que reintenta el render del segmento sin
 * recargar toda la aplicación.
 */

import { useEffect } from 'react';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const CHAMFER =
    'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Error de segmento capturado:', error);
    }, [error]);

    return (
        <main className="flex min-h-[70vh] w-full items-center justify-center px-5 py-16">
            <div
                className="w-full max-w-md border border-[#ef4444]/50 bg-[#0a070c]/97 p-6 backdrop-blur-xl"
                style={{ clipPath: CHAMFER, boxShadow: '0 0 40px rgba(239,68,68,0.18)' }}
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#ef4444]" aria-hidden="true" />
                    <h1 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-white">
                        Algo se rompió
                    </h1>
                </div>
                <span
                    className="mt-2 block h-px w-full"
                    style={{ background: 'linear-gradient(90deg, #ef4444, transparent)' }}
                    aria-hidden="true"
                />

                <p className="mt-4 text-[13px] leading-relaxed text-[#c9c2c0]">
                    Esta sección no pudo cargarse. Tus datos están a salvo: no se ha borrado nada.
                </p>

                {error.digest && (
                    <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#a88a7e]">
                        Referencia · {error.digest}
                    </p>
                )}

                <div className="mt-6 grid grid-cols-2 gap-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 border border-white/15 bg-white/[0.06] px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#e5e2e1] transition-colors hover:bg-white/[0.12] active:scale-95"
                    >
                        <Home className="h-3.5 w-3.5" aria-hidden="true" />
                        Inicio
                    </Link>
                    <button
                        type="button"
                        onClick={reset}
                        className="flex items-center justify-center gap-2 border border-[#a178ff] bg-[#a178ff]/25 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all active:scale-95"
                        style={{ boxShadow: '0 0 16px rgba(161,120,255,0.25)' }}
                    >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Reintentar
                    </button>
                </div>
            </div>
        </main>
    );
}
