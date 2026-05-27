'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  FileText,
  PiggyBank,
  Plus,
  Repeat2,
  SlidersHorizontal,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { StoreService } from '@/services/storeService';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';

type TransactionType = 'expense' | 'income' | 'transfer' | 'budget_adjustment';
type BudgetCategory = 'Food' | 'Transport' | 'Health' | 'Entertainment' | 'Wishlist' | 'Savings';

interface FinancialMovement {
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

const DEFAULT_BUDGETS: Record<BudgetCategory, number> = {
  Food: 520000,
  Transport: 260000,
  Health: 320000,
  Entertainment: 240000,
  Wishlist: 420000,
  Savings: 700000,
};

const BUDGET_CATEGORIES = Object.keys(DEFAULT_BUDGETS) as BudgetCategory[];
const INCOME_TYPES = ['salary', 'freelance', 'gift', 'refund', 'shared_income'] as const;
const ACCOUNTS = ['main_wallet', 'savings_vault', 'shared_pool', 'cash_node'] as const;

const TRANSLATIONS: Record<string, string> = {
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
const t = (key: string) => TRANSLATIONS[key] || key;

const TYPE_META: Record<TransactionType, { label: string; tag: string; color: string; bg: string; Icon: React.ElementType }> = {
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

const normalizeCategory = (category: string): string => {
  const lower = category.toLowerCase();
  if (lower.includes('aliment') || lower.includes('food') || lower.includes('suministro')) return 'Food';
  if (lower.includes('transport')) return 'Transport';
  if (lower.includes('salud') || lower.includes('health') || lower.includes('veterin')) return 'Health';
  if (lower.includes('wish')) return 'Wishlist';
  if (lower.includes('reserva') || lower.includes('saving')) return 'Savings';
  if (lower.includes('entreten')) return 'Entertainment';
  return category.replace(/^[^\p{L}\p{N}]+/u, '').trim() || 'Other';
};

const inferType = (movement: FinancialMovement): TransactionType => {
  if (movement.type) return movement.type;
  return movement.amount < 0 ? 'income' : 'expense';
};

const signedAmount = (movement: FinancialMovement) => {
  const amount = Math.abs(Number(movement.amount) || 0);
  const type = inferType(movement);
  if (type === 'income') return amount;
  if (type === 'expense') return -amount;
  return 0;
};

const isThisMonth = (date: string) => {
  const parsed = new Date(date);
  const now = new Date();
  return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
};

const isWithinDays = (date: string, days: number) => {
  const parsed = new Date(date).getTime();
  return parsed >= Date.now() - days * 24 * 60 * 60 * 1000;
};

const formatCOP = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

const compactCOP = (val: number) => {
  return new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(val);
};

const ChunkedProgress = ({ value, color }: { value: number; color: string }) => {
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

const MetricCell = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
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

export const DualWallet = ({
  allocations,
  onAllocationsChange,
}: {
  allocations: FinancialMovement[];
  onAllocationsChange: (newAllocations: FinancialMovement[]) => void;
}) => {
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentHex = profile === 'ella' ? '#ff4b89' : '#c3f400';
  const [type, setType] = useState<TransactionType>('expense');

  // Budgets State
  const [budgets, setBudgets] = useState<Record<BudgetCategory, number>>(DEFAULT_BUDGETS);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);

  // Sync budgets per profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`symmetry_budgets_${profile}`);
      if (saved) {
        try {
          setBudgets(JSON.parse(saved));
        } catch (e) {
          console.error("Error loading budgets:", e);
          setBudgets(DEFAULT_BUDGETS);
        }
      } else {
        setBudgets(DEFAULT_BUDGETS);
      }
    }
  }, [profile]);

  const handleUpdateBudget = (categoryName: BudgetCategory, value: number) => {
    const next = { ...budgets, [categoryName]: value };
    setBudgets(next);
    localStorage.setItem(`symmetry_budgets_${profile}`, JSON.stringify(next));
  };
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState<(typeof ACCOUNTS)[number]>('main_wallet');
  const [relatedBudget, setRelatedBudget] = useState<BudgetCategory | ''>('Food');
  const [recurring, setRecurring] = useState(false);

  const movements = useMemo(
    () => allocations.map((movement) => ({ ...movement, type: inferType(movement), amount: Math.abs(Number(movement.amount) || 0) })),
    [allocations]
  );

