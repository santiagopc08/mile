'use client';

import React, { useEffect, useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';
import { motion, useAnimation } from 'framer-motion';

interface SymmetryChartProps {
  dataA: any;
  dataB: any;
  lastPulseAt?: string;
}

export const SymmetryChart = ({ dataA, dataB, lastPulseAt }: SymmetryChartProps) => {
  const { mode } = useVisibility();
  const { profile } = useProfile();
  const controls = useAnimation();
  const [prevPulse, setPrevPulse] = useState(lastPulseAt);

  useEffect(() => {
    if (lastPulseAt && lastPulseAt !== prevPulse) {
      setPrevPulse(lastPulseAt);
      controls.start({
        scale: [1, 1.1, 1],
        opacity: [1, 0.8, 1],
        transition: { duration: 0.8, times: [0, 0.5, 1], ease: "easeInOut" }
      });
    }
  }, [lastPulseAt, prevPulse, controls]);

  const categories = [
    { name: 'Academic', key: 'academic' },
    { name: 'Work', key: 'work' },
    { name: 'Home', key: 'home' },
    { name: 'Personal', key: 'personal' },
  ];

  const chartData = mode === 'me'
    ? categories.map((cat, index) => ({
        name: cat.name,
        value: profile === 'el' ? dataA[cat.key] : dataB[cat.key],
        fill: profile === 'el' ? 'var(--color-user-a)' : 'var(--color-user-b)',
      })).reverse()
    : [
        ...categories.map((cat) => ({
          name: `B ${cat.name}`,
          value: dataB[cat.key],
          fill: 'var(--color-user-b)',
          opacity: 0.6,
        })).reverse(),
        ...categories.map((cat) => ({
          name: `A ${cat.name}`,
          value: dataA[cat.key],
          fill: 'var(--color-user-a)',
          opacity: 1,
        })).reverse(),
      ];

  return (
    <motion.div
      animate={controls}
      className="w-full h-full flex items-center justify-center relative"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="100%"
          barSize={mode === 'me' ? 14 : 6}
          data={chartData}
          startAngle={90}
          endAngle={450}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: 'rgba(120, 113, 108, 0.05)' }}
            dataKey="value"
            cornerRadius={0}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Decorative pulse rings when active */}
      {lastPulseAt === prevPulse && lastPulseAt && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
                scale: [0.8, 1.5],
                opacity: [0.5, 0]
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 border-2 border-geometric-accent rounded-full pointer-events-none"
          />
      )}
    </motion.div>
  );
};
