import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameLoop } from '../../src/engine/core/GameLoop.js';

describe('GameLoop', () => {
  let frames;
  let now;

  beforeEach(() => {
    frames = [];
    now = 0;
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('performance', { now: () => now });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Avanza n frames de 16ms cada uno. */
  function advance(n) {
    for (let i = 0; i < n; i++) {
      const cb = frames.shift();
      if (!cb) break;
      now += 16;
      cb(now);
    }
  }

  it('llama onAlwaysUpdate en cada frame', () => {
    const onAlwaysUpdate = vi.fn();
    const loop = new GameLoop({ onAlwaysUpdate });

    loop.start();
    advance(5);

    expect(onAlwaysUpdate).toHaveBeenCalledTimes(5);
  });

  it('sigue llamando onAlwaysUpdate en pausa pero detiene la simulación', () => {
    const onAlwaysUpdate = vi.fn();
    const onUpdate = vi.fn();
    const loop = new GameLoop({ onAlwaysUpdate, onUpdate });

    loop.start();
    advance(2);
    const updatesAntes = onUpdate.mock.calls.length;

    loop.pause();
    advance(3);

    // El input debe seguir leyéndose para poder despausar.
    expect(onAlwaysUpdate.mock.calls.length).toBeGreaterThan(2);
    expect(onUpdate).toHaveBeenCalledTimes(updatesAntes);
  });

  it('no acumula loops si se llama start dos veces', () => {
    const onAlwaysUpdate = vi.fn();
    const loop = new GameLoop({ onAlwaysUpdate });

    loop.start();
    loop.start();
    advance(3);

    // Dos rAF encolados harían avanzar el juego al doble de velocidad.
    expect(onAlwaysUpdate).toHaveBeenCalledTimes(3);
  });

  it('deja de ejecutar frames tras stop', () => {
    const onAlwaysUpdate = vi.fn();
    const loop = new GameLoop({ onAlwaysUpdate });

    loop.start();
    advance(2);
    loop.stop();
    advance(5);

    expect(onAlwaysUpdate).toHaveBeenCalledTimes(2);
  });
});
