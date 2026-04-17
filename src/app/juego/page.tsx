'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { Mahjong } from "@/components/Mahjong";

export default function JuegoPage() {
  return (
    <PrivateRoute>
      <main className="w-full flex items-center justify-center pt-10 pb-24 md:px-12">
        <Mahjong />
      </main>
    </PrivateRoute>
  );
}
