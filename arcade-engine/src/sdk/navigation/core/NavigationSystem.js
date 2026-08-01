import { NavigationGraph } from '../graph/NavigationGraph.js';
import { NavigationService } from './NavigationService.js';

export class NavigationSystem {
  constructor() {
    this.graph = new NavigationGraph();
    this.service = new NavigationService(this.graph);
  }
}
