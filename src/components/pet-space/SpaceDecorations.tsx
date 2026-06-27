import { useMemo } from 'react';

export function SpaceDecorations({ isWarping, direction, petAccent, profileAccent }: { isWarping: boolean; direction: number; petAccent: string; profileAccent: string }) {
  const stars = useMemo(() => Array.from({ length: 40 }).map(() => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 1.5 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  })), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      <style>{`
        @keyframes pulse-star {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
        @keyframes warp-star {
          0% { transform: scale(1) translateX(0); opacity: 0.8; }
          100% { transform: scale(10) translateX(var(--warp-dir)); opacity: 0; }
        }
      `}</style>

      {/* Dynamic performance-friendly radial gradient nebulas */}
      <div
        className="absolute inset-0 opacity-65 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(circle at 25% 35%, ${petAccent}44 0%, transparent 70%),
            radial-gradient(circle at 75% 65%, ${profileAccent}33 0%, transparent 75%)
          `,
          filter: 'blur(45px)'
        }}
      />

      {/* Background stars using pure CSS animations for high performance */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full mix-blend-screen"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: isWarping
              ? `warp-star 0.6s ease-in forwards`
              : `pulse-star ${star.duration}s ease-in-out infinite`,
            animationDelay: isWarping ? '0s' : `${star.delay}s`,
            ['--warp-dir' as string]: `${direction * -300}px`
          }}
        />
      ))}

      {/* Nebula glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] mix-blend-screen opacity-40" style={{ backgroundColor: profileAccent }} />
    </div>
  );
}
