'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { JarOfNotes } from "@/components/JarOfNotes";

export default function TarroPage() {
  return (
    <PrivateRoute>
      <main className="w-full flex flex-col items-center justify-start pt-10 px-4 md:px-12 pb-24">
        <JarOfNotes />
      </main>
    </PrivateRoute>
  );
}
