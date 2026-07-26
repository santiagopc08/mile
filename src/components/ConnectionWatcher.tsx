'use client';

/**
 * ConnectionWatcher — traduce el estado de red a un aviso visible.
 *
 * Antes la única señal de "sin conexión" era un punto de 2px en la barra de
 * navegación: en una PWA que se usa en el metro o con datos flojos, el usuario
 * tocaba, no pasaba nada y no sabía por qué. Ahora al caer la conexión aparece
 * un aviso persistente (no se auto-descarta) y al volver, uno de confirmación.
 */

import { useEffect, useRef } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/components/ui/Toast';

const OFFLINE_KEY = 'connection-status';

export function ConnectionWatcher() {
    const isOnline = useOnlineStatus();
    const { toast, dismiss, success } = useToast();
    const offlineToastId = useRef<string | null>(null);
    // Evita anunciar "conexión restablecida" en el primer render, cuando nunca
    // se llegó a perder.
    const hasBeenOffline = useRef(false);

    useEffect(() => {
        if (!isOnline) {
            hasBeenOffline.current = true;
            offlineToastId.current = toast({
                title: 'Sin conexión',
                message: 'Los cambios que hagas ahora podrían no guardarse hasta que vuelvas a estar en línea.',
                variant: 'warning',
                duration: 0,
                key: OFFLINE_KEY,
            });
            return;
        }

        if (offlineToastId.current) {
            dismiss(offlineToastId.current);
            offlineToastId.current = null;
        }
        if (hasBeenOffline.current) {
            success('Conexión restablecida.', 'En línea');
        }
    }, [isOnline, toast, dismiss, success]);

    return null;
}
