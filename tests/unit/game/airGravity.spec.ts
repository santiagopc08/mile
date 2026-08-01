import { test, expect } from '@playwright/test';
import { airGravityMultiplier, type AirGravityConfig } from '../../../src/game/physics/airGravitySystem';
import { GAME_CONFIG } from '../../../src/game/config';

/**
 * Gravedad asimétrica en el aire, portada del JumpSystem del motor C++.
 *
 * Convenio de Matter.js: Y crece hacia abajo, así que negativo es subir y
 * positivo es caer. Es el signo contrario al del C++, y equivocarlo produce un
 * coche que flota al caer y se desploma al subir sin que nada falle ni avise.
 */

const cfg: AirGravityConfig = {
    riseScale: 1.0,
    fallScale: 1.45,
    apexThreshold: 0.35,
};

test.describe('airGravityMultiplier', () => {
    test('cayendo pesa más que subiendo', () => {
        const subiendo = airGravityMultiplier(-5, cfg);
        const cayendo = airGravityMultiplier(5, cfg);

        expect(cayendo).toBeGreaterThan(subiendo);
        expect(cayendo).toBe(cfg.fallScale);
        expect(subiendo).toBe(cfg.riseScale);
    });

    test('respeta el signo de Matter: negativo sube, positivo cae', () => {
        // Si alguien porta el signo del C++ tal cual, este test lo caza.
        expect(airGravityMultiplier(-10, cfg)).toBe(cfg.riseScale);
        expect(airGravityMultiplier(10, cfg)).toBe(cfg.fallScale);
    });

    test('deja la gravedad nominal en el vértice', () => {
        // Banda muerta arriba del salto: el "apex hang" que da tiempo a colocar
        // el coche antes de caer.
        expect(airGravityMultiplier(0, cfg)).toBe(1);
        expect(airGravityMultiplier(cfg.apexThreshold * 0.5, cfg)).toBe(1);
        expect(airGravityMultiplier(-cfg.apexThreshold * 0.5, cfg)).toBe(1);
    });

    test('sale de la banda muerta justo pasado el umbral', () => {
        expect(airGravityMultiplier(cfg.apexThreshold + 0.01, cfg)).toBe(cfg.fallScale);
        expect(airGravityMultiplier(-cfg.apexThreshold - 0.01, cfg)).toBe(cfg.riseScale);
    });

    test('con escalas a 1 no altera nada', () => {
        const neutro: AirGravityConfig = { riseScale: 1, fallScale: 1, apexThreshold: 0.35 };
        for (const v of [-20, -1, 0, 1, 20]) {
            expect(airGravityMultiplier(v, neutro)).toBe(1);
        }
    });
});

test.describe('configuración enviada', () => {
    test('sólo añade peso a la caída, sin tocar la subida', () => {
        // Cambiar la subida alteraría la altura que alcanza el coche en cada
        // rampa, y con ella el balance del terreno, que está calibrado en banco.
        expect(GAME_CONFIG.AIR.riseScale).toBe(1.0);
        expect(GAME_CONFIG.AIR.fallScale).toBeGreaterThan(1.0);
    });

    test('se queda por debajo del 2.0 del platformer C++', () => {
        // 2.0 está pensado para un personaje ligero; en un buggy se siente como
        // un tirón. Este techo documenta la decisión para quien lo retoque.
        expect(GAME_CONFIG.AIR.fallScale).toBeLessThan(2.0);
    });

    test('la banda muerta del vértice es positiva y pequeña', () => {
        expect(GAME_CONFIG.AIR.apexThreshold).toBeGreaterThan(0);
        expect(GAME_CONFIG.AIR.apexThreshold).toBeLessThan(1);
    });
});
