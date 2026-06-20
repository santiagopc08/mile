import React from 'react';
import { Wallet } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { MetricCell, formatCOP } from './DualWalletShared';

interface DualWalletMetricsProps {
  totalAvailable: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  savingsTotal: number;
  budgetRemaining: number;
  balanceTone: string;
  accentHex: string;
}

export const DualWalletMetrics = ({
  totalAvailable,
  incomeThisMonth,
  expensesThisMonth,
  savingsTotal,
  budgetRemaining,
  balanceTone,
  accentHex,
}: DualWalletMetricsProps) => {
  return (
    <section
      className="relative overflow-hidden border bg-[#0a0a0a] bg-dot-matrix p-4"
      style={{ borderColor: balanceTone, boxShadow: `0 0 18px ${balanceTone}22` }}
    >
      <AnimatedBrutalistCorners color={balanceTone} size={12} thickness={1.5} />

      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Wallet size={120} className="text-white" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4 relative z-10">
        <div>
          <p className="text-[9px] font-mono font-black uppercase tracking-[0.26em]" style={{ color: balanceTone }}>Resumen General</p>
          <h3 className="mt-1 text-2xl font-mono font-black uppercase tracking-normal text-white">Estado financiero general</h3>
        </div>
        <span className="border px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em]" style={{ borderColor: balanceTone, color: balanceTone }}>
          {totalAvailable < 0 ? 'Estado: En Rojo' : 'Estado: Todo Bien'}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCell label="Total Disponible" value={formatCOP(totalAvailable)} tone={balanceTone} />
        <MetricCell label="Ingresos del Mes" value={formatCOP(incomeThisMonth)} tone="#c3f400" />
        <MetricCell label="Gastos del Mes" value={formatCOP(expensesThisMonth)} tone="#ffb4ab" />
        <MetricCell label="Ahorro Total" value={formatCOP(savingsTotal)} tone="#a178ff" />
        <MetricCell label="Presupuesto Restante" value={formatCOP(budgetRemaining)} tone={budgetRemaining < 0 ? '#ffb4ab' : accentHex} />
      </div>
    </section>
  );
};
