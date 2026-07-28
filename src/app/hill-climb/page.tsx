'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import dynamic from "next/dynamic";
import { BrutalistSkeleton } from "@/components/ui/BrutalistSkeleton";
import { AmbientField } from "@/components/AmbientField";
import Link from "next/link";
import { ArrowLeft, Mountain } from "lucide-react";

const HillClimbCanvas = dynamic(
    () => import("@/components/hill-climb/HillClimbCanvas").then((m) => m.HillClimbCanvas),
    {
        loading: () => (
            <BrutalistSkeleton
                label="Cargando motor físico Hill Climb"
                className="h-[68vh] min-h-[420px] w-full rounded-3xl"
            />
        ),
        ssr: false,
    }
);

export default function HillClimbPage() {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? '#ff4b89' : '#c3f400';

    return (
        <PrivateRoute>
            <AmbientField preset="juego" profile={profile} />
            <main className="relative z-10 min-h-screen w-full overflow-hidden px-3 pb-16 pt-4 font-mono text-[#e5e2e1] sm:px-6 md:px-8 md:pt-6">
                <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
                    {/* Cabecera */}
                    <header className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                        <div className="relative p-4 sm:p-6 md:p-7">
                            <div
                                className="absolute left-0 top-0 h-full w-[5px]"
                                style={{ backgroundColor: accentColor }}
                            />
                            <div className="flex w-full flex-wrap items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <Link
                                        href="/juego"
                                        className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-white transition-colors hover:bg-white/10"
                                        title="Volver a la zona de juegos"
                                        aria-label="Volver a la zona de juegos"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <Mountain
                                        className="h-6 w-6 shrink-0 sm:h-7 sm:w-7"
                                        style={{ color: accentColor }}
                                    />
                                    <div className="min-w-0">
                                        <h1
                                            className="select-none truncate text-xl font-black uppercase tracking-[0.1em] text-white sm:text-3xl md:text-4xl"
                                            style={{ textShadow: `3px 3px 0px #000, 0 0 24px ${accentColor}40` }}
                                        >
                                            Hill Climb · Buggy Mountain
                                        </h1>
                                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-xs">
                                            Sube, salta y no te quedes sin gasolina
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className="rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider sm:text-xs"
                                    style={{
                                        color: accentColor,
                                        borderColor: `${accentColor}44`,
                                        backgroundColor: `${accentColor}14`,
                                    }}
                                >
                                    Física Matter.js · 60 FPS
                                </div>
                            </div>
                        </div>
                    </header>

                    <section className="w-full">
                        <HillClimbCanvas accentColor={accentColor} />
                    </section>

                    <p className="px-1 text-center text-[10px] uppercase tracking-[0.2em] text-white/30 sm:text-[11px]">
                        Pedales en pantalla · Teclas A / D o flechas · R para reiniciar
                    </p>
                </div>
            </main>
        </PrivateRoute>
    );
}
