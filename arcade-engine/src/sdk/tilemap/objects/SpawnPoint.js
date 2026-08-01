import { MapObject } from './MapObject.js';

export class SpawnPoint extends MapObject {
  constructor(id, x, y, entityType = 'player') {
    super(id, 'SPAWN_POINT', x, y);
    this.entityType = entityType;
  }
}

export class Portal extends MapObject {
  constructor(id, x, y, targetX, targetY) {
    super(id, 'PORTAL', x, y);
    this.targetX = targetX;
    this.targetY = targetY;
  }
}

export class TriggerZone extends MapObject {
  constructor(id, x, y, width, height, eventName) {
    super(id, 'TRIGGER_ZONE', x, y);
    this.width = width;
    this.height = height;
    this.eventName = eventName;
  }
}
