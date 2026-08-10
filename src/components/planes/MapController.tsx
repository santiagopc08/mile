import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { Ubicacion } from './useLocations';

export const MapController = ({ selectedLocation }: { selectedLocation?: Ubicacion }) => {
  const map = useMap();
  useEffect(() => {
    if (map && selectedLocation) {
      map.panTo({ lat: selectedLocation.latitud, lng: selectedLocation.longitud });
      map.setZoom(16);
    }
  }, [map, selectedLocation]);
  return null;
};
