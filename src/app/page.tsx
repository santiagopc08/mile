'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { TransparencyDashboard } from "@/components/TransparencyDashboard";

export default function Home() {
  return (
    <PrivateRoute>
      <div className="fixed inset-0 z-[-1] bg-mesh-dark">
        {/* Animated glowing orbs in the background */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-purple/30 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-brand-blue/30 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-brand-pink/20 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-blob animation-delay-4000" />
      </div>

      <main className="w-full flex flex-col items-center justify-start pt-10 px-4 md:px-12 pb-24 relative z-10">
        <section className="w-full">
          <TransparencyDashboard />
        </section>
      </main>
    </PrivateRoute>
  );
}