  const monthMovements = useMemo(() => movements.filter((movement) => isThisMonth(movement.date)), [movements]);
  const incomeThisMonth = monthMovements.filter((m) => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
  const expensesThisMonth = monthMovements.filter((m) => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
  const savingsTotal = movements
    .filter((m) => m.type === 'income' || normalizeCategory(m.category) === 'Savings' || m.related_budget === 'Savings')
    .reduce((sum, m) => sum + signedAmount(m), 0);
  const totalAvailable = movements.reduce((sum, movement) => sum + signedAmount(movement), 0);
  const totalBudget = Object.values(budgets).reduce((sum, limit) => sum + limit, 0);
  const spentAgainstBudget = monthMovements.filter((m) => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
  const budgetRemaining = totalBudget - spentAgainstBudget;
  const savingsRate = incomeThisMonth > 0 ? ((incomeThisMonth - expensesThisMonth) / incomeThisMonth) * 100 : 0;
  const weeklySpending = movements.filter((m) => m.type === 'expense' && isWithinDays(m.date, 7)).reduce((sum, m) => sum + m.amount, 0);
  const averageDailySpending = weeklySpending / 7;

  const budgetRows = BUDGET_CATEGORIES.map((budget) => {
    const spent = monthMovements
      .filter((m) => m.type === 'expense' && (m.related_budget === budget || normalizeCategory(m.category) === budget))
      .reduce((sum, m) => sum + m.amount, 0);
    const limit = budgets[budget];
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    const status = percent >= 100 ? 'OVERLOAD' : percent >= 80 ? 'CAUTION' : 'STABLE';
    const color = status === 'OVERLOAD' ? '#ffb4ab' : status === 'CAUTION' ? '#a178ff' : '#c3f400';
    return { budget, spent, limit, remaining: limit - spent, percent, status, color };
  });

  const topCategories = [...budgetRows]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3)
    .filter((row) => row.spent > 0);

  const recurringIncome = movements.filter((m) => m.type === 'income' && m.recurring).reduce((sum, m) => sum + m.amount, 0);
  const projectedIncome = incomeThisMonth + recurringIncome;
  const wishlistBudget = budgetRows.find((row) => row.budget === 'Wishlist');
  const wishlistAffordability = Math.max(0, Math.min(wishlistBudget?.remaining || 0, Math.max(totalAvailable, 0) * 0.18));
  const foodSpent = budgetRows.find((row) => row.budget === 'Food')?.spent || 0;
  const foodBaseline = budgets.Food * 0.32;
  const foodDelta = foodBaseline > 0 ? ((foodSpent - foodBaseline) / foodBaseline) * 100 : 0;
  const balanceTone = totalAvailable < 0 ? '#ffb4ab' : '#c3f400';

  const addMovement = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !description.trim()) return;

    const movement: FinancialMovement = {
      id: Date.now().toString(),
      amount: parsedAmount,
      description: description.trim(),
      category,
      date: new Date(`${date}T12:00:00`).toISOString(),
      type,
      account,
      related_budget: relatedBudget,
      recurring,
    };

    onAllocationsChange([movement, ...allocations]);

    // Enviar notificación a la pareja si es un ahorro (discreto)
    const isSavings = category === 'Savings' || relatedBudget === 'Savings' || account === 'savings_vault';
    if (isSavings) {
      const target = profile === 'el' ? 'ella' : 'el';
      const authorName = profile === 'el' ? 'Santiago' : 'Milena';
      const amountFormatted = formatCOP(parsedAmount);
      const alertMsg = `¡${authorName} registró un nuevo ahorro de ${amountFormatted}! 💰`;
      StoreService.addNotification(target, 'wallet', alertMsg).catch(err => {
        console.error('Failed to trigger wallet notification:', err);
      });
    }

    setAmount('');
    setDescription('');
  };

  const deleteMovement = (id: string) => {
    onAllocationsChange(allocations.filter((movement) => movement.id !== id));
  };

