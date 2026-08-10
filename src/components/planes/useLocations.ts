import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

export interface Ubicacion {
  id: string;
  latitud: number;
  longitud: number;
  nombre: string;
  status: 'to-visit' | 'visited';
  created_by: string;
  created_at: string;
}

export function useLocations() {
  const { confirm, success, error: notifyError } = useToast();
  const [locations, setLocations] = useState<Ubicacion[]>([]);

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

  const deleteLocation = async (id: string, onDeleteSuccess?: (id: string) => void) => {
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
      console.error('Failed to delete location:', error);
      notifyError('No se pudo eliminar el destino. Sigue en el mapa.');
      return;
    }

    if (onDeleteSuccess) {
        onDeleteSuccess(id);
    }
    fetchLocations();
    success('Destino eliminado.');
  };

  return { locations, fetchLocations, toggleStatus, deleteLocation };
}
