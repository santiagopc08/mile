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

export const TaskStatsChart = ({ tasks, objectives }: { tasks: any[], objectives: any[] }) => {
  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();

    // Pre-calculate target dates and labels into an O(1) hash map
    const targetDates = new Map<string, { name: string; Ella: number; Yo: number }>();
    const orderedKeys: string[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString();
      orderedKeys.push(dateStr);
      targetDates.set(dateStr, {
        name: days[d.getDay()],
        Ella: 0,
        Yo: 0
      });
    }

    // Pre-calculate objective authors into an O(1) hash map
    const objectiveAuthorMap = new Map<string, string>();
    for (const obj of objectives) {
      if (obj.id) objectiveAuthorMap.set(obj.id, obj.author);
    }

    // Single O(N) pass to aggregate tasks
    for (const t of tasks) {
      if (t.status === 'done' && t.updated_at) {
        const dateStr = new Date(t.updated_at).toLocaleDateString();
        const target = targetDates.get(dateStr);
        if (target) {
          const author = objectiveAuthorMap.get(t.objective_id);
          if (author === 'ella') {
            target.Ella++;
          } else if (author === 'el') {
            target.Yo++;
          }
        }
      }
    }

    return orderedKeys.map(key => targetDates.get(key)!);
  }, [tasks, objectives]);

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
            dataKey="Ella"
            fill="var(--color-user-a)"
            barSize={12}
            isAnimationActive={false}
          />
          <Bar
            dataKey="Yo"
            fill="var(--color-user-b)"
            barSize={12}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
