import { Entity } from './Entity.js';
import { Component } from './Component.js';
import { Query } from './Query.js';

/**
 * High-performance lightweight ECS World.
 */
export class World {
  /**
   * @param {import('../ArcadeEngine.js').ArcadeEngine|null} [engine]
   *   Referencia al engine anfitrión. Los sistemas de gameplay la usan para
   *   alcanzar eventBus, uiBridge, input y audio; varios hacen `return` en
   *   silencio si falta, así que se pide en el constructor en vez de dejarla
   *   como una asignación externa que se puede olvidar.
   */
  constructor(engine = null) {
    this.engine = engine;
    this.nextEntityId = 1;
    /** @type {Map<number, Entity>} */
    this.entities = new Map();
    /** @type {Map<number, Set<number>>} entityId -> Set<componentTypeId> */
    this.entityComponentTypes = new Map();
    /** @type {Map<number, Map<number, any>>} entityId -> (componentTypeId -> ComponentInstance) */
    this.entityComponents = new Map();

    /** @type {import('./System.js').System[]} */
    this.systems = [];
    /** @type {Query[]} */
    this.queries = [];

    /** @type {Set<number>} Queue of entity IDs marked for destruction */
    this.destructionQueue = new Set();
  }

  /**
   * Create a new Entity.
   * @param {string} [name='Entity'] 
   * @returns {Entity}
   */
  createEntity(name = 'Entity') {
    const id = this.nextEntityId++;
    const entity = new Entity(id, name);
    this.entities.set(id, entity);
    this.entityComponentTypes.set(id, new Set());
    this.entityComponents.set(id, new Map());
    return entity;
  }

  /**
   * Get entity by ID.
   * @param {number} id 
   * @returns {Entity|undefined}
   */
  getEntity(id) {
    return this.entities.get(id);
  }

  /**
   * Add a component instance to an entity.
   * @param {Entity|number} entityOrId 
   * @param {any} componentInstance 
   */
  addComponent(entityOrId, componentInstance) {
    const entityId = typeof entityOrId === 'number' ? entityOrId : entityOrId.id;
    if (!this.entities.has(entityId)) return;

    const componentClass = componentInstance.constructor;
    const typeId = Component.getTypeId(componentClass);

    const typeSet = this.entityComponentTypes.get(entityId);
    const compMap = this.entityComponents.get(entityId);

    typeSet.add(typeId);
    compMap.set(typeId, componentInstance);

    this._updateQueriesForEntity(entityId);
  }

  /**
   * Get a component instance from an entity.
   * @param {Entity|number} entityOrId 
   * @param {Function} componentClass 
   * @returns {any|null}
   */
  getComponent(entityOrId, componentClass) {
    const entityId = typeof entityOrId === 'number' ? entityOrId : entityOrId.id;
    const typeId = Component.getTypeId(componentClass);
    const compMap = this.entityComponents.get(entityId);
    if (!compMap) return null;
    return compMap.get(typeId) || null;
  }

  /**
   * Check if entity has a specific component.
   * @param {Entity|number} entityOrId 
   * @param {Function} componentClass 
   * @returns {boolean}
   */
  hasComponent(entityOrId, componentClass) {
    const entityId = typeof entityOrId === 'number' ? entityOrId : entityOrId.id;
    const typeId = Component.getTypeId(componentClass);
    const typeSet = this.entityComponentTypes.get(entityId);
    return typeSet ? typeSet.has(typeId) : false;
  }

  /**
   * Remove a component from an entity.
   * @param {Entity|number} entityOrId 
   * @param {Function} componentClass 
   */
  removeComponent(entityOrId, componentClass) {
    const entityId = typeof entityOrId === 'number' ? entityOrId : entityOrId.id;
    const typeId = Component.getTypeId(componentClass);

    const typeSet = this.entityComponentTypes.get(entityId);
    const compMap = this.entityComponents.get(entityId);

    if (typeSet) typeSet.delete(typeId);
    if (compMap) compMap.delete(typeId);

    this._updateQueriesForEntity(entityId);
  }

