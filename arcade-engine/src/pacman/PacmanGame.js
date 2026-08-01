import { PluginState } from './PacmanConstants.js';

export class PacmanGame {
  constructor() {
    this.state = PluginState.UNINITIALIZED;
  }

  setState(newState) {
    this.state = newState;
    console.log(`[PacmanGame] State Transition -> ${newState}`);
  }
}
