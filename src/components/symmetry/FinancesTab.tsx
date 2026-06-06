import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DualWallet } from './DualWallet';
import { FinanceChart } from './FinanceChart';
import { BarChart3, WalletCards, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';

interface FinancesTabProps {
  profile: string;
  userAllocations: any[];
  allocationsA: any[];
  allocationsB: any[];
  totalSpent: number;
  combinedTotalSpent: number;
  handleAllocationsChange: (newAllocations: any[]) => void;
  mode: string;
  accentColorValue: string;
}

export const FinancesTab = ({
  profile,
  userAllocations,
  allocationsA,
  allocationsB,
  totalSpent,
  combinedTotalSpent,
  handleAllocationsChange,
  mode,
  accentColorValue,
}: FinancesTabProps) => {
  const [isChartOpen, setIsChartOpen] = useState(false);

  const formatPriceCompact = (v: number) => {
    if (v >= 1000000) {
      return '$ ' + (v / 1000000).toFixed(1) + 'M';
    }
    if (v >= 1000) {
      return '$ ' + Math.round(v / 1000) + 'k';
    }
    return '$ ' + v;
  };

  return (
    <motion.div
      key="finances"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 border-x border-white/10 bg-[#050505] p-3 sm:p-5 md:p-8"
    >
      {/* Finance Video Header */}
      <div className="grid gap-4 border border-white/10 bg-[#0a0a0a] p-4 md:grid-cols-[1fr_auto] md:items-center relative">
        <AnimatedBrutalistCorners color={accentColorValue} size={12} thickness={1.5} />
        <div className="w-full">
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight text-white mt-1 flex justify-between items-center w-full">
            <span>
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.24em] text-user-c">CONTROL PRESUPUESTARIO</p>Finanzas</span>
            <div className="relative h-20 w-20 border border-white/10 bg-black p-1 flex-shrink-0">
              <AnimatedBrutalistCorners color="var(--color-profile-accent)" size={6} />
              <video
                className="h-full w-full object-cover opacity-80 mix-blend-screen contrast-125"
                src="vid/financesCat.mp4"
                autoPlay
                loop
                muted
                playsInline
                webkit-playsinline="true"
              />
            </div>
          </h2>
        </div>
        <div className="grid grid-cols-3 border border-white/10 text-center bg-black/40 rounded-none shrink-0 md:min-w-[280px]">
          <div className="border-r border-white/10 px-3 py-2">
            <div className={`text-xl font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-a' : 'text-user-b'}`}>{userAllocations.length}</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mt-0.5">Registros</div>
          </div>
          <div className="border-r border-white/10 px-3 py-2">
            <div className="text-xl font-bold font-mono tracking-tighter text-user-c">{formatPriceCompact(totalSpent)}</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mt-0.5">Gastos Tuyos</div>
          </div>
          <div className="px-3 py-2">
            <div className={`text-xl font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>{formatPriceCompact(combinedTotalSpent)}</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mt-0.5">Gastado Juntos</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Financial Movement Log & Form (Always Expanded - Core Ledger) */}
        <div className="geometric-card relative border-white/10 bg-[#0a0a0a] p-6 overflow-hidden">
          <AnimatedBrutalistCorners color={accentColorValue} />
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <WalletCards size={120} style={{ color: accentColorValue }} />
          </div>
          <h2 className="mb-6 flex items-center justify-between border-b border-white/5 pb-3 text-[10px] font-mono font-black uppercase tracking-[0.22em] relative z-10" style={{ color: accentColorValue }}>
            <span>NUESTRAS FINANZAS</span>
            <span className="text-[8px] font-mono opacity-50">HISTORIAL DE MOVIMIENTOS</span>
          </h2>
          <DualWallet
            allocations={profile === 'el' ? allocationsA : allocationsB}
            onAllocationsChange={handleAllocationsChange}
          />
        </div>

        {/* Finance Chart (COLLAPSIBLE) */}
        <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
          <AnimatedBrutalistCorners color="var(--color-user-a)" size={8} thickness={1} />
          <button
            onClick={() => setIsChartOpen(!isChartOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
          >
            <span className="flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white">
              <BarChart3 size={14} className="stroke-[1.5] text-user-a" />
              DISTRIBUCIÓN Y ANÁLISIS GRÁFICO DE GASTOS
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isChartOpen ? 'Ocultar' : 'Mostrar'}</span>
              {isChartOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
            </div>
          </button>

          <AnimatePresence>
            {isChartOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10 p-6 sm:p-8"
              >
                <div className="h-64">
                  <FinanceChart
                    allocationsElla={mode === 'me' && profile === 'el' ? [] : allocationsB}
                    allocationsEl={mode === 'me' && profile === 'ella' ? [] : allocationsA}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
