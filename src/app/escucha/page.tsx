'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { PersistentListening } from "@/components/PersistentListening";

export default function EscuchaPage() {
  return (
    <PrivateRoute>
      <main className="w-full flex flex-col items-center justify-start pt-10 px-4 md:px-12 pb-24">
        <PersistentListening />
      </main>
    </PrivateRoute>
  );
}
