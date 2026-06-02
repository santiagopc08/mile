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

type TransactionType = 'expense' | 'income' | 'transfer' | 'budget_adjustment';
interface FinancialMovement {
  amount?: number;
  date: string;
  type?: TransactionType;
}

const formatCOP = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

const getType = (movement: FinancialMovement): TransactionType => {
  if (movement?.type) return movement.type;
  return Number(movement?.amount) < 0 ? 'income' : 'expense';
};

const getAmount = (movement: FinancialMovement) => Math.abs(Number(movement?.amount) || 0);

export const FinanceChart = ({ allocationsElla, allocationsEl }: { allocationsElla: FinancialMovement[], allocationsEl: FinancialMovement[] }) => {
  const { mode } = useVisibility();
  const { profile } = useProfile();

  const chartData = useMemo(() => {
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const today = new Date();

    // Create a map to hold data for the last 7 days
    const dateMap = new Map();
    const dateKeys: string[] = [];

    // Pre-populate the map with 0s for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString();
      dateKeys.push(dateStr);

      dateMap.set(dateStr, {
        name: days[d.getDay()],
        incomeElla: 0,
        expenseElla: 0,
        incomeEl: 0,
        expenseEl: 0
      });
    }

    // Process Ella's allocations in a single pass
    if (allocationsElla) {
      for (const e of allocationsElla) {
        const dateStr = new Date(e.date).toLocaleDateString();
        if (dateMap.has(dateStr)) {
          const stats = dateMap.get(dateStr);
          const amount = getAmount(e);
          if (getType(e) === 'income') stats.incomeElla += amount;
          else if (getType(e) === 'expense') stats.expenseElla += amount;
        }
      }
    }

    // Process El's allocations in a single pass
    if (allocationsEl) {
      for (const e of allocationsEl) {
        const dateStr = new Date(e.date).toLocaleDateString();
        if (dateMap.has(dateStr)) {
          const stats = dateMap.get(dateStr);
          const amount = getAmount(e);
          if (getType(e) === 'income') stats.incomeEl += amount;
          else if (getType(e) === 'expense') stats.expenseEl += amount;
        }
      }
    }

    // Map back to array in chronological order
    return dateKeys.map(dateStr => {
      const stats = dateMap.get(dateStr);
      return {
        name: stats.name,
        USER_A: stats.incomeElla - stats.expenseElla,
        USER_B: stats.incomeEl - stats.expenseEl,
        INCOME: stats.incomeElla + stats.incomeEl,
        EXPENSE: stats.expenseElla + stats.expenseEl,
      };
    });
  }, [allocationsElla, allocationsEl]);

  return (
    <div className="h-full w-full border border-white/10 bg-black/40 p-2 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 7, fontWeight: 'bold', fill: '#555', letterSpacing: '0.1em' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(val)}
            tick={{ fontSize: 7, fontWeight: 'bold', fill: '#555' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 112, 32, 0.05)' }}
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0px',
              fontSize: '8px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              padding: '10px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ padding: '2px 0' }}
            formatter={(value: unknown, name: unknown) => [formatCOP(Number(value || 0)), `[ ${String(name)} ]`]}
          />
          {mode === 'us' && (
            <Legend 
              iconType="rect" 
              verticalAlign="top" 
              align="right" 
              wrapperStyle={{ 
                fontSize: '7px', 
                textTransform: 'uppercase', 
                fontWeight: 'black', 
                paddingBottom: '20px', 
                letterSpacing: '0.2em',
                opacity: 0.6
              }} 
            />
          )}

          {mode === 'me' ? (
            <>
              <Bar
                dataKey={profile === 'ella' ? 'USER_A' : 'USER_B'}
                fill={profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)'}
                barSize={12}
                isAnimationActive={true}
                name={profile === 'ella' ? 'NET_MILENA' : 'NET_SANTIAGO'}
              />
              <Bar dataKey="EXPENSE" fill="var(--color-system-alert)" barSize={6} isAnimationActive={true} name="OUTFLOW" />
            </>
          ) : (
            <>
              <Bar dataKey="INCOME" fill="var(--color-user-b)" barSize={8} isAnimationActive={true} name="INFLOW" />
              <Bar dataKey="EXPENSE" fill="var(--color-system-alert)" barSize={8} isAnimationActive={true} name="OUTFLOW" />
              <Bar dataKey="USER_A" fill="var(--color-user-a)" barSize={6} isAnimationActive={true} name="NET_MILENA" />
              <Bar dataKey="USER_B" fill="var(--color-user-c)" barSize={6} isAnimationActive={true} name="NET_SANTIAGO" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
