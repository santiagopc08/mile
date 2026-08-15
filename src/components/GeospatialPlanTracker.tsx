'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';

import { useLocations, Ubicacion } from './planes/useLocations';
import { PlanTrackerMap } from './planes/PlanTrackerMap';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export function GeospatialPlanTracker() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { locations, toggleStatus, deleteLocation } = useLocations();

  const selectedLocation = useMemo(() =>
    locations.find(l => l.id === selectedId),
    [locations, selectedId]
  );

  const mapCenter = useMemo(() => {
    if (locations.length === 0) return { lat: 6.2442, lng: -75.5812 };

    let sumLat = 0;
    let sumLng = 0;
    for (const l of locations) {
      sumLat += l.latitud;
      sumLng += l.longitud;
    }

    return {
      lat: sumLat / locations.length,
      lng: sumLng / locations.length
    };
  }, [locations]);

  const handleDelete = (id: string) => {
      deleteLocation(id, (deletedId) => {
          if (selectedId === deletedId) {
              setSelectedId(null);
          }
      });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3 border border-dashed border-white/10 bg-black/60 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#ff7020]" aria-hidden="true" />
          <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-[#a88a7e]">
            Mapa no disponible ahora mismo · Tus destinos siguen aquí abajo
          </p>
        </div>
        <LocationLists
          locations={locations}
          onSelect={setSelectedId}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <BrutalistPanel accentColor="#00dbe9" borderColor="rgba(255,255,255,0.1)" corners="animated" className="!bg-black p-2">
        <div className="h-[220px] w-full overflow-hidden border border-white/10 bg-[#111] md:h-[260px]">
          <PlanTrackerMap
            locations={locations}
            selectedId={selectedId}
            selectedLocation={selectedLocation}
            mapCenter={mapCenter}
            onSelect={setSelectedId}
            onToggleStatus={toggleStatus}
            onDelete={handleDelete}
          />
        </div>
      </BrutalistPanel>

      <LocationLists
        locations={locations}
        onSelect={setSelectedId}
      />
    </div>
  );
}

function LocationLists({ locations, onSelect }: {
  locations: Ubicacion[],
  onSelect: (id: string) => void
}) {
  const toVisitList = locations.filter(l => l.status === 'to-visit');
  const visitedList = locations.filter(l => l.status === 'visited');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
      <div className="space-y-4">
        <h4 className="mb-2 flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-[#a88a7e]">
          <Circle className="h-3 w-3 text-[#00dbe9]" /> Próximos Destinos
        </h4>
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-2">
            {toVisitList.map(loc => (
              <LocationListItem
                key={loc.id}
                loc={loc}
                onSelect={() => onSelect(loc.id)}
              />
            ))}
          </div>
          {toVisitList.length === 0 && (
            <div className="border border-white/10 bg-[#050505] p-4 flex items-center justify-center">
              <p className="text-center text-[8px] uppercase tracking-[0.2em] text-white/25">No hay planes pendientes</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="mb-2 flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-[#a88a7e]">
          <CheckCircle className="h-3 w-3 text-[#a100f0]" /> Planes con lugares visitados
        </h4>
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-2">
            {visitedList.map(loc => (
              <LocationListItem
                key={loc.id}
                loc={loc}
                onSelect={() => onSelect(loc.id)}
              />
            ))}
          </div>
          {visitedList.length === 0 && (
            <div className="border border-white/10 bg-[#050505] p-4 flex items-center justify-center mt-2">
              <p className="text-center text-[8px] uppercase tracking-[0.2em] text-white/25">Aún no hay memorias</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LocationListItem({ loc, onSelect }: {
  loc: Ubicacion,
  onSelect: () => void
}) {
  const isVisited = loc.status === 'visited';
  const isElla = loc.created_by === 'ella';
  const stripColor = isVisited ? 'bg-white/10' : (isElla ? 'bg-[#a100f0]' : 'bg-[#ff7020]');

  return (
    <article className="group relative flex min-h-[40px] flex-col overflow-hidden border border-white/10 bg-[#050505] hover:border-white/20 transition-colors">
      <div className={`absolute bottom-0 left-0 top-0 w-[5px] ${stripColor}`} />

      <div className="flex flex-1 flex-col pl-[12px] pr-2 py-1.5 cursor-pointer" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => { if(e.key === 'Enter') onSelect() }}>
        <span className={`w-full truncate text-[10px] font-black uppercase tracking-[0.16em] ${isVisited ? 'line-through text-white/40' : 'text-white'}`}>
          {loc.nombre}
        </span>
        <span className="font-mono text-[7px] uppercase tracking-wider text-white/35 mt-0.5">
          {loc.created_by} [{new Date(loc.created_at).toLocaleDateString()}]
        </span>
      </div>
    </article>
  );
}
