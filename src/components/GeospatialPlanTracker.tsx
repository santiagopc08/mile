'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/context/ProfileContext';
import { useVisibility } from '@/context/VisibilityContext';
import { Navigation, Trash2, Plus, CheckCircle, Circle, MapPin } from 'lucide-react';

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
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCoords, setNewCoords] = useState<{ lat: number, lng: number } | null>(null);

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

  const handleMapClick = (e: any) => {
    if (isAdding) {
      setNewCoords({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
    }
  };

  const handleSaveLocation = async () => {
    if (!newName || !newCoords || !profile) return;

    const { error } = await supabase.from('ubicaciones').insert({
      nombre: newName,
      latitud: newCoords.lat,
      longitud: newCoords.lng,
      created_by: profile,
      status: 'to-visit'
    });

    if (!error) {
      setNewName('');
      setNewCoords(null);
      setIsAdding(false);
      fetchLocations();
    }
  };

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

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter italic text-geometric-accent">Mapa de Planes</h3>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setNewCoords(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 border text-[10px] uppercase font-bold tracking-widest transition-all ${
            isAdding ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-black border-stone-200 dark:border-stone-800'
          }`}
        >
          {isAdding ? 'Cancelar' : <><Plus className="w-3 h-3" /> Agregar Punto</>}
        </button>
      </div>

      {isAdding && !newCoords && (
        <div className="p-4 border border-dashed border-geometric-accent bg-rose-50/30 dark:bg-rose-950/10 text-center">
          <p className="text-[10px] uppercase font-black tracking-widest text-geometric-accent">
            Toca el mapa para marcar la ubicación
          </p>
        </div>
      )}

      {newCoords && (
        <div className="p-4 border border-geometric-accent bg-white dark:bg-black space-y-4">
          <input
            type="text"
            placeholder="NOMBRE DEL LUGAR"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-geometric-accent h-11"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveLocation}
              disabled={!newName.trim()}
              className="flex-1 bg-geometric-accent text-white p-3 text-[10px] uppercase font-black tracking-widest disabled:opacity-50"
            >
              Guardar Destino
            </button>
            <button
              onClick={() => setNewCoords(null)}
              className="px-6 border border-stone-200 dark:border-stone-800 text-[10px] uppercase font-bold tracking-widest h-11"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* The Geometric Frame */}
      <div className="relative p-2 border border-stone-200 dark:border-stone-800 bg-mosaic shadow-sm">
        <div className="h-[400px] md:h-[500px] w-full border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-100 dark:bg-stone-900">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultCenter={{ lat: 4.6097, lng: -74.0817 }}
              defaultZoom={12}
              mapId="PLANES_MAP_ID"
              onClick={handleMapClick}
              gestureHandling={'cooperative'}
              disableDefaultUI={true}
            >
              <MapController selectedLocation={selectedLocation} />

              {locations.map((loc) => (
                <MarkerWithInfo
                  key={loc.id}
                  loc={loc}
                  onClick={() => setSelectedId(loc.id)}
                />
              ))}

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

      {/* Quick List */}
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
                onSelect={() => setSelectedId(loc.id)}
                onDelete={() => deleteLocation(loc.id)}
                onToggle={() => toggleStatus(loc.id, loc.status)}
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
                onSelect={() => setSelectedId(loc.id)}
                onDelete={() => deleteLocation(loc.id)}
                onToggle={() => toggleStatus(loc.id, loc.status)}
              />
            ))}
            {locations.filter(l => l.status === 'visited').length === 0 && (
              <p className="text-[8px] uppercase opacity-30 italic p-4 border border-dashed border-stone-200 text-center">Aún no hay memorias</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkerWithInfo({ loc, onClick }: { loc: Ubicacion, onClick: () => void }) {
  const isVisited = loc.status === 'visited';
  const userColor = loc.created_by === 'ella' ? '#A855F7' : '#F97316';

  return (
    <AdvancedMarker
      position={{ lat: loc.latitud, lng: loc.longitud }}
      onClick={onClick}
    >
      <div style={{ opacity: isVisited ? 0.4 : 1 }} className="transition-opacity duration-300">
        <Pin
          background={isVisited ? '#D6D3D1' : userColor}
          borderColor={isVisited ? '#A8A29E' : 'white'}
          glyphColor={isVisited ? '#78716C' : 'white'}
          scale={isVisited ? 0.8 : 1.1}
        />
      </div>
    </AdvancedMarker>
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