  const setQuickAction = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === 'income') {
      setCategory('salary');
      setRelatedBudget('');
    } else if (nextType === 'transfer') {
      setCategory('internal_transfer');
      setRelatedBudget('Savings');
    } else if (nextType === 'expense') {
      setCategory('Food');
      setRelatedBudget('Food');
    }
  };

  return (
    <div className="space-y-6 font-mono">
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
            <p className="text-[9px] font-black uppercase tracking-[0.26em]" style={{ color: balanceTone }}>Resumen General</p>
            <h3 className="mt-1 text-2xl font-black uppercase tracking-normal text-white">Estado financiero general</h3>
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

      <section className="border border-white/10 bg-black/40 p-4">
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map((quickType) => {
            const meta = TYPE_META[quickType];
            const Icon = meta.Icon;
            const active = type === quickType;
            return (
              <button
                key={quickType}
                type="button"
                onClick={() => setQuickAction(quickType)}
                className="flex items-center justify-center gap-2 border px-3 py-3 text-[9px] font-black uppercase tracking-[0.18em] transition-all hover:bg-white/5"
                style={{
                  borderColor: active ? meta.color : 'rgba(255,255,255,0.1)',
                  color: active ? meta.color : '#a88a7e',
                  backgroundColor: active ? meta.bg : 'transparent',
                }}
              >
                <Icon size={14} /> + {meta.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <BadgeDollarSign size={8} /> Monto
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00 COP"
              className="w-full border border-white/10 bg-black px-3 py-2 text-xs uppercase text-white outline-none transition-colors placeholder:text-[#594137]"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <FileText size={8} /> Descripción
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Concepto del movimiento"
              className="w-full border border-white/10 bg-black px-3 py-2 text-xs uppercase text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[var(--color-profile-accent)]"
            />
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <SlidersHorizontal size={8} /> Tipo
            </span>
            <select
              value={type}
              onChange={(e) => setQuickAction(e.target.value as TransactionType)}
              className="w-full cursor-pointer appearance-none border border-white/10 bg-black px-3 py-2 text-xs text-[#e5e2e1] outline-none"
            >
              {Object.keys(TYPE_META).map((key) => (
                <option key={key} value={key} className="bg-[#0a0a0a]">
                  {t(key)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <Target size={8} /> Categoría
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full cursor-pointer appearance-none border border-white/10 bg-black px-3 py-2 text-xs text-[#e5e2e1] outline-none"
            >
              {(type === 'income' ? INCOME_TYPES : BUDGET_CATEGORIES).map((cat) => (
                <option key={cat} value={cat} className="bg-[#0a0a0a]">
                  {t(cat)}
                </option>
              ))}
              <option value="Other" className="bg-[#0a0a0a]">Otro</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <CalendarDays size={8} /> Fecha
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-white/10 bg-black px-3 py-2 text-xs uppercase text-white outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <Wallet size={8} /> Cuenta
            </span>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value as (typeof ACCOUNTS)[number])}
              className="w-full cursor-pointer appearance-none border border-white/10 bg-black px-3 py-2 text-xs text-[#e5e2e1] outline-none"
            >
              {ACCOUNTS.map((acc) => (
                <option key={acc} value={acc} className="bg-[#0a0a0a]">
                  {t(acc)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <PiggyBank size={8} /> Presupuesto
            </span>
            <select
              value={relatedBudget}
              onChange={(e) => setRelatedBudget(e.target.value as BudgetCategory | '')}
              className="w-full cursor-pointer appearance-none border border-white/10 bg-black px-3 py-2 text-xs text-[#e5e2e1] outline-none"
            >
              <option value="" className="bg-[#0a0a0a]">ninguno</option>
              {BUDGET_CATEGORIES.map((budget) => (
                <option key={budget} value={budget} className="bg-[#0a0a0a]">
                  {t(budget)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2 lg:col-span-4">
            <button
              type="button"
              onClick={() => setRecurring(!recurring)}
              className="flex items-center justify-center gap-2 border px-3 py-3 text-[9px] font-black uppercase tracking-[0.18em] transition-colors hover:bg-white/5"
              style={{ borderColor: recurring ? accentHex : 'rgba(255,255,255,0.1)', color: recurring ? accentHex : '#a88a7e' }}
            >
              <Repeat2 size={14} /> recurrente: {recurring ? 'si' : 'no'}
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={addMovement}
              className="flex items-center justify-center gap-2 border px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90"
              style={{ borderColor: TYPE_META[type].color, backgroundColor: TYPE_META[type].color, boxShadow: `0 0 15px ${TYPE_META[type].color}33` }}
            >
              <Plus size={14} /> Registrar
            </motion.button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="border border-white/10 bg-[#0a0a0a] p-4">
          <h3 className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">
            <span className="flex items-center gap-2">
              Presupuestos de Gastos
            </span>
            <button
              type="button"
              onClick={() => setIsEditingBudgets(!isEditingBudgets)}
              className="ml-2 border border-white/10 bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#a88a7e] hover:border-white/30 hover:text-white"
              style={isEditingBudgets ? { borderColor: accentHex, color: accentHex } : undefined}
            >
              {isEditingBudgets ? 'Listo' : 'Editar Presupuestos'}
            </button>
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {budgetRows.map((row) => (
              <div key={row.budget} className="border border-white/10 bg-black/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">{t(row.budget)}</span>
                  <span className="border px-1.5 py-1 text-[7px] font-black uppercase tracking-[0.14em]" style={{ borderColor: row.color, color: row.color }}>
                    Estado: {row.status === 'OVERLOAD' ? 'LÍMITE EXCEDIDO' : row.status === 'CAUTION' ? 'ATENCIÓN' : 'ESTABLE'}
                  </span>
                </div>
                <ChunkedProgress value={row.percent} color={row.color} />
                <div className="mt-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.16em] text-[#a88a7e]">
                  <span className="flex items-center gap-1">
                    {compactCOP(row.spent)} /{' '}
                    {isEditingBudgets ? (
                      <input
                        type="number"
                        value={budgets[row.budget] ?? row.limit}
                        onChange={(e) => handleUpdateBudget(row.budget, parseFloat(e.target.value) || 0)}
                        className="w-16 bg-black border border-white/20 px-1 py-0.5 text-[8px] font-bold text-white outline-none focus:border-white/50"
                        min="0"
                      />
                    ) : (
                      <span>{compactCOP(row.limit)}</span>
                    )}
                  </span>
                  <span>{formatCOP(row.remaining)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-[#0a0a0a] p-4">
          <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">
            <CircleDollarSign className="h-4 w-4 text-user-b" />
            Ingresos
          </h3>
          <div className="grid gap-2">
            <MetricCell label="Ingreso Recurrente" value={formatCOP(recurringIncome)} tone="#c3f400" />
            <MetricCell label="Proyección de Ingresos" value={formatCOP(projectedIncome)} tone="#a178ff" />
            <MetricCell label="Comparación Mensual" value={`${savingsRate.toFixed(1)}% tasa de ahorro`} tone={savingsRate >= 0 ? '#c3f400' : '#ffb4ab'} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border border-white/10 bg-[#0a0a0a] p-4">
          <h3 className="mb-4 border-b border-white/10 pb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">
            Resumen de Hábitos
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <MetricCell label="Gasto de esta semana" value={formatCOP(weeklySpending)} tone="#ffb4ab" />
            <MetricCell label="Gasto promedio diario" value={formatCOP(averageDailySpending)} tone="#ffffff" />
            <MetricCell label="Capacidad de ahorro" value={`${savingsRate.toFixed(1)}%`} tone={savingsRate >= 0 ? '#c3f400' : '#ffb4ab'} />
            <MetricCell label="Disponible para antojos" value={formatCOP(wishlistAffordability)} tone="#a178ff" />
          </div>
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">En qué gastamos más</p>
            <div className="space-y-2">
              {(topCategories.length ? topCategories : budgetRows.slice(0, 3)).map((row) => (
                <div key={row.budget} className="flex items-center justify-between border border-white/10 bg-black/40 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em]">
                  <span>{t(row.budget)}</span>
                  <span style={{ color: row.color }}>{formatCOP(row.spent)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-[#0a0a0a] p-4">
          <h3 className="mb-4 border-b border-white/10 pb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">
            Sugerencias y Alertas
          </h3>
          <div className="space-y-2">
            <div className="border border-user-b/30 bg-user-b/5 p-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-user-b">
              Puedes destinar de forma segura {formatCOP(wishlistAffordability)} a tus antojos esta semana.
            </div>
            <div className="border border-white/10 bg-black/40 p-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-[#e1bfb2]">
              Los gastos en comida han {foodDelta >= 0 ? 'aumentado' : 'disminuido'} un {Math.abs(foodDelta).toFixed(0)}% frente al presupuesto básico de este mes.
            </div>
            <div className="border border-user-c/30 bg-user-c/5 p-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-[#d1bcff]">
              Al ritmo de gasto actual, el dinero restante alcanzará para {budgetRemaining < 0 ? '0' : Math.max(0, Math.floor(budgetRemaining / Math.max(averageDailySpending, 1)))} días de gastos.
            </div>
          </div>
        </div>
      </section>

      <section className="border border-white/10 bg-black/40 p-4">
        <h3 className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">
          <span>Historial de Movimientos</span>
          <span>{movements.length.toString().padStart(2, '0')} registros</span>
        </h3>
        <div className="max-h-96 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {movements.map((movement) => {
              const meta = TYPE_META[movement.type || 'expense'];
              const Icon = meta.Icon;
              return (
                <motion.div
                  key={movement.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative grid gap-3 border border-white/10 bg-[#0a0a0a] p-3 transition-all hover:border-white/30 md:grid-cols-[auto_1fr_auto]"
                >
                  <div className="flex h-10 w-10 items-center justify-center border" style={{ borderColor: meta.color, color: meta.color, backgroundColor: meta.bg }}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{movement.description}</span>
                      <span className="border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.14em]" style={{ borderColor: meta.color, color: meta.color }}>
                        {meta.tag}
                      </span>
                      {movement.recurring && <span className="border border-user-c/30 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-user-c">recurrente</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[7px] font-bold uppercase tracking-widest text-[#594137]">
                      <span>{t(normalizeCategory(movement.category))}</span>
                      <span>{t(movement.account || 'main_wallet')}</span>
                      <span>{t(movement.related_budget || 'no_budget')}</span>
                      <span>{new Date(movement.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <span className="text-[11px] font-black tabular-nums" style={{ color: meta.color }}>
                      {movement.type === 'expense' ? '-' : movement.type === 'income' ? '+' : ''}
                      {formatCOP(movement.amount)}
                    </span>
                    <button
                      onClick={() => deleteMovement(movement.id)}
                      className="p-1.5 text-[#594137] opacity-60 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                      aria-label="Eliminar movimiento"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
