import * as THREE from 'three';

export const TILE_WIDTH = 0.82;
export const TILE_HEIGHT = 1.16;
export const TILE_BACK_DEPTH = 0.28;
export const TILE_FACE_WIDTH = 0.82;
export const TILE_FACE_HEIGHT = 1.16;
export const TILE_FACE_DEPTH = 0.32;

// Geometrías compartidas: todas las fichas tienen las mismas dimensiones, así que
// reutilizamos una sola instancia por cara en lugar de crear dos BoxGeometry por
// ficha (con 96-128 fichas eso ahorra mucha memoria y allocations en GPU).
// Se pasan por prop \`geometry\`, por lo que R3F NO las libera al desmontar la ficha.
export const BACK_GEOMETRY = new THREE.BoxGeometry(TILE_WIDTH, TILE_HEIGHT, TILE_BACK_DEPTH);
export const FRONT_GEOMETRY = new THREE.BoxGeometry(TILE_FACE_WIDTH, TILE_FACE_HEIGHT, TILE_FACE_DEPTH);
