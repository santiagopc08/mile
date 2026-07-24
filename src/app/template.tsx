/**
 * Template — envoltorio de transición entre rutas. App Router re-monta este
 * componente en cada navegación (a diferencia de layout.tsx), así que la
 * animación CSS `page-fade-in` corre en cada cambio de página.
 *
 * Usamos animación CSS (no framer-motion) porque en páginas pesadas —como el
 * dashboard, con suscripciones en tiempo real— la animación JS se interrumpía y
 * quedaba atascada dejando la página semi-invisible. El CSS corre una sola vez
 * al montar de forma determinista. Solo animamos opacidad para no romper los
 * fondos `fixed inset-0`. No necesita 'use client'.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    // `id`/`tabIndex` son el destino del enlace de salto ("Saltar al contenido")
    // que se muestra al primer tabulador desde el teclado.
    return (
        <div id="contenido" tabIndex={-1} className="page-transition focus:outline-none">
            {children}
        </div>
    );
}
