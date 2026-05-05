'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';

const formatCOP = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

interface Allocation {
  date: string;
  amount: number;
}

interface ChartDataPoint {
  name: string;
  Santiago: number;
  Milena: number;
}

export const FinanceChart = ({ allocationsA, allocationsB }: { allocationsA: Allocation[], allocationsB: Allocation[] }) => {
  const { mode } = useVisibility();
  const { profile } = useProfile();

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayLabel = days[d.getDay()];
      const dateStr = d.toLocaleDateString();

      const sumA = (allocationsA || [])
        .filter(e => new Date(e.date).toLocaleDateString() === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      const sumB = (allocationsB || [])
        .filter(e => new Date(e.date).toLocaleDateString() === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: dayLabel,
        Santiago: sumA,
        Milena: sumB,
      };
    });
  }, [allocationsA, allocationsB]);

  return (
    <div className="w-full h-full font-display">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#555' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(val)}
            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#555' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0px',
              fontSize: '11px',
              textTransform: 'uppercase',
              fontWeight: 'black',
              padding: '12px'
            }}
            itemStyle={{ color: 'var(--color-user-a)' }}
            formatter={(value: number) => [formatCOP(Number(value)), "OPERACIÓN"]}
          />
          {mode === 'us' && (
            <Legend
              iconType="rect"
              verticalAlign="top"
              align="right"
              wrapperStyle={{
                fontSize: '9px',
                textTransform: 'uppercase',
                fontWeight: 'black',
                paddingBottom: '20px',
                letterSpacing: '0.15em',
                opacity: 0.8
              }}
            />
          )}

          {mode === 'me' ? (
            <Bar
              dataKey={profile === 'el' ? 'Santiago' : 'Milena'}
              fill={profile === 'el' ? 'var(--color-user-a)' : 'var(--color-user-b)'}
              barSize={24}
              isAnimationActive={false}
            />
          ) : (
            <>
              <Bar dataKey="Santiago" fill="var(--color-user-a)" barSize={12} isAnimationActive={false} />
              <Bar dataKey="Milena" fill="var(--color-user-b)" barSize={12} isAnimationActive={false} />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
