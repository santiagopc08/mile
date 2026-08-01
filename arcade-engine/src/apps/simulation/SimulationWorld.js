import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import { MemoryStorageProvider } from '../../persistence/storage/StorageProvider.js';
import { Serializer } from '../../persistence/serialization/Serializer.js';
import { UndoRedoStack, TransactionCommand } from './UndoRedoStack.js';
import { SimulationActorFactory, HudFactory } from './SimulationActors.js';
import { SelectionSystem, HierarchySystem, InspectorSystem } from './SimulationSystems.js';
import { SimulationEvents, SimulationState } from './SimulationEvents.js';
import { HierarchyComponent } from './SimulationComponents.js';

export class SimulationWorld {
  constructor() {
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();
    this.undoRedoStack = new UndoRedoStack();
    this.serializer = new Serializer();
    this.storage = new MemoryStorageProvider();

    // Primary Scene Actors
    this.camera = null;
    this.hud = null;
    /** @type {Map<string, import('../../sdk/actors/core/Actor.js').Actor>} */
    this.entities = new Map();

    // Systems
    this.selectionSystem = new SelectionSystem();
    this.hierarchySystem = new HierarchySystem();
    this.inspectorSystem = new InspectorSystem();

    // State
    this.state = SimulationState.EDITING;
    this.frameCount = 0;

    // Audio Log
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    this.camera = SimulationActorFactory.createCamera(0, 0);
    this.hud = HudFactory.create();

    this.actorRegistry.register(this.camera);
    this.actorRegistry.register(this.hud);

    // Initial scene entities
    this.createEntity('node_01', 'Node_A', 0, 0);
    this.createEntity('node_02', 'Node_B', 5, 2);

    this.state = SimulationState.SIMULATION;
  }

  // ──────────── Entity Creation & Deletion Transactions (Undo/Redo) ────────────

  createEntity(id, name, x = 0, y = 0) {
    const cmd = new TransactionCommand(
      `CreateEntity_${id}`,
      () => {
        const entity = SimulationActorFactory.createEntity(id, name, x, y);
        this.entities.set(id, entity);
        this.actorRegistry.register(entity);
        this.eventBus.emit(SimulationEvents.ENTITY_CREATED, { id, name, x, y });
      },
      () => {
        if (this.entities.has(id)) {
          this.actorRegistry.unregister(id);
          this.entities.delete(id);
          this.eventBus.emit(SimulationEvents.ENTITY_DELETED, { id });
        }
      }
    );

    this.undoRedoStack.execute(cmd);
    this._audio('create_entity');
    return this.entities.get(id);
  }

  deleteEntity(id) {
    const entity = this.entities.get(id);
    if (!entity) return false;

    const name = entity.name;
    const tc = entity.getComponent('TransformComponent');
    const x = tc ? tc.x : 0;
    const y = tc ? tc.y : 0;

    const cmd = new TransactionCommand(
      `DeleteEntity_${id}`,
      () => {
        if (this.entities.has(id)) {
          this.actorRegistry.unregister(id);
          this.entities.delete(id);
          this.eventBus.emit(SimulationEvents.ENTITY_DELETED, { id });
        }
      },
      () => {
        const recreated = SimulationActorFactory.createEntity(id, name, x, y);
        this.entities.set(id, recreated);
        this.actorRegistry.register(recreated);
        this.eventBus.emit(SimulationEvents.ENTITY_CREATED, { id, name, x, y });
      }
    );

    this.undoRedoStack.execute(cmd);
    this._audio('delete_entity');
    return true;
  }

  // ──────────── Selection & Inspection ────────────

  selectEntity(id) {
    const entity = this.entities.get(id);
    if (entity) {
      const selected = this.selectionSystem.select(entity);
      if (selected) {
        this.eventBus.emit(SimulationEvents.SELECTION_CHANGED, { selectedIds: [id] });
        this._audio('select');
        return true;
      }
    }
    return false;
  }

  clearSelection() {
    this.selectionSystem.clearSelection();
    this.eventBus.emit(SimulationEvents.SELECTION_CHANGED, { selectedIds: [] });
  }

