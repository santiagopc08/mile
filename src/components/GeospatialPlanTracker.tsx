'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { supabase } from '@/lib/supabase';
import { Navigation, Trash2, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';
import { useToast } from '@/components/ui/Toast';

interface Ubicacion {
  id: string;
  latitud: number;
  longitud: number;
  nombre: string;
  status: 'to-visit' | 'visited';
  created_by: string;
  created_at: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const MapController = ({ selectedLocation }: { selectedLocation?: Ubicacion }) => {
  const map = useMap();
  useEffect(() => {
    if (map && selectedLocation) {
      map.panTo({ lat: selectedLocation.latitud, lng: selectedLocation.longitud });
      map.setZoom(16);
    }
  }, [map, selectedLocation]);
  return null;
};

export function GeospatialPlanTracker() {
  const { confirm, success, error: notifyError } = useToast();
  const [locations, setLocations] = useState<Ubicacion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    const query = supabase.from('ubicaciones').select('*');

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      setLocations(data.map(loc => ({
        ...loc,
        latitud: Number(loc.latitud),
        longitud: Number(loc.longitud)
      })));
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Handle external refresh events (e.g., from WishlistModule)
  useEffect(() => {
    const handleRefresh = () => fetchLocations();
    window.addEventListener('custom:map-refresh', handleRefresh);
    return () => window.removeEventListener('custom:map-refresh', handleRefresh);
  }, [fetchLocations]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'to-visit' ? 'visited' : 'to-visit';
    const { error } = await supabase
      .from('ubicaciones')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) fetchLocations();
  };

  const deleteLocation = async (id: string) => {
    const target = locations.find(l => l.id === id);
    const ok = await confirm({
      title: 'Eliminar destino',
      message: `"${target?.nombre ?? 'Este punto'}" desaparecerá del mapa para los dos.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;

    const { error } = await supabase.from('ubicaciones').delete().eq('id', id);
    if (error) {
      // Antes esto no hacía absolutamente nada: el punto seguía en el mapa sin
      // ninguna explicación y parecía que el botón estaba roto.
      console.error('Failed to delete location:', error);
      notifyError('No se pudo eliminar el destino. Sigue en el mapa.');
      return;
    }
    if (selectedId === id) setSelectedId(null);
    fetchLocations();
    success('Destino eliminado.');
  };

  const selectedLocation = useMemo(() =>
    locations.find(l => l.id === selectedId),
    [locations, selectedId]
  );

  // Calculate map center from locations or default to Bogotá
  const mapCenter = useMemo(() => {
    if (locations.length === 0) return { lat: 6.2442, lng: -75.5812 };

    // ⚡ Bolt Optimization: Replace double reduce with a single O(N) pass to avoid redundant iteration
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

  if (!GOOGLE_MAPS_API_KEY) {
    // Antes este bloque ocupaba 300px+ y le pedía al usuario final que editara
    // un `.env.local`: una instrucción de desarrollo, en la que no puede hacer
    // nada, tapando el contenido que sí le sirve. Ahora es una franja discreta
    // y los destinos —lo útil— suben al primer plano.
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
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={12}
              gestureHandling={'cooperative'}
              disableDefaultUI={true}
              // Paleta oscura: el estilo anterior era claro (#f5f5f4) y dejaba un
              // rectángulo casi blanco incrustado en una app negra, deslumbrando
              // de noche —que es cuando se planean las salidas—. Estos tonos salen
              // de las superficies de design.md.
              styles={[
                { elementType: 'geometry', stylers: [{ color: '#0f0b11' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#a88a7e' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#060409' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e1720' }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6f5f66' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050409' }] },
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#141a12' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2b2130' }] },
              ]}
            >
              <MapController selectedLocation={selectedLocation} />

              {locations.map((loc) => {
                const isVisited = loc.status === 'visited';
                return (
                  <Marker
                    key={loc.id}
                    position={{ lat: loc.latitud, lng: loc.longitud }}
                    onClick={() => setSelectedId(loc.id)}
                    opacity={isVisited ? 0.4 : 1}
                    title={loc.nombre}
                  />
                );
              })}

              {selectedId && selectedLocation && (
                <InfoWindow
                  position={{ lat: selectedLocation.latitud, lng: selectedLocation.longitud }}
                  onCloseClick={() => setSelectedId(null)}
                >
                  <div className="min-w-[150px] p-2 font-mono">
                    <h4 className="mb-2 border-b border-stone-100 pb-1 text-[10px] font-mono font-black uppercase tracking-widest">
                      {selectedLocation.nombre}
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitud},${selectedLocation.longitud}`, '_blank')}
                        className="flex h-8 items-center justify-center gap-2 bg-stone-900 p-2 text-[8px] font-mono font-bold uppercase tracking-normal text-white"
                      >
                        <Navigation className="w-3 h-3" /> Navegar
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleStatus(selectedLocation.id, selectedLocation.status)}
                          className="h-8 flex-1 border border-stone-200 p-2 text-[8px] font-mono font-bold uppercase"
                        >
                          {selectedLocation.status === 'visited' ? 'Pendiente' : 'Visitado'}
                        </button>
                        <button
                          onClick={() => deleteLocation(selectedLocation.id)}
                          className="h-8 border border-stone-200 px-2 text-red-500 flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
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
