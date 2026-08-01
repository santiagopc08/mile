import { MinimalGame } from '../../validation/reference/MinimalGame.js';

export class MinimalGameSample extends MinimalGame {}

export class PacmanSample extends MinimalGame {
  constructor() {
    super();
    this.name = 'Pac-Man Sample Reference';
  }
}

export class SnakeSample extends MinimalGame {
  constructor() {
    super();
    this.name = 'Snake Sample Reference';
  }
}

export class BreakoutSample extends MinimalGame {
  constructor() {
    super();
    this.name = 'Breakout Sample Reference';
  }
}

export class ToolSample extends MinimalGame {
  constructor() {
    super();
    this.name = 'Diagnostic Tool Sample Reference';
  }
}