  inspectEntity(id) {
    const entity = this.entities.get(id);
    return entity ? this.inspectorSystem.inspectActor(entity) : null;
  }

  modifyEntityProperty(id, key, value) {
    const entity = this.entities.get(id);
    if (!entity) return false;

    const currentVal = this.inspectorSystem.inspectActor(entity)[key];

    const cmd = new TransactionCommand(
      `ModifyProperty_${id}_${key}`,
      () => {
        this.inspectorSystem.modifyProperty(entity, key, value);
      },
      () => {
        this.inspectorSystem.modifyProperty(entity, key, currentVal);
      }
    );

    this.undoRedoStack.execute(cmd);
    return true;
  }

  // ──────────── Scene Graph Hierarchy ────────────

  reparentEntity(childId, parentId) {
    const child = this.entities.get(childId);
    const parent = this.entities.get(parentId);
    if (!child || !parent) return false;

    const childHier = child.getComponent('HierarchyComponent');
    const parentHier = parent.getComponent('HierarchyComponent');

    if (childHier && parentHier) {
      childHier.parentId = parentId;
      parentHier.addChild(childId);
      return true;
    }

    return false;
  }

  // ──────────── Undo & Redo ────────────

  undo() {
    const cmd = this.undoRedoStack.undo();
    if (cmd) {
      this.eventBus.emit(SimulationEvents.UNDO, { commandName: cmd.name });
      this._audio('undo');
      return true;
    }
    return false;
  }

  redo() {
    const cmd = this.undoRedoStack.redo();
    if (cmd) {
      this.eventBus.emit(SimulationEvents.REDO, { commandName: cmd.name });
      this._audio('redo');
      return true;
    }
    return false;
  }

  // ──────────── Scene Save & Load Persistence ────────────

  saveScene(sceneName = 'default_scene') {
    const sceneData = [];

    for (const [id, entity] of this.entities.entries()) {
      const inspected = this.inspectorSystem.inspectActor(entity);
      sceneData.push(inspected);
    }

    const json = JSON.stringify(sceneData);
    this.storage.save(`scene_${sceneName}`, json);

    this.eventBus.emit(SimulationEvents.SCENE_SAVED, { sceneName, entitiesCount: sceneData.length });
    this._audio('save_scene');
    return json;
  }

  loadScene(sceneName = 'default_scene') {
    const json = this.storage.storage.get(`scene_${sceneName}`);
    if (!json) return false;

    const sceneData = JSON.parse(json);

    // Unregister current entities
    for (const id of Array.from(this.entities.keys())) {
      this.actorRegistry.unregister(id);
    }
    this.entities.clear();
    this.undoRedoStack.clear();

    // Recreate entities from scene file
    for (const item of sceneData) {
      const entity = SimulationActorFactory.createEntity(item.id, item.name, item.x, item.y);
      if (item.rotation) {
        const tc = entity.getComponent('TransformComponent');
        if (tc) tc.rotation = item.rotation;
      }
      this.entities.set(item.id, entity);
      this.actorRegistry.register(entity);
    }

    this.eventBus.emit(SimulationEvents.SCENE_LOADED, { sceneName, entitiesCount: sceneData.length });
    this._audio('load_scene');
    return true;
  }

  // ──────────── Main Update Loop ────────────

  update(dt) {
    if (this.state === SimulationState.PAUSED) return;

    this.frameCount++;

    // 1. Update Hierarchy Transform Positions
    this.hierarchySystem.update(this.actorRegistry);

    // 2. Consume Audio
    this._consumeAudio();

    // 3. Actor Component updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  _audio(cue) {
    this.audioLog.push(cue);
  }

  _consumeAudio() {
    // Collect pending audio cues
    for (const entity of this.entities.values()) {
      const audio = entity.getComponent('AudioCueComponent');
      if (audio) {
        const cue = audio.consume();
        if (cue) this._audio(cue);
      }
    }
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.entities.clear();
    this.undoRedoStack.clear();
    this.audioLog = [];
    this.frameCount = 0;
    this.initialize();
  }
}
