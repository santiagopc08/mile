'use client';

import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';

interface SymmetryChartProps {
  dataA: any;
  dataB: any;
}

export const SymmetryChart = ({ dataA, dataB }: SymmetryChartProps) => {
  const { mode } = useVisibility();
  const { profile } = useProfile();

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
    <div className="w-full h-full flex items-center justify-center relative">
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
    </div>
  );
};
