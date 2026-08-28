/**
 * Paleta canónica de perfil — fuente única de verdad para los acentos de color.
 *
 * Antes cada fondo definía su propia rampa a ojo (`GeometricBackground` usaba
 * `#89D94A`/`#FF4F9A`, `InteractiveBackground` los tokens reales), así que el
 * verde y el rosa cambiaban de tono al navegar. Los `primary` de aquí son los
 * mismos de `design.md` y de `--color-user-a` / `--color-user-b` en globals.css:
 * si cambian ahí, cambian aquí.
 */

export type ProfileKey = 'el' | 'ella';

export interface ProfilePalette {
    /** Acento del perfil. Trazos protagonistas, nodos, texto de acento. */
    primary: string;
    /** Un paso por debajo. Trazos secundarios y líneas de soporte. */
    secondary: string;
    /** Un paso por encima. Rellenos de nodo, remates, brillos puntuales. */
    highlight: string;
    /** Extremo oscuro. Rellenos de bloque y líneas fantasma sobre negro. */
    shadow: string;
    /** Resplandor ambiental (radial-gradient, box-shadow). */
    glow: string;
    /** Líneas de retícula y bordes discontinuos. */
    line: string;
}

export const PROFILE_PALETTE: Record<ProfileKey, ProfilePalette> = {
    el: {
        primary: '#c3f400',
        secondary: '#9bc200',
        highlight: '#e2ff6b',
        shadow: '#3f4f00',
        glow: 'rgba(195, 244, 0, 0.25)',
        line: 'rgba(195, 244, 0, 0.18)',
    },
    ella: {
        primary: '#ff4b89',
        secondary: '#d43a70',
        highlight: '#ff9dc0',
        shadow: '#58152f',
        glow: 'rgba(255, 75, 137, 0.25)',
        line: 'rgba(255, 75, 137, 0.18)',
    },
};

/** Terciario (Sintonía) — estados compartidos, foco, 404. */
export const TERTIARY = '#a178ff';

/** Sin perfil activo: gris técnico de alto contraste. */
export const NEUTRAL_PALETTE: ProfilePalette = {
    primary: 'rgba(255, 255, 255, 0.4)',
    secondary: 'rgba(255, 255, 255, 0.2)',
    highlight: 'rgba(255, 255, 255, 0.6)',
    shadow: 'rgba(255, 255, 255, 0.1)',
    glow: 'rgba(255, 255, 255, 0.1)',
    line: 'rgba(255, 255, 255, 0.12)',
};

/**
 * Variante apagada del neutro, para capas de fondo que quedan detrás de un
 * formulario (login) y no deben competir con él.
 */
export const NEUTRAL_PALETTE_SOFT: ProfilePalette = {
    primary: 'rgba(255, 255, 255, 0.15)',
    secondary: 'rgba(255, 255, 255, 0.1)',
    highlight: 'rgba(255, 255, 255, 0.25)',
    shadow: 'rgba(255, 255, 255, 0.05)',
    glow: 'rgba(255, 255, 255, 0.06)',
    line: 'rgba(255, 255, 255, 0.08)',
};

export function getProfilePalette(
    profile: ProfileKey | null | undefined,
    fallback: ProfilePalette = NEUTRAL_PALETTE
): ProfilePalette {
    return (profile && profile in PROFILE_PALETTE) ? PROFILE_PALETTE[profile as ProfileKey] : fallback;
}
