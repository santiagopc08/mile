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
import { useProfile } from '@/context/ProfileContext';
import { useVisibility } from '@/context/VisibilityContext';
import { Navigation, Trash2, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';

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
  const { profile } = useProfile();
  const { mode } = useVisibility();
  const [locations, setLocations] = useState<Ubicacion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    let query = supabase.from('ubicaciones').select('*');

    if (mode === 'me' && profile) {
      query = query.eq('created_by', profile);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      setLocations(data.map(loc => ({
        ...loc,
        latitud: Number(loc.latitud),
        longitud: Number(loc.longitud)
      })));
    }
  }, [mode, profile]);

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
    const { error } = await supabase.from('ubicaciones').delete().eq('id', id);
    if (!error) {
      if (selectedId === id) setSelectedId(null);
      fetchLocations();
    }
  };

  const selectedLocation = useMemo(() =>
    locations.find(l => l.id === selectedId),
    [locations, selectedId]
  );

  // Calculate map center from locations or default to Bogotá
  const mapCenter = useMemo(() => {
    if (locations.length === 0) return { lat: 6.2442, lng: -75.5812 };
    const avgLat = locations.reduce((sum, l) => sum + l.latitud, 0) / locations.length;
    const avgLng = locations.reduce((sum, l) => sum + l.longitud, 0) / locations.length;
    return { lat: avgLat, lng: avgLng };
  }, [locations]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full space-y-6">
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 border border-dashed border-white/10 bg-black/60 p-8">
          <AlertTriangle className="h-8 w-8 text-[#ff7020]" />
          <p className="text-center text-[10px] font-black uppercase tracking-[0.24em] text-[#a88a7e]">
            API Key de Google Maps no configurada
          </p>
          <p className="max-w-xs text-center text-[8px] uppercase tracking-[0.2em] text-white/35">
            Agrega NEXT_PUBLIC_GOOGLE_MAPS_API_KEY a tu archivo .env.local para habilitar el mapa
          </p>
        </div>
        <LocationLists
          locations={locations}
          onSelect={setSelectedId}
          onDelete={deleteLocation}
          onToggle={toggleStatus}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="relative border border-white/10 bg-black p-2">
        <AnimatedBrutalistCorners color="#00dbe9" />
        <div className="h-[400px] w-full overflow-hidden border border-white/10 bg-[#111] md:h-[500px]">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={12}
              gestureHandling={'cooperative'}
              disableDefaultUI={true}
              styles={[
                { elementType: 'geometry', stylers: [{ color: '#f5f5f4' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#78716c' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e7e5e4' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d6d3d1' }] },
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
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
                  <div className="min-w-[150px] p-2">
                    <h4 className="mb-2 border-b border-stone-100 pb-1 text-[10px] font-black uppercase tracking-widest">
                      {selectedLocation.nombre}
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitud},${selectedLocation.longitud}`, '_blank')}
                        className="flex h-8 items-center justify-center gap-2 bg-stone-900 p-2 text-[8px] font-bold uppercase tracking-normal text-white"
                      >
                        <Navigation className="w-3 h-3" /> Navegar
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleStatus(selectedLocation.id, selectedLocation.status)}
                          className="h-8 flex-1 border border-stone-200 p-2 text-[8px] font-bold uppercase"
                        >
                          {selectedLocation.status === 'visited' ? 'Pendiente' : 'Visitado'}
                        </button>
                        <button
                          onClick={() => deleteLocation(selectedLocation.id)}
                          className="h-8 border border-stone-200 px-2 text-red-500"
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
      </div>

      <LocationLists
        locations={locations}
        onSelect={setSelectedId}
        onDelete={deleteLocation}
        onToggle={toggleStatus}
      />
    </div>
  );
}

function LocationLists({ locations, onSelect, onDelete, onToggle }: {
  locations: Ubicacion[],
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
  onToggle: (id: string, status: string) => void
}) {
  const toVisitList = locations.filter(l => l.status === 'to-visit');
  const visitedList = locations.filter(l => l.status === 'visited');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h4 className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#a88a7e]">
          <Circle className="h-3 w-3 text-[#00dbe9]" /> Próximos Destinos
        </h4>
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {toVisitList.map(loc => (
              <LocationListItem
                key={loc.id}
                loc={loc}
                onSelect={() => onSelect(loc.id)}
                onDelete={() => onDelete(loc.id)}
                onToggle={() => onToggle(loc.id, loc.status)}
              />
            ))}
          </div>
          {toVisitList.length === 0 && (
            <p className="border border-dashed border-white/10 p-4 text-center text-[8px] uppercase italic tracking-[0.2em] text-white/25">No hay planes pendientes</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#a88a7e]">
          <CheckCircle className="h-3 w-3 text-[#a100f0]" /> Memorias Visitadas
        </h4>
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visitedList.map(loc => (
              <LocationListItem
                key={loc.id}
                loc={loc}
                onSelect={() => onSelect(loc.id)}
                onDelete={() => onDelete(loc.id)}
                onToggle={() => onToggle(loc.id, loc.status)}
              />
            ))}
          </div>
          {visitedList.length === 0 && (
            <p className="border border-dashed border-white/10 p-4 text-center text-[8px] uppercase italic tracking-[0.2em] text-white/25">Aún no hay memorias</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LocationListItem({ loc, onSelect, onDelete, onToggle }: {
  loc: Ubicacion,
  onSelect: () => void,
  onDelete: () => void,
  onToggle: () => void
}) {
  const isVisited = loc.status === 'visited';
  const accentColor = loc.created_by === 'ella' ? 'border-user-b' : 'border-user-a';

  return (
    <div className={`flex min-h-[56px] items-center gap-3 border bg-black/65 p-4 transition-all hover:bg-white/[0.04] ${
      isVisited ? 'border-white/10 opacity-60' : `border-dashed ${accentColor}`
    }`}>
      <button
        onClick={onSelect}
        className="flex min-w-0 flex-1 flex-col items-start"
      >
        <span className={`w-full truncate text-left text-[11px] font-black uppercase tracking-[0.18em] ${isVisited ? 'line-through opacity-50' : 'text-white'}`}>
          {loc.nombre}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-normal text-white/35">
          {loc.created_by} • {new Date(loc.created_at).toLocaleDateString()}
        </span>
      </button>

      <div className="flex gap-4 shrink-0">
        <button onClick={onToggle} className="text-[#a88a7e] transition-colors hover:text-[#00dbe9]">
          {isVisited ? <Circle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        </button>
        <button onClick={onDelete} className="text-[#a88a7e] transition-colors hover:text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
