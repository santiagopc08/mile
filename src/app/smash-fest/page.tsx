"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
// using standard div for loading for simplicity
const SmashFestGame = dynamic(() => import("./components/SmashFestGame"), {
  ssr: false,
  loading: () => <div className="flex w-full h-full items-center justify-center text-white">Loading Game...</div>
});

import { ChamferedPanel } from "@/components/ui/ChamferedPanel";
import { CyberButton } from "@/components/ui/CyberButton";

export default function SmashFestPage() {
  const [levelId, setLevelId] = useState("level_1");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 touch-none">
      <div className="absolute top-4 left-4 z-50">
        <Link href="/">
          <CyberButton variant="secondary" size="xs">
            <ArrowLeft className="w-4 h-4" /> VOLVER
          </CyberButton>
        </Link>
      </div>

      <Suspense fallback={<div className="flex w-full h-full items-center justify-center text-white font-mono uppercase text-xs">Cargando Física...</div>}>
        <SmashFestGame levelId={levelId} onMemoryBlockTriggered={() => setIsModalOpen(true)} />
      </Suspense>

      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-md p-4">
          <ChamferedPanel accentColor="#ff4b89" notchSize={16} label="RECUERDO DESBLOQUEADO" className="max-w-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="font-mono text-xs animate-spin-slow text-[#ff4b89]">◆</span>
              <h2 className="text-lg font-mono font-black uppercase text-white tracking-wide">
                ¡NUEVO RECUERDO!
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[#e1bfb2] mb-6 font-sans">
              Has derribado un bloque especial de memoria. ¡Tómate un momento para celebrar este logro juntos!
            </p>
            <div className="flex gap-3 justify-center">
              <CyberButton
                onClick={() => setIsModalOpen(false)}
                variant="primary"
                accentColor="#ff4b89"
                size="sm"
              >
                CONTINUAR
              </CyberButton>
              <Link href="/">
                <CyberButton variant="secondary" size="sm">
                  INICIO
                </CyberButton>
              </Link>
            </div>
          </ChamferedPanel>
        </div>
      )}
    </div>
  );
}
