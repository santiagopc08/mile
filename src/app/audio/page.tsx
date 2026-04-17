'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { AudioSection } from "@/components/AudioSection";

export default function AudioPage() {
  return (
    <PrivateRoute>
      <main className="w-full flex items-center justify-center pt-10 pb-24 md:px-12">
        <AudioSection />
      </main>
    </PrivateRoute>
  );
}
