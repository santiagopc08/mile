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

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayLabel = days[d.getDay()];
      const dateStr = d.toLocaleDateString();

      const dayElla = (allocationsElla || []).filter(e => new Date(e.date).toLocaleDateString() === dateStr);
      const dayEl = (allocationsEl || []).filter(e => new Date(e.date).toLocaleDateString() === dateStr);

      const incomeElla = dayElla.filter(e => getType(e) === 'income').reduce((sum, e) => sum + getAmount(e), 0);
      const expenseElla = dayElla.filter(e => getType(e) === 'expense').reduce((sum, e) => sum + getAmount(e), 0);
      const incomeEl = dayEl.filter(e => getType(e) === 'income').reduce((sum, e) => sum + getAmount(e), 0);
      const expenseEl = dayEl.filter(e => getType(e) === 'expense').reduce((sum, e) => sum + getAmount(e), 0);

      return {
        name: dayLabel,
        USER_A: incomeElla - expenseElla,
        USER_B: incomeEl - expenseEl,
        INCOME: incomeElla + incomeEl,
        EXPENSE: expenseElla + expenseEl,
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
