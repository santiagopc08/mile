import React from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Ubicacion } from './useLocations';
import { LocationInfoWindow } from './LocationInfoWindow';
import { MapController } from './MapController';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface Props {
  locations: Ubicacion[];
  selectedId: string | null;
  selectedLocation?: Ubicacion;
  mapCenter: { lat: number; lng: number };
  onSelect: (id: string | null) => void;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function PlanTrackerMap({
  locations,
  selectedId,
  selectedLocation,
  mapCenter,
  onSelect,
  onToggleStatus,
  onDelete
}: Props) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={mapCenter}
        defaultZoom={12}
        gestureHandling={'cooperative'}
        disableDefaultUI={true}
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
              onClick={() => onSelect(loc.id)}
              opacity={isVisited ? 0.4 : 1}
              title={loc.nombre}
            />
          );
        })}

        {selectedId && selectedLocation && (
          <LocationInfoWindow
            location={selectedLocation}
            onClose={() => onSelect(null)}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        )}
      </Map>
    </APIProvider>
  );
}
