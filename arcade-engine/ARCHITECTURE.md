# arcade-engine — mapa del repositorio

Este paquete contiene **dos árboles paralelos**. Se conservan a propósito, pero
sólo uno se ejecuta. Confundirlos ya costó un refactor que dejó el juego inerte,
así que la frontera queda escrita aquí.

## Árbol vivo — lo que corre en el navegador

Entry point: `index.html` → `src/index.jsx` → `src/App.jsx`

```
src/engine/      ArcadeEngine, ECS (World/System/Query), loop, render, input, escenas
src/components/  Componentes compartidos (Transform, Sprite, Collider)
src/systems/     Sistemas compartidos (Movement, Collision, Render)
src/pacman/      El juego que realmente se carga (PacmanPlugin)
src/demo/        Demo técnica
src/ui/          HUD y pausa
```

Son ~79 archivos de 490. Todo cambio que deba verse en pantalla ocurre aquí.

## Árbol laboratorio — no se ejecuta

Entry point: `src/index.js` (barrel). **Nadie lo importa.**

```
src/sdk/          SDK alternativo (actors, behavior, cognition, navigation, tilemap…)
src/apps/         10 juegos escritos contra el SDK (pacman, tetris, asteroids…)
src/platform/     Capa de plataforma del SDK
src/persistence/  Persistencia del SDK
src/diagnostics/  Diagnóstico del SDK
src/validation/   Escenarios de validación
src/developer/    Herramientas de desarrollo
src/release/      Empaquetado
```

### Cuidado: nombres duplicados con semántica distinta

Existen dos módulos `PacmanEvents.js` con claves **incompatibles**:

| | `src/pacman/PacmanEvents.js` (vivo) | `src/apps/pacman/PacmanEvents.js` (lab) |
|---|---|---|
| comer pellet | `PELLET_COLLECTED` | `PELLET_CONSUMED` |
| comer fantasma | `GHOST_KILLED` | `GHOST_CAPTURED` |
| perder vida | `PACMAN_KILLED` | `LIFE_LOST` |

Lo mismo aplica a `PacmanComponents`, `PacmanWorld` y `PacmanActors`. Al copiar
código entre árboles, verificá de qué módulo viene cada import.

## Medir la frontera

```bash
node scripts/reachability.mjs --list
```

Recorre el grafo de imports desde ambos entry points y reporta los huérfanos.
Si un archivo del árbol vivo aparece como huérfano, es que se escribió pero
nunca se cableó — exactamente lo que pasó con `PacmanBootstrap`, `PacmanGame`,
`PacmanRegistry`, `BootstrapSystem`, `CameraSystem` y `MapSystem`, que siguen
sin conectarse mientras `PacmanPlugin` continúa siendo el camino real.

## Trampas de este código

Ambas fallan **en silencio**, sin excepción ni log:

1. **Tablas congeladas.** `Object.freeze({...})` no protege contra leer una
   clave que no existe: devuelve `undefined`. En aritmética se propaga como
   `NaN`; en `EventBus` todos los emits con clave `undefined` caen en el mismo
   canal y los handlers reciben payloads ajenos.
   Guard: `tests/pacman/ConfigIntegrity.test.js`.

2. **`world.engine`.** Varios sistemas empiezan con
   `if (!this.world || !this.world.engine) return;`. Si falta la referencia, el
   juego arranca, renderiza y no hace nada. Por eso `World` la recibe en el
   constructor (`new World(engine)`) en vez de por asignación externa.
   Guard: `tests/pacman/PacmanGameplay.test.js`.

## Comandos

```bash
npm run dev     # dev server en :5173 (mile usa :3000)
npm test        # suite de vitest
npm run build   # build de producción
```
