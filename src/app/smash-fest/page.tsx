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

export default function SmashFestPage() {
  const [levelId, setLevelId] = useState("level_1");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 touch-none">
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors inline-block">
            <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      <Suspense fallback={<div className="flex w-full h-full items-center justify-center text-white">Loading Physics...</div>}>
        <SmashFestGame levelId={levelId} onMemoryBlockTriggered={() => setIsModalOpen(true)} />
      </Suspense>

      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-sm text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Memory Unlocked!</h2>
            <p className="text-slate-300 mb-6">
              You've knocked down a special memory block. Take a moment to reflect.
            </p>
            <div className="flex gap-4 justify-center">
                <button
                onClick={() => {
                    setIsModalOpen(false);
                    // Add logic to restart or continue
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                Continue
                </button>
                 <Link href="/" className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors font-medium">
                    Back to Home
                </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
