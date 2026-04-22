'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';

export const FinanceChart = ({ expensesA, expensesB }: { expensesA: any[], expensesB: any[] }) => {
  const { mode } = useVisibility();
  const { profile } = useProfile();

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayLabel = days[d.getDay()];
      const dateStr = d.toLocaleDateString();

      const sumA = expensesA
        .filter(e => new Date(e.date).toLocaleDateString() === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      const sumB = expensesB
        .filter(e => new Date(e.date).toLocaleDateString() === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: dayLabel,
        Santiago: sumA,
        Milena: sumB,
      };
    });
  }, [expensesA, expensesB]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontWeight: 'bold', fill: 'currentColor', opacity: 0.5 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontWeight: 'bold', fill: 'currentColor', opacity: 0.5 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(120, 113, 108, 0.05)' }}
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid rgba(120, 113, 108, 0.2)',
              borderRadius: '0px',
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              padding: '8px'
            }}
          />
          {mode === 'us' && <Legend iconType="square" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 'bold', paddingBottom: '20px', letterSpacing: '0.1em' }} />}

          {mode === 'me' ? (
            <Bar
              dataKey={profile === 'el' ? 'Santiago' : 'Milena'}
              fill={profile === 'el' ? 'var(--color-user-a)' : 'var(--color-user-b)'}
              barSize={20}
              isAnimationActive={false}
            />
          ) : (
            <>
              <Bar dataKey="Santiago" fill="var(--color-user-a)" barSize={10} isAnimationActive={false} />
              <Bar dataKey="Milena" fill="var(--color-user-b)" barSize={10} isAnimationActive={false} />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
