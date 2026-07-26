'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useInView — avisa cuando un elemento entra en pantalla.
 *
 * Un solo `IntersectionObserver` para toda la app en vez de uno por elemento:
 * el fondo, los recursos decorativos y los paneles pueden ser decenas de
 * suscriptores, y cada observer propio es un coste que no hace falta pagar.
 *
 * Si el navegador no trae `IntersectionObserver`, devuelve `true` de entrada.
 * Es deliberado: ante la duda, mostrar. Un fallo de detección nunca debe dejar
 * algo invisible para siempre.
 */

type Listener = (visible: boolean) => void;

const listeners = new WeakMap<Element, Listener>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver | null {
    if (sharedObserver) return sharedObserver;
    if (typeof IntersectionObserver === 'undefined') return null;

    sharedObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                listeners.get(entry.target)?.(entry.isIntersecting);
            }
        },
        // Un pelín antes del borde inferior: el elemento termina de entrar
        // justo cuando el ojo llega, no después.
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    return sharedObserver;
}

interface UseInViewOptions {
    /** Deja de observar tras la primera aparición (revelados de una sola vez). */
    once?: boolean;
}

export function useInView<T extends Element>({ once = false }: UseInViewOptions = {}) {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = getSharedObserver();
        if (!observer) {
            // Fallback de una sola vez para navegadores sin IntersectionObserver:
            // sincroniza con una capacidad del DOM, no encadena renders.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInView(true);
            return;
        }

        listeners.set(el, (visible) => {
            setInView(visible);
            if (visible && once) {
                observer.unobserve(el);
                listeners.delete(el);
            }
        });

        observer.observe(el);

        return () => {
            observer.unobserve(el);
            listeners.delete(el);
        };
    }, [once]);

    return { ref, inView };
}
