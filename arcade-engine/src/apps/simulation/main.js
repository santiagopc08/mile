import { SimulationApp } from './SimulationApp.js';
import { SimulationEvents } from './SimulationEvents.js';

/**
 * RA-001 — Interactive Simulation Reference Application runner.
 *
 * Simulates interactive non-game workflow:
 *  - Creates entities (`node_01`, `node_02`, `node_03`)
 *  - Performs selection & property inspection
 *  - Executes property modifications wrapped in Undo/Redo transactions
 *  - Reparents entities in scene graph hierarchy
 *  - Performs Undo and Redo operations
 *  - Saves scene to persistence and reloads scene
 */
export function runSimulationApp() {
  const app = new SimulationApp();
  app.initialize();

  const events = [];
  const allEvents = [
    SimulationEvents.ENTITY_CREATED,
    SimulationEvents.ENTITY_DELETED,
    SimulationEvents.SELECTION_CHANGED,
    SimulationEvents.SCENE_LOADED,
    SimulationEvents.SCENE_SAVED,
    SimulationEvents.UNDO,
    SimulationEvents.REDO,
    SimulationEvents.GAME_PAUSED,
    SimulationEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ event: name, ...payload });
    });
  }

  const DT = 0.016;
  const MAX_TICKS = 80;
  let ticks = 0;

  while (ticks < MAX_TICKS) {
    // 1. Create Entity
    if (ticks === 10) {
      app.createEntity('node_03', 'Node_C', 10, -4);
    }

    // 2. Select & Inspect
    if (ticks === 20) {
      app.selectEntity('node_03');
    }

    // 3. Modify Property
    if (ticks === 30) {
      app.modifyEntityProperty('node_03', 'x', 15);
    }

    // 4. Reparent Entity in Scene Graph
    if (ticks === 40) {
      app.reparentEntity('node_03', 'node_01');
    }

    // 5. Undo & Redo
    if (ticks === 50) {
      app.undo(); // Undoes Property Modification
    }
    if (ticks === 60) {
      app.redo(); // Redoes Property Modification
    }

    // 6. Save Scene & Load Scene
    if (ticks === 70) {
      app.saveScene('editor_project');
      app.loadScene('editor_project');
    }

    app.tick(DT);
    ticks++;
  }

  app.stop();

  return {
    app,
    events,
    ticks,
    finalState: app.world.state,
    entitiesCount: app.world.entities.size,
    undoStackDepth: app.world.undoRedoStack.undoStack.length,
    redoStackDepth: app.world.undoRedoStack.redoStack.length,
    selectedEntities: app.world.selectionSystem.getSelectedIds(),
    entitiesCreated: events.filter((e) => e.event === SimulationEvents.ENTITY_CREATED).length,
    selectionChanges: events.filter((e) => e.event === SimulationEvents.SELECTION_CHANGED).length,
    undoOperations: events.filter((e) => e.event === SimulationEvents.UNDO).length,
    redoOperations: events.filter((e) => e.event === SimulationEvents.REDO).length,
    scenesSaved: events.filter((e) => e.event === SimulationEvents.SCENE_SAVED).length,
    scenesLoaded: events.filter((e) => e.event === SimulationEvents.SCENE_LOADED).length,
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.event))],
  };
}
