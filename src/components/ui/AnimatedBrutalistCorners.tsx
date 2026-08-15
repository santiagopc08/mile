'use client';
import React, { useState, useEffect } from 'react';
import { Cycle0Brackets } from './animated-corners/cycles/Cycle0Brackets';
import { Cycle1Characters } from './animated-corners/cycles/Cycle1Characters';
import { Cycle2Laser } from './animated-corners/cycles/Cycle2Laser';
import { Cycle3Tactical } from './animated-corners/cycles/Cycle3Tactical';

export interface AnimatedBrutalistCornersProps {
  color?: string;
  size?: number;
  thickness?: number;
  gap?: number;
  variant?: 'alpha' | 'beta' | 'gamma' | 'delta' | 'auto';
}

export function AnimatedBrutalistCorners({ 
  color = 'currentColor', 
  size = 10, 
  thickness = 1,
  gap = 0,
  variant = 'auto'
}: AnimatedBrutalistCornersProps) {
  const [cycle, setCycle] = useState(0);
  const [subCycle, setSubCycle] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<'alpha' | 'beta' | 'gamma' | 'delta'>('alpha');
  const [cycleDuration, setCycleDuration] = useState(5000);

  useEffect(() => {
    if (variant === 'auto') {
      const variants: ('alpha' | 'beta' | 'gamma' | 'delta')[] = ['alpha', 'beta', 'gamma', 'delta'];
      const hash = color.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const chosen = variants[hash % variants.length];
      setSelectedVariant(chosen);
    } else {
      setSelectedVariant(variant);
    }

    const randDuration = 4500 + Math.random() * 2300;
    setCycleDuration(randDuration);
    setCycle(Math.floor(Math.random() * 4));
  }, [variant, color]);

  useEffect(() => {
    const mainTimer = setInterval(() => {
      setCycle((prev) => (prev + 1) % 4);
    }, cycleDuration);

    return () => clearInterval(mainTimer);
  }, [cycleDuration]);

  useEffect(() => {
    const subDuration = 1100 + Math.random() * 300;
    const subTimer = setInterval(() => {
      setSubCycle((prev) => (prev + 1) % 4);
    }, subDuration);

    return () => clearInterval(subTimer);
  }, []);

  const springConfig = { type: 'spring' as const, stiffness: 220, damping: 18 };

  const characterSets = {
    alpha: {
      tl: ['*+', '▰▱', '[+]', '//'],
      tr: ['+*', '▱▰', '[+]', '\\\\'],
      bl: ['+*', '▰▱', '[+]', '//'],
      br: ['*+', '▱▰', '[+]', '\\\\']
    },
    beta: {
      tl: ['[x]', '##', '/*', '▼▲'],
      tr: ['[x]', '##', '*/', '▼▲'],
      bl: ['[x]', '##', '/*', '▲▼'],
      br: ['[x]', '##', '*/', '▲▼']
    },
    gamma: {
      tl: ['◇◆', '::', '[o]', '++'],
      tr: ['◆◇', '::', '[o]', '++'],
      bl: ['◆◇', '::', '[o]', '++'],
      br: ['◇◆', '::', '[o]', '++']
    },
    delta: {
      tl: ['«»', '||', '~_', '¤¤'],
      tr: ['«»', '||', '_~', '¤¤'],
      bl: ['«»', '||', '~_', '¤¤'],
      br: ['«»', '||', '_~', '¤¤']
    }
  };

  const characterCombos = characterSets[selectedVariant];

  const sharedProps = {
    color,
    size,
    thickness,
    gap,
    cycle,
    subCycle,
    selectedVariant,
    springConfig,
    characterCombos
  };

  return (
    <>
      <Cycle0Brackets {...sharedProps} />
      <Cycle1Characters {...sharedProps} />
      <Cycle2Laser {...sharedProps} />
      <Cycle3Tactical {...sharedProps} />
    </>
  );
}
