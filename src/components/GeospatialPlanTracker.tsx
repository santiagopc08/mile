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
        <div className="p-8 border border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center gap-4 bg-stone-50 dark:bg-stone-950 min-h-[300px]">
          <AlertTriangle className="w-8 h-8 text-stone-400" />
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-400 text-center">
            API Key de Google Maps no configurada
          </p>
          <p className="text-[8px] uppercase tracking-widest text-stone-400 text-center max-w-xs">
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
      <div className="relative p-2 border border-stone-200 dark:border-stone-800 bg-mosaic shadow-sm">
        <div className="h-[400px] md:h-[500px] w-full border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-100 dark:bg-stone-900">
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
                  <div className="p-2 min-w-[150px]">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-stone-100 pb-1">
                      {selectedLocation.nombre}
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitud},${selectedLocation.longitud}`, '_blank')}
                        className="flex items-center justify-center gap-2 bg-stone-900 text-white p-2 text-[8px] uppercase font-bold tracking-tighter h-8"
                      >
                        <Navigation className="w-3 h-3" /> Navegar
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleStatus(selectedLocation.id, selectedLocation.status)}
                          className="flex-1 border border-stone-200 p-2 text-[8px] uppercase font-bold h-8"
                        >
                          {selectedLocation.status === 'visited' ? 'Pendiente' : 'Visitado'}
                        </button>
                        <button
                          onClick={() => deleteLocation(selectedLocation.id)}
                          className="px-2 border border-stone-200 text-red-500 h-8"
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-stone-400 mb-2 flex items-center gap-2">
          <Circle className="w-3 h-3 text-geometric-accent" /> Próximos Destinos
        </h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {locations.filter(l => l.status === 'to-visit').map(loc => (
            <LocationListItem
              key={loc.id}
              loc={loc}
              onSelect={() => onSelect(loc.id)}
              onDelete={() => onDelete(loc.id)}
              onToggle={() => onToggle(loc.id, loc.status)}
            />
          ))}
          {locations.filter(l => l.status === 'to-visit').length === 0 && (
            <p className="text-[8px] uppercase opacity-30 italic p-4 border border-dashed border-stone-200 text-center">No hay planes pendientes</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-stone-400 mb-2 flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-stone-300" /> Memorias Visitadas
        </h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {locations.filter(l => l.status === 'visited').map(loc => (
            <LocationListItem
              key={loc.id}
              loc={loc}
              onSelect={() => onSelect(loc.id)}
              onDelete={() => onDelete(loc.id)}
              onToggle={() => onToggle(loc.id, loc.status)}
            />
          ))}
          {locations.filter(l => l.status === 'visited').length === 0 && (
            <p className="text-[8px] uppercase opacity-30 italic p-4 border border-dashed border-stone-200 text-center">Aún no hay memorias</p>
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
    <div className={`flex items-center gap-3 p-4 bg-white dark:bg-black border transition-all min-h-[56px] ${
      isVisited ? 'border-stone-100 dark:border-stone-900 opacity-60' : `border-dashed ${accentColor}`
    }`}>
      <button
        onClick={onSelect}
        className="flex-1 flex flex-col items-start min-w-0"
      >
        <span className={`text-[11px] font-black uppercase tracking-widest truncate w-full text-left ${isVisited ? 'line-through opacity-50' : 'text-stone-800 dark:text-stone-100'}`}>
          {loc.nombre}
        </span>
        <span className="text-[8px] font-mono opacity-40 uppercase tracking-tighter">
          {loc.created_by} • {new Date(loc.created_at).toLocaleDateString()}
        </span>
      </button>

      <div className="flex gap-4 shrink-0">
        <button onClick={onToggle} className="text-stone-300 hover:text-geometric-accent transition-colors">
          {isVisited ? <Circle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        </button>
        <button onClick={onDelete} className="text-stone-200 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