  /**
   * Queue entity for destruction at the end of the tick.
   * @param {Entity|number} entityOrId 
   */
  destroyEntity(entityOrId) {
    const entityId = typeof entityOrId === 'number' ? entityOrId : entityOrId.id;
    this.destructionQueue.add(entityId);
  }

  /**
   * Immediately process queued entity destructions.
   */
  processDestructionQueue() {
    if (this.destructionQueue.size === 0) return;

    this.destructionQueue.forEach((id) => {
      const entity = this.entities.get(id);
      if (entity) {
        entity.active = false;
        // Remove from queries
        this.queries.forEach((q) => q.matchingEntityIds.delete(id));

        // Delete stores
        this.entities.delete(id);
        this.entityComponentTypes.delete(id);
        this.entityComponents.delete(id);
      }
    });

    this.destructionQueue.clear();
  }

  /**
   * Create or retrieve a Query for matching component classes.
   * @param {Array<Function>} componentClasses 
   * @returns {Query}
   */
  createQuery(componentClasses) {
    const query = new Query(componentClasses);
    this.queries.push(query);

    // Initial population
    this.entityComponentTypes.forEach((types, entityId) => {
      const entity = this.entities.get(entityId);
      if (entity && entity.active && query.matches(types)) {
        query.matchingEntityIds.add(entityId);
      }
    });

    return query;
  }

  /**
   * Get all active Entities matching a Query.
   * @param {Query} query 
   * @returns {Entity[]}
   */
  getEntitiesForQuery(query) {
    const result = [];
    query.matchingEntityIds.forEach((id) => {
      const ent = this.entities.get(id);
      if (ent && ent.active) {
        result.push(ent);
      }
    });
    return result;
  }

  /**
   * Add a System to the World.
   * @param {import('./System.js').System} system 
   */
  addSystem(system) {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
    system.init(this);
  }

  /**
   * Remove a System.
   * @param {import('./System.js').System} system 
   */
  removeSystem(system) {
    const idx = this.systems.indexOf(system);
    if (idx !== -1) {
      system.destroy();
      this.systems.splice(idx, 1);
    }
  }

  // --- Execution Lifecycle Methods ---

  fixedUpdate(fixedDt) {
    for (let i = 0; i < this.systems.length; i++) {
      if (this.systems[i].enabled) {
        this.systems[i].fixedUpdate(fixedDt);
      }
    }
    this.processDestructionQueue();
  }

  update(dt) {
    for (let i = 0; i < this.systems.length; i++) {
      if (this.systems[i].enabled) {
        this.systems[i].update(dt);
      }
    }
  }

  lateUpdate(dt) {
    for (let i = 0; i < this.systems.length; i++) {
      if (this.systems[i].enabled) {
        this.systems[i].lateUpdate(dt);
      }
    }
  }

  render(alpha) {
    for (let i = 0; i < this.systems.length; i++) {
      if (this.systems[i].enabled) {
        this.systems[i].render(alpha);
      }
    }
  }

  _updateQueriesForEntity(entityId) {
    const types = this.entityComponentTypes.get(entityId);
    const entity = this.entities.get(entityId);
    if (!types || !entity) return;

    for (let i = 0; i < this.queries.length; i++) {
      const q = this.queries[i];
      if (entity.active && q.matches(types)) {
        q.matchingEntityIds.add(entityId);
      } else {
        q.matchingEntityIds.delete(entityId);
      }
    }
  }

  clear() {
    this.systems.forEach((s) => s.destroy());
    this.systems = [];
    this.queries = [];
    this.entities.clear();
    this.entityComponentTypes.clear();
    this.entityComponents.clear();
    this.destructionQueue.clear();
    this.nextEntityId = 1;
  }
}
