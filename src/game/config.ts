import { DEFAULT_VEHICLE_CONFIG } from './config/VehicleConfig';
import { DEFAULT_TERRAIN_CONFIG } from './config/TerrainConfig';
import { DEFAULT_CAMERA_CONFIG } from './config/CameraConfig';

/**
 * Configuración centralizada del motor Hill Climb.
 * Los bloques de física, vehículo, terreno y cámara viven en ./config/*.
 */

export const GAME_CONFIG = {
    // --- Canvas de referencia ---
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,

    // --- Motor de física (Matter.js) ---
    PHYSICS: {
        GRAVITY_Y: 1.4,
        GRAVITY_X: 0,
        // La suspensión progresiva se integra con fuerzas explícitas, que sólo
        // son estables si ω·dt < 2: a 60 Hz diverge con cualquier ajuste útil.
        // 240 Hz mantiene el ritmo de conducción (646 m/90 s, frente a 681 del
        // modelo anterior); 360 Hz reduce el castañeteo a la mitad pero deja el
        // coche en ~300 m. El coste de CPU es despreciable en ambos casos
        // (0.05 ms por frame medido a 240 Hz).
        // Matter normaliza las velocidades a un delta base, así que cambiar la
        // frecuencia NO reescala las constantes del juego (verificado: la caída
        // libre de 1 s da el mismo resultado a 60 y a 360 Hz).
        TIME_STEP: 1000 / 240,        // 4 subpasos por frame a 60 FPS
        MAX_STEPS_PER_FRAME: 16,      // Tope anti espiral de la muerte
        POSITION_ITERATIONS: 10,
        VELOCITY_ITERATIONS: 10,
    },

    VEHICLE: DEFAULT_VEHICLE_CONFIG,
    CAMERA: DEFAULT_CAMERA_CONFIG,

    // --- Gravedad asimétrica en el aire (ver physics/airGravitySystem.ts) ---
    // Portado del JumpSystem del motor C++, que usa 1.0 subiendo y 2.0 cayendo.
    // Aquí la subida se deja intacta a propósito: tocarla cambiaría la altura
    // que alcanza el coche en cada rampa y con ella todo el balance del terreno,
    // que está calibrado en banco. Sólo se añade peso a la caída.
    // 2.0 en un buggy resulta brusco; 1.45 quita la sensación flotante sin que
    // el aterrizaje parezca un tirón. Es el valor que más pide banco de pruebas.
    AIR: {
        riseScale: 1.0,
        fallScale: 1.45,
        apexThreshold: 0.35,
    },

    TERRAIN: {
        ...DEFAULT_TERRAIN_CONFIG,
        RENDER_MARGIN: 1400,
    },

    // --- Combustible ---
    FUEL: {
        MAX_FUEL: 100,
        IDLE_BURN_RATE: 1.15,          // % por segundo en ralentí
        ACCEL_BURN_RATE: 2.9,          // % por segundo acelerando
        CANISTER_REFILL_AMOUNT: 42,
        // Espaciado calibrado en banco: con estos huecos el depósito baja hasta
        // ~30% entre bidones (el aviso rojo llega a saltar) pero un conductor
        // limpio no se queda tirado. Más juntos y la gasolina deja de importar.
        SPAWN_INTERVAL_MIN: 3800,
        SPAWN_INTERVAL_MAX: 6400,
        COLLECTION_RADIUS: 52,
        LOW_FUEL_THRESHOLD: 20,
    },

    // --- Monedas ---
    COINS: {
        SPAWN_CHANCE: 0.78,
        VALUE: 10,
        MIN_GAP: 420,
        MAX_GAP: 900,
        COLLECTION_RADIUS: 46,
    },

    // --- Puntuación ---
    SCORE: {
        PIXELS_PER_METER: 50,
        AIRTIME_BONUS_PER_SEC: 12,     // Monedas extra por segundo en el aire
        MIN_AIRTIME_FOR_BONUS: 0.9,
    },

    // --- Condiciones de derrota ---
    DEATH: {
        FLIP_GRACE_SECONDS: 1.4,       // Tiempo boca abajo antes de perder
        FALL_DEPTH: 1400,              // Px por debajo del suelo = caída al vacío
    },

    // --- Paleta ---
    COLORS: {
        SKY_TOP: '#170a2b',
        SKY_MID: '#4a1a54',
        SKY_LOW: '#a8365f',
        SKY_HORIZON: '#f07a4f',
        SUN: '#ffd9a0',
        MOUNTAIN_FAR: '#2a1740',
        MOUNTAIN_MID: '#371c4a',
        HILL_NEAR: '#452455',
        TERRAIN_GRASS: '#8ec63f',
        TERRAIN_GRASS_DARK: '#5b8f2a',
        TERRAIN_SOIL_TOP: '#4a3323',
        TERRAIN_SOIL_BOTTOM: '#1c1109',
        WHEEL_TIRE: '#16161c',
        WHEEL_RIM: '#d8dbe2',
        FUEL_CANISTER: '#f0453f',
        COIN: '#ffcc2f',
        COIN_DARK: '#e09b12',
    },
} as const;
