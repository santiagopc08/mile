export const ActorTag = Object.freeze({
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY',
  NPC: 'NPC',
  COLLECTIBLE: 'COLLECTIBLE',
  PROJECTILE: 'PROJECTILE',
  DECORATION: 'DECORATION',
  INTERACTIVE: 'INTERACTIVE',
  CUSTOM: 'CUSTOM',
});

export const ActorGroup = Object.freeze({
  GAMEPLAY: 'GAMEPLAY',
  UI: 'UI',
  DEBUG: 'DEBUG',
  PHYSICS: 'PHYSICS',
  AI: 'AI',
  AUDIO: 'AUDIO',
  CUSTOM: 'CUSTOM',
});

export class ActorLayer {
  constructor(name = 'default') {
    this.name = name;
  }
}

export class ActorMetadata {
  constructor(data = {}) {
    this.data = new Map(Object.entries(data));
  }
}
