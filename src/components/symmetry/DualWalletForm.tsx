import React, { useState } from 'react';
import { BadgeDollarSign, CalendarDays, FileText, Plus, Repeat2 } from 'lucide-react';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { useProfile } from '@/context/ProfileContext';
import { NotificationService } from '@/services/notificationService';
import {
  TransactionType,
  BudgetCategory,
  FinancialMovement,
  BUDGET_CATEGORIES,
  INCOME_TYPES,
  ACCOUNTS,
  TYPE_META,
  formatCOP,
  t
} from './DualWalletShared';

export const DualWalletForm = ({
  onAllocationsChange,
  allocations
}: {
  onAllocationsChange: (newAllocations: FinancialMovement[]) => void;
  allocations: FinancialMovement[];
}) => {
  const { profile } = useProfile();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState<(typeof ACCOUNTS)[number]>('main_wallet');
  const [relatedBudget, setRelatedBudget] = useState<BudgetCategory | ''>('Food');
  const [recurring, setRecurring] = useState(false);

  const addMovement = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !description.trim()) {
      sound.playError();
      haptics.triggerError();
      return;
    }

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
    sound.playSave();
    haptics.triggerSave();

    // Enviar notificación a la pareja si es un ahorro (discreto)
    const isSavings = category === 'Savings' || relatedBudget === 'Savings' || account === 'savings_vault';
    if (isSavings) {
      const target = profile === 'el' ? 'ella' : 'el';
      const authorName = profile === 'el' ? 'Santiago' : 'Milena';
      const amountFormatted = formatCOP(parsedAmount);
      const alertMsg = `¡${authorName} registró un nuevo ahorro de ${amountFormatted}! 💰`;
      NotificationService.addNotification(target, 'wallet', alertMsg).catch(err => {
        console.error('Failed to trigger wallet notification:', err);
      });
    }

    setAmount('');
    setDescription('');
  };

  const setQuickAction = (nextType: TransactionType) => {
    setType(nextType);
    switch (nextType) {
      case 'income':
        setCategory('salary');
        setRelatedBudget('');
        break;
      case 'transfer':
        setCategory('internal_transfer');
        setRelatedBudget('Savings');
        break;
      case 'expense':
      default:
        setCategory('Food');
        setRelatedBudget('Food');
        break;
    }
  };

  return (
    <section className="border border-white/10 bg-black/40 p-4">
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-white/[0.08] brutal-border pl-[1px] pt-[1px]">
        {(['expense', 'income', 'transfer'] as TransactionType[]).map((quickType) => {
          const meta = TYPE_META[quickType];
          const active = type === quickType;
          const Icon = meta.Icon;
          return (
            <button
              key={quickType}
              type="button"
              onClick={() => {
                setQuickAction(quickType);
                sound.playTick();
                haptics.triggerTick();
              }}
              className="flex items-center justify-center gap-2 px-3 py-3 text-[9px] font-mono tracking-widest uppercase transition-all bg-[#0a0a0a] hover:bg-white/5 !min-h-0"
              style={{
                color: active ? meta.color : '#a88a7e',
                boxShadow: active ? `inset 0 -2px 0 0 ${meta.color}` : 'none',
              }}
            >
              <Icon size={14} strokeWidth={1.5} /> {meta.label}
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
            className="w-full border border-white/10 bg-black/50 px-3 py-2 text-lg font-black tracking-widest text-white transition-colors focus:border-white/30 focus:outline-none"
          />
        </label>
        <label className="space-y-1 lg:col-span-2">
          <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
            <FileText size={8} /> Concepto
          </span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Almuerzo, Uber, Salario..."
            className="w-full border border-white/10 bg-black/50 px-3 py-2 text-sm font-bold uppercase tracking-widest text-white transition-colors focus:border-white/30 focus:outline-none"
          />
        </label>
        <label className="space-y-1">
          <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
            <CalendarDays size={8} /> Fecha
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-white/10 bg-black/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors focus:border-white/30 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-white/10 bg-[#0a0a0a] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white focus:border-white/30 focus:outline-none"
        >
          {type === 'income' ? (
            INCOME_TYPES.map((cat) => (
              <option key={cat} value={cat}>
                {t(cat)}
              </option>
            ))
          ) : (
            <>
              {BUDGET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(cat)}
                </option>
              ))}
              <option value="Other">Otro / No Presupuestado</option>
            </>
          )}
        </select>
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value as (typeof ACCOUNTS)[number])}
          className="border border-white/10 bg-[#0a0a0a] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white focus:border-white/30 focus:outline-none"
        >
          {ACCOUNTS.map((acc) => (
            <option key={acc} value={acc}>
              {t(acc)}
            </option>
          ))}
        </select>
        <select
          value={relatedBudget}
          onChange={(e) => setRelatedBudget(e.target.value as BudgetCategory | '')}
          className="border border-white/10 bg-[#0a0a0a] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white focus:border-white/30 focus:outline-none"
          disabled={type === 'income'}
        >
          <option value="">-- Sin Presupuesto Asignado --</option>
          {BUDGET_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              Presupuesto: {t(cat)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <label className="flex cursor-pointer items-center gap-2">
          <div
            className={`flex h-4 w-4 items-center justify-center border transition-colors ${
              recurring ? 'border-user-c bg-user-c/20 text-user-c' : 'border-white/20 bg-black/50 text-transparent'
            }`}
          >
            <Repeat2 size={10} strokeWidth={3} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#a88a7e]">
            Movimiento Fijo / Recurrente
          </span>
          <input
            type="checkbox"
            className="hidden"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
        </label>
        <button
          onClick={addMovement}
          className="flex items-center gap-2 border bg-white px-5 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90"
          style={{ borderColor: TYPE_META[type].color, backgroundColor: TYPE_META[type].color }}
        >
          <Plus size={14} /> Registrar {t(type)}
        </button>
      </div>
    </section>
  );
};
