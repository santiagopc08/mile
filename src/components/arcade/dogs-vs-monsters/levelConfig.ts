import { LevelConfig } from './types';

export const LEVEL_CONFIGS: LevelConfig[] = [
    {
        levelNumber: 1,
        title: 'NIVEL 1 · EL JARDÍN SOLEADO ☀️',
        subtitle: 'Aprende a cultivar Croquetas Doradas con Miel y defiende el patio con Kiaro.',
        backgroundTheme: 'day',
        startingCroquetas: 150,
        availableDogs: ['miel', 'kiaro'],
        duration: 90,
        rewardDescription: '¡Desbloqueado: Sam el Tanque Blindado! 🛡️',
        waves: [
            {
                time: 10,
                enemies: [{ type: 'cat_scout', row: 2 }],
            },
            {
                time: 25,
                enemies: [{ type: 'cat_scout', row: 1 }, { type: 'cat_scout', row: 3 }],
            },
            {
                time: 45,
                isHugeWave: true,
                enemies: [
                    { type: 'cat_scout', row: 0, hasCookie: true },
                    { type: 'cat_scout', row: 2 },
                    { type: 'cat_scout', row: 4 },
                ],
            },
            {
                time: 70,
                isFinalWave: true,
                enemies: [
                    { type: 'cat_scout', row: 0 },
                    { type: 'cat_scout', row: 1 },
                    { type: 'cat_scout', row: 2, hasCookie: true },
                    { type: 'cat_scout', row: 3 },
                    { type: 'cat_scout', row: 4 },
                ],
            },
        ],
    },
    {
        levelNumber: 2,
        title: 'NIVEL 2 · LA INVASIÓN DE LAS CAJAS 📦',
        subtitle: 'Los gatos han creado armaduras de cartón. Usa a Sam para frenar su avance.',
        backgroundTheme: 'day',
        startingCroquetas: 150,
        availableDogs: ['miel', 'kiaro', 'sam'],
        duration: 110,
        rewardDescription: '¡Desbloqueada: Nika la Exploradora Helada! ❄️',
        waves: [
            {
                time: 8,
                enemies: [{ type: 'cat_scout', row: 1 }],
            },
            {
                time: 22,
                enemies: [{ type: 'cat_box', row: 3 }],
            },
            {
                time: 40,
                isHugeWave: true,
                enemies: [
                    { type: 'cat_box', row: 0 },
                    { type: 'cat_scout', row: 2, hasCookie: true },
                    { type: 'cat_box', row: 4 },
                ],
            },
            {
                time: 65,
                enemies: [
                    { type: 'cat_box', row: 1 },
                    { type: 'cat_scout', row: 3 },
                    { type: 'cat_box', row: 2, hasCookie: true },
                ],
            },
            {
                time: 90,
                isFinalWave: true,
                enemies: [
                    { type: 'cat_box', row: 0 },
                    { type: 'cat_box', row: 1 },
                    { type: 'cat_scout', row: 2 },
                    { type: 'cat_box', row: 3, hasCookie: true },
                    { type: 'cat_box', row: 4 },
                ],
            },
        ],
    },
    {
        levelNumber: 3,
        title: 'NIVEL 3 · EL ATAQUE DEL GATO NINJA 🥷',
        subtitle: 'Los gatos ninjas pueden saltar sobre tus perros. Ralentízalos con el hielo de Nika.',
        backgroundTheme: 'pool',
        startingCroquetas: 175,
        availableDogs: ['miel', 'kiaro', 'sam', 'nika', 'boneMine'],
        duration: 130,
        rewardDescription: '¡Desbloqueada: Bomba de Amor y Confeti! 💖',
        waves: [
            {
                time: 8,
                enemies: [{ type: 'cat_scout', row: 2 }],
            },
            {
                time: 20,
                enemies: [{ type: 'cat_ninja', row: 1 }],
            },
            {
                time: 38,
                enemies: [{ type: 'squirrel_nut', row: 3 }, { type: 'cat_box', row: 4 }],
            },
            {
                time: 60,
                isHugeWave: true,
                enemies: [
                    { type: 'cat_ninja', row: 0, hasCookie: true },
                    { type: 'cat_box', row: 2 },
                    { type: 'cat_ninja', row: 4 },
                ],
            },
            {
                time: 85,
                enemies: [
                    { type: 'squirrel_nut', row: 1 },
                    { type: 'cat_ninja', row: 2 },
                    { type: 'cat_box', row: 3, hasCookie: true },
                ],
            },
            {
                time: 110,
                isFinalWave: true,
                enemies: [
                    { type: 'cat_ninja', row: 0 },
                    { type: 'cat_box', row: 1 },
                    { type: 'squirrel_nut', row: 2, hasCookie: true },
                    { type: 'cat_ninja', row: 3 },
                    { type: 'cat_box', row: 4 },
                ],
            },
        ],
    },
    {
        levelNumber: 4,
        title: 'NIVEL 4 · EL TERROR DE LA ASPIRADORA 🌪️',
        subtitle: '¡La temida aspiradora y el bañador con champú amenazan la tranquilidad del patio!',
        backgroundTheme: 'night',
        startingCroquetas: 200,
        availableDogs: ['miel', 'kiaro', 'sam', 'nika', 'boneMine', 'loveBomb', 'boxerDog'],
        duration: 150,
        rewardDescription: '¡Desbloqueado: Perrito Bóxer y Combate Final! 🥊',
        waves: [
            {
                time: 8,
                enemies: [{ type: 'cat_box', row: 2 }],
            },
            {
                time: 22,
                enemies: [{ type: 'vacuum_monster', row: 1 }],
            },
            {
                time: 45,
                isHugeWave: true,
                enemies: [
                    { type: 'bath_groomer', row: 0, hasCookie: true },
                    { type: 'vacuum_monster', row: 2 },
                    { type: 'cat_ninja', row: 4 },
                ],
            },
            {
                time: 75,
                enemies: [
                    { type: 'vacuum_monster', row: 3 },
                    { type: 'bath_groomer', row: 1 },
                    { type: 'cat_box', row: 4, hasCookie: true },
                ],
            },
            {
                time: 105,
                isHugeWave: true,
                enemies: [
                    { type: 'vacuum_monster', row: 0 },
                    { type: 'cat_ninja', row: 1 },
                    { type: 'vacuum_monster', row: 2, hasCookie: true },
                    { type: 'bath_groomer', row: 3 },
                    { type: 'cat_box', row: 4 },
                ],
            },
            {
                time: 130,
                isFinalWave: true,
                enemies: [
                    { type: 'vacuum_monster', row: 1 },
                    { type: 'bath_groomer', row: 2 },
                    { type: 'vacuum_monster', row: 3, hasCookie: true },
                ],
            },
        ],
    },
    {
        levelNumber: 5,
        title: 'NIVEL 5 · EL ASEDIO DEL ROBOT GATO 🤖',
        subtitle: '¡La batalla definitiva! Coordina a toda la manada para derribar al Acorazado Mecánico.',
        backgroundTheme: 'roof',
        startingCroquetas: 250,
        availableDogs: ['miel', 'kiaro', 'sam', 'nika', 'boneMine', 'loveBomb', 'boxerDog'],
        duration: 180,
        rewardDescription: '👑 ¡TROFEO DE ORO · DEFENSOR SUPREMO DEL PATIO!',
        waves: [
            {
                time: 8,
                enemies: [{ type: 'cat_ninja', row: 0 }, { type: 'cat_ninja', row: 4 }],
            },
            {
                time: 25,
                enemies: [{ type: 'vacuum_monster', row: 2, hasCookie: true }, { type: 'bath_groomer', row: 1 }],
            },
            {
                time: 50,
                isHugeWave: true,
                enemies: [
                    { type: 'cat_ninja', row: 1 },
                    { type: 'vacuum_monster', row: 3 },
                    { type: 'cat_box', row: 0, hasCookie: true },
                    { type: 'cat_box', row: 4 },
                ],
            },
            {
                time: 80,
                isFinalWave: true,
                enemies: [
                    { type: 'boss_mecha_cat', row: 2 },
                    { type: 'cat_ninja', row: 0, hasCookie: true },
                    { type: 'cat_box', row: 1 },
                    { type: 'vacuum_monster', row: 3 },
                    { type: 'cat_ninja', row: 4, hasCookie: true },
                ],
            },
        ],
    },
];
