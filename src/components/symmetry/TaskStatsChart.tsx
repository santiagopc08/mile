'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const TaskStatsChart = ({ tasks }: { tasks: any[] }) => {
  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayLabel = days[d.getDay()];
      const dateStr = d.toLocaleDateString();

      const completedOnDay = tasks.filter(t => t.status === 'done' && t.updatedAt && new Date(t.updatedAt).toLocaleDateString() === dateStr).length;

      return {
        name: dayLabel,
        Completadas: completedOnDay,
      };
    });
  }, [tasks]);

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
            allowDecimals={false}
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
          <Bar
            dataKey="Completadas"
            fill="var(--color-user-a)"
            barSize={16}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
