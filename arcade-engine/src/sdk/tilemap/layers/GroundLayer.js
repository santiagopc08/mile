import { TileLayer } from './TileLayer.js';

export class GroundLayer extends TileLayer {
  constructor(width, height) { super('ground', width, height); }
}

export class CollisionLayer extends TileLayer {
  constructor(width, height) { super('collision', width, height); }
}

export class GameplayLayer extends TileLayer {
  constructor(width, height) { super('gameplay', width, height); }
}

export class DecorationLayer extends TileLayer {
  constructor(width, height) { super('decoration', width, height); }
}

export class TriggerLayer extends TileLayer {
  constructor(width, height) { super('trigger', width, height); }
}

export class NavigationLayer extends TileLayer {
  constructor(width, height) { super('navigation', width, height); }
}
