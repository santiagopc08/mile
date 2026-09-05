import React from 'react';
import { SlidersHorizontal, Cpu, Box, Tv, LayoutGrid } from 'lucide-react';

export type CategoryFilter = 'all' | 'cpp' | '3d' | 'retro';

interface CategoryFilterDeckProps {
  category: CategoryFilter;
  setCategory: (cat: CategoryFilter) => void;
  accentColor: string;
  viewMode: 'rack' | 'grid';
  setViewMode: (mode: 'rack' | 'grid') => void;
}

export function CategoryFilterDeck({
  category,
  setCategory,
  accentColor,
  viewMode,
  setViewMode,
}: CategoryFilterDeckProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
      {/* Chips de Categorías */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="tablist" aria-label="Filtrar por categoría">
        {[
          { id: 'all' as CategoryFilter, label: 'TODOS (14)', icon: SlidersHorizontal },
          { id: 'cpp' as CategoryFilter, label: 'C++ NATIVO (8)', icon: Cpu },
          { id: '3d' as CategoryFilter, label: '3D & FÍSICA (3)', icon: Box },
          { id: 'retro' as CategoryFilter, label: 'RETRO CLÁSICO (3)', icon: Tv },
        ].map((cat) => {
          const isSelected = category === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                isSelected
                  ? 'bg-white/15 text-white border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                  : 'bg-black/40 text-white/55 border border-white/10 hover:text-white/85 hover:bg-white/5'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: `${accentColor}80`,
                      color: '#ffffff',
                    }
                  : undefined
              }
            >
              <Icon className="w-3 h-3" style={isSelected ? { color: accentColor } : undefined} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toggles de Vista (Rack vs Grid) */}
      <div className="flex items-center justify-end gap-1.5 self-end sm:self-auto font-mono font-bold">
        <button
          type="button"
          onClick={() => setViewMode('rack')}
          aria-label="Vista de Cartuchos"
          className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] transition-all ${
            viewMode === 'rack'
              ? 'bg-white/15 text-white border-white/30'
              : 'bg-black/30 text-white/40 border-white/10 hover:text-white/70'
          }`}
        >
          <Box className="w-3 h-3" />
          <span>RACK</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          aria-label="Vista en Cuadrícula"
          className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] transition-all ${
            viewMode === 'grid'
              ? 'bg-white/15 text-white border-white/30'
              : 'bg-black/30 text-white/40 border-white/10 hover:text-white/70'
          }`}
        >
          <LayoutGrid className="w-3 h-3" />
          <span>GRILLA</span>
        </button>
      </div>
    </div>
  );
}
