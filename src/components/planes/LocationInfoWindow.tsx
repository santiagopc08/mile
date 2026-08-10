import React from 'react';
import { InfoWindow } from '@vis.gl/react-google-maps';
import { Navigation, Trash2 } from 'lucide-react';
import { Ubicacion } from './useLocations';

interface Props {
  location: Ubicacion;
  onClose: () => void;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function LocationInfoWindow({ location, onClose, onToggleStatus, onDelete }: Props) {
  return (
    <InfoWindow
      position={{ lat: location.latitud, lng: location.longitud }}
      onCloseClick={onClose}
    >
      <div className="min-w-[150px] p-2 font-mono">
        <h4 className="mb-2 border-b border-stone-100 pb-1 text-[10px] font-mono font-black uppercase tracking-widest">
          {location.nombre}
        </h4>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.latitud},${location.longitud}`, '_blank')}
            className="flex h-8 items-center justify-center gap-2 bg-stone-900 p-2 text-[8px] font-mono font-bold uppercase tracking-normal text-white"
          >
            <Navigation className="w-3 h-3" /> Navegar
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onToggleStatus(location.id, location.status)}
              className="h-8 flex-1 border border-stone-200 p-2 text-[8px] font-mono font-bold uppercase"
            >
              {location.status === 'visited' ? 'Pendiente' : 'Visitado'}
            </button>
            <button
              onClick={() => onDelete(location.id)}
              className="h-8 border border-stone-200 px-2 text-red-500 flex items-center justify-center"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </InfoWindow>
  );
}
