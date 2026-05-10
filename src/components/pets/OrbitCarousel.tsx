'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface OrbitItem {
  id: string;
  image: string;
  label: string;
}

interface OrbitCarouselProps {
  items: OrbitItem[];
  radius?: number;
  autoRotateSpeed?: number;
  onSelect?: (id: string) => void;
}

export const OrbitCarousel = ({
  items,
  radius = 280,
  autoRotateSpeed = 0.5,
  onSelect
}: OrbitCarouselProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const rotation = useMotionValue(0);
  const springRotation = useSpring(rotation, { stiffness: 150, damping: 20 });

  const lastTime = useRef<number>(0);
  const requestRef = useRef<number>(0);

  const animateAutoRotate = useCallback((time: number) => {
    if (!lastTime.current) lastTime.current = time;
    const deltaTime = time - lastTime.current;
    lastTime.current = time;

    if (!isDragging) {
      rotation.set(rotation.get() + autoRotateSpeed * (deltaTime / 16));
    }
    requestRef.current = requestAnimationFrame(animateAutoRotate);
  }, [isDragging, autoRotateSpeed, rotation]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateAutoRotate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animateAutoRotate]);

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => {
    // Small delay to prevent accidental selection right after drag
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleDrag = (event: any, info: any) => {
    rotation.set(rotation.get() + info.delta.x * 0.5);
  };

  return (
    <div
      className="relative flex h-[400px] w-full items-center justify-center overflow-visible"
      style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
    >
      <motion.div
        drag="x"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
        className="relative flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {items.map((item, index) => {
          const angle = (index / items.length) * Math.PI * 2;

          return (
            <OrbitCard
              key={item.id}
              item={item}
              angle={angle}
              radius={radius}
              rotation={springRotation}
              isDragging={isDragging}
              onClick={() => onSelect?.(item.id)}
            />
          );
        })}
      </motion.div>
    </div>
  );
};

interface OrbitCardProps {
  item: OrbitItem;
  angle: number;
  radius: number;
  rotation: any;
  isDragging: boolean;
  onClick: () => void;
}

const OrbitCard = ({ item, angle, radius, rotation, isDragging, onClick }: OrbitCardProps) => {
  const x = useTransform(rotation, (r: number) => Math.sin(angle + (r * Math.PI) / 180) * radius);
  const z = useTransform(rotation, (r: number) => Math.cos(angle + (r * Math.PI) / 180) * radius);

  const scale = useTransform(z, [-radius, radius], [0.5, 1.1]);
  const opacity = useTransform(z, [-radius, radius], [0.15, 1]);
  const blur = useTransform(z, [-radius, radius], ['blur(4px)', 'blur(0px)']);
  const brightness = useTransform(z, [-radius, radius], ['brightness(0.2)', 'brightness(1)']);

  return (
    <motion.div
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className="absolute flex flex-col items-center justify-center overflow-visible will-change-transform"
      style={{
        x,
        z,
        scale,
        opacity,
        filter: blur,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="group relative h-28 w-20 overflow-hidden rounded-2xl border border-white/20 bg-[#0a0a0a]/80 backdrop-blur-md transition-all hover:border-[#ff7020]/60 sm:h-40 sm:w-32"
        style={{ filter: brightness }}
        whileHover={{ scale: 1.05, borderColor: 'rgba(255, 112, 32, 0.6)' }}
      >
        <img
          src={item.image}
          alt={item.label}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-0 w-full text-center">
          <span className="text-[9px] font-black uppercase tracking-tighter text-white/80 sm:text-[10px]">{item.label}</span>
        </div>

        <motion.div
          className="absolute inset-x-0 h-px bg-[#ff7020]/40 shadow-[0_0_10px_#ff7020]"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </motion.div>
  );
};
