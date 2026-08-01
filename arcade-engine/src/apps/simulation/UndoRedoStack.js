export class Command {
  execute() {}
  undo() {}
}

/**
 * TransactionCommand — wraps an execute function and an undo function.
 */
export class TransactionCommand extends Command {
  constructor(name, executeFn, undoFn) {
    super();
    this.name = name;
    this.executeFn = executeFn;
    this.undoFn = undoFn;
  }

  execute() {
    if (typeof this.executeFn === 'function') this.executeFn();
  }

  undo() {
    if (typeof this.undoFn === 'function') this.undoFn();
  }
}

/**
 * UndoRedoStack — manages transaction undo/redo history stacks.
 */
export class UndoRedoStack {
  constructor(maxDepth = 50) {
    this.maxDepth = maxDepth;
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Execute a command and push it onto the undo stack.
   */
  execute(command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    if (!this.canUndo()) return null;
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);
    return command;
  }

  redo() {
    if (!this.canRedo()) return null;
    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);
    return command;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
