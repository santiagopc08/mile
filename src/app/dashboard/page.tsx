'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { SymmetryDashboard } from "@/components/symmetry/SymmetryDashboard";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { useProfile } from "@/context/ProfileContext";

export default function Home() {
  const { profile } = useProfile();

  return (
    <PrivateRoute>
      <InteractiveBackground preset="dashboard" profile={profile} />

      <main className="w-full flex flex-col items-center justify-start pt-12 px-6 md:px-16 pb-24 relative z-10">
        <section className="w-full">
          <SymmetryDashboard />
        </section>
      </main>
    </PrivateRoute>
  );
}
