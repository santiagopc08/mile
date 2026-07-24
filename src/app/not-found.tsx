/**
 * not-found.tsx — 404 dentro de la estética de la app.
 *
 * Sin este archivo, una ruta inexistente (un atajo viejo de la pantalla de
 * inicio, un enlace compartido que ya no existe) mostraba la página blanca
 * por defecto de Next: un muro luminoso en inglés en mitad de una app negra,
 * y sin ninguna vía de vuelta salvo el botón atrás.
 */

import Link from 'next/link';
import { Compass } from 'lucide-react';

const CHAMFER =
    'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))';

export default function NotFound() {
    return (
        <main className="flex min-h-[70vh] w-full items-center justify-center px-5 py-16">
            <div
                className="w-full max-w-md border border-[#a178ff]/50 bg-[#0a070c]/97 p-6 backdrop-blur-xl"
                style={{ clipPath: CHAMFER, boxShadow: '0 0 40px rgba(161,120,255,0.18)' }}
            >
                <div className="flex items-center gap-2">
                    <span className="animate-spin-slow text-[10px] text-[#a178ff]" aria-hidden="true">
                        ◆
                    </span>
                    <h1 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-white">
                        Sector 404 · Sin señal
                    </h1>
                </div>
                <span
                    className="mt-2 block h-px w-full"
                    style={{ background: 'linear-gradient(90deg, #a178ff, transparent)' }}
                    aria-hidden="true"
                />

                <p className="mt-4 text-[13px] leading-relaxed text-[#c9c2c0]">
                    Esta dirección no lleva a ninguna parte. Puede que el enlace sea antiguo o que la
                    sección haya cambiado de sitio.
                </p>

                <Link
                    href="/dashboard"
                    className="mt-6 flex items-center justify-center gap-2 border border-[#a178ff] bg-[#a178ff]/25 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all active:scale-95"
                    style={{ boxShadow: '0 0 16px rgba(161,120,255,0.25)' }}
                >
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    Volver al inicio
                </Link>
            </div>
        </main>
    );
}
