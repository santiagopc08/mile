import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

export type TransactionType = 'expense' | 'income' | 'transfer' | 'budget_adjustment';
export type BudgetCategory = 'Food' | 'Transport' | 'Health' | 'Entertainment' | 'Wishlist' | 'Savings';

export interface FinancialMovement {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type?: TransactionType;
  account?: string;
  related_budget?: BudgetCategory | '';
  recurring?: boolean;
}

export const DEFAULT_BUDGETS: Record<BudgetCategory, number> = {
  Food: 520000,
  Transport: 260000,
  Health: 320000,
  Entertainment: 240000,
  Wishlist: 420000,
  Savings: 700000,
};

export const BUDGET_CATEGORIES = Object.keys(DEFAULT_BUDGETS) as BudgetCategory[];
export const INCOME_TYPES = ['salary', 'freelance', 'gift', 'refund', 'shared_income'] as const;
export const ACCOUNTS = ['main_wallet', 'savings_vault', 'shared_pool', 'cash_node'] as const;

export const TRANSLATIONS: Record<string, string> = {
  Food: 'Comida',
  Transport: 'Transporte',
  Health: 'Salud',
  Entertainment: 'Entretenimiento',
  Wishlist: 'Antojos',
  Savings: 'Ahorro',
  salary: 'Salario',
  freelance: 'Freelance',
  gift: 'Regalo',
  refund: 'Reembolso',
  shared_income: 'Ingreso Compartido',
  main_wallet: 'Billetera Principal',
  savings_vault: 'Nuestra Alcancía',
  shared_pool: 'Fondo Compartido',
  cash_node: 'Efectivo',
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
  budget_adjustment: 'Ajuste de Límite',
  Other: 'Otro',
  none: 'Ninguno',
  no_budget: 'Sin Presupuesto'
};
export const t = (key: string) => TRANSLATIONS[key] || key;

export const TYPE_META: Record<TransactionType, { label: string; tag: string; color: string; bg: string; Icon: React.ElementType }> = {
  expense: {
    label: 'Añadir Gasto',
    tag: 'Salió',
    color: '#ffb4ab',
    bg: 'rgba(255, 180, 171, 0.08)',
    Icon: ArrowUpRight,
  },
  income: {
    label: 'Registrar Ingreso',
    tag: 'Entró',
    color: '#c3f400',
    bg: 'rgba(195, 244, 0, 0.08)',
    Icon: ArrowDownLeft,
  },
  transfer: {
    label: 'Mover Dinero',
    tag: 'Movimiento',
    color: '#a178ff',
    bg: 'rgba(161, 120, 255, 0.09)',
    Icon: ArrowLeftRight,
  },
  budget_adjustment: {
    label: 'Ajustar Límite',
    tag: 'Ajuste',
    color: '#ff4b89',
    bg: 'rgba(255, 75, 137, 0.08)',
    Icon: SlidersHorizontal,
  },
};

export const normalizeCategory = (category: string): string => {
  const lower = category.toLowerCase();
  if (lower.includes('aliment') || lower.includes('food') || lower.includes('suministro')) return 'Food';
  if (lower.includes('transport')) return 'Transport';
  if (lower.includes('salud') || lower.includes('health') || lower.includes('veterin')) return 'Health';
  if (lower.includes('wish')) return 'Wishlist';
  if (lower.includes('reserva') || lower.includes('saving')) return 'Savings';
  if (lower.includes('entreten')) return 'Entertainment';
  return category.replace(/^[^\p{L}\p{N}]+/u, '').trim() || 'Other';
};

export const inferType = (movement: FinancialMovement): TransactionType => {
  if (movement.type) return movement.type;
  return movement.amount < 0 ? 'income' : 'expense';
};

export const signedAmount = (movement: FinancialMovement) => {
  const amount = Math.abs(Number(movement.amount) || 0);
  const type = inferType(movement);
  if (type === 'income') return amount;
  if (type === 'expense') return -amount;
  return 0;
};

export const isThisMonth = (date: string) => {
  const parsed = new Date(date);
  const now = new Date();
  return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
};

export const isWithinDays = (date: string, days: number) => {
  const parsed = new Date(date).getTime();
  return parsed >= Date.now() - days * 24 * 60 * 60 * 1000;
};

export const formatCOP = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

export const compactCOP = (val: number) => {
  return new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(val);
};

export const ChunkedProgress = ({ value, color }: { value: number; color: string }) => {
  const activeSegments = Math.ceil(Math.min(Math.max(value, 0), 100) / 10);

  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="h-2 border border-white/10 bg-black"
          style={index < activeSegments ? { backgroundColor: color, borderColor: color, boxShadow: `0 0 8px ${color}55` } : undefined}
        />
      ))}
    </div>
  );
};

export const MetricCell = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="border border-white/10 bg-black/45 p-3">
    <div className="text-[8px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">{label}</div>
    <motion.div
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 text-lg font-black uppercase tracking-normal tabular-nums sm:text-2xl"
      style={{ color: tone || '#ffffff' }}
    >
      {value}
    </motion.div>
  </div>
);
