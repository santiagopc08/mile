import React from 'react';
import { Star } from 'lucide-react';

export function StarRow({ count, size = 12, dim = false }: { count: number; size?: number; dim?: boolean }) {
  return (
    <span className="inline-flex items-center gap-[2px]">
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={
            n <= count
              ? dim
                ? 'fill-[#c3f400]/70 text-[#c3f400]/70'
                : 'fill-[#c3f400] text-[#c3f400]'
              : 'text-white/20'
          }
        />
      ))}
    </span>
  );
}
