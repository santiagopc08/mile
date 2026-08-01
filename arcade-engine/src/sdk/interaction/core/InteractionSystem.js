import { TriggerCollection } from '../triggers/TriggerZone.js';
import { OccupancyGrid } from '../occupancy/OccupancyGrid.js';

export class InteractionManager {
  constructor(width = 28, height = 36) {
    this.triggers = new TriggerCollection();
    this.occupancy = new OccupancyGrid(width, height);
  }
}

export class InteractionSystem {
  constructor() {
    this.manager = new InteractionManager();
  }
}
