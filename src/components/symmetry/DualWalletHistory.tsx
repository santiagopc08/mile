import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { FinancialMovement, TYPE_META, normalizeCategory, formatCOP, t } from './DualWalletShared';

export const DualWalletHistory = ({
  movements,
  deleteMovement,
}: {
  movements: FinancialMovement[];
  deleteMovement: (id: string) => void;
}) => {
  return (
    <section className="border border-white/10 bg-black/40 p-4">
      <h3 className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-[#a88a7e]">
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
                className="group relative border border-white/10 bg-[#0a0a0a] p-0 transition-all hover:border-white/30"
              >
                {/* Lateral type stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: meta.color }} />

                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pl-6 pr-3 py-3 w-full">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border !min-h-0" style={{ borderColor: meta.color, color: meta.color, backgroundColor: meta.bg }}>
                    <Icon size={14} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-white">{movement.description}</span>
                      <span className="border px-1.5 py-0.5 text-[7px] font-mono tracking-widest uppercase" style={{ borderColor: meta.color, color: meta.color }}>
                        {meta.tag}
                      </span>
                      {movement.recurring && <span className="border border-user-c/30 px-1.5 py-0.5 text-[7px] font-mono tracking-widest uppercase text-user-c">recurrente</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[7px] font-mono tracking-widest uppercase text-[#594137]">
                      <span>{t(normalizeCategory(movement.category))}</span>
                      <span>{t(movement.account || 'main_wallet')}</span>
                      <span>{t(movement.related_budget || 'no_budget')}</span>
                      <span>{new Date(movement.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 w-full md:w-auto md:justify-end shrink-0">
                    <span className="text-[11px] font-mono font-black tracking-tighter tabular-nums" style={{ color: meta.color }}>
                      {movement.type === 'expense' ? '-' : movement.type === 'income' ? '+' : ''}
                      {formatCOP(movement.amount)}
                    </span>
                    <button
                      onClick={() => deleteMovement(movement.id)}
                      className="p-1 text-[#594137] opacity-60 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100 !min-h-0"
                      aria-label="Eliminar movimiento"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};
