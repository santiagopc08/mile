export class RenderLayer {
  constructor(name = 'default', depth = 0) {
    this.name = name;
    this.depth = depth;
  }
}

export class SortingLayer {
  static compare(cmdA, cmdB) {
    return cmdA.sortingOrder - cmdB.sortingOrder;
  }
}

export class RenderQueue {
  constructor() {
    this.commands = [];
  }

  add(command) {
    this.commands.push(command);
  }

  sort() {
    this.commands.sort((a, b) => (a.sortingOrder || 0) - (b.sortingOrder || 0));
  }

  clear() {
    this.commands = [];
  }
}
