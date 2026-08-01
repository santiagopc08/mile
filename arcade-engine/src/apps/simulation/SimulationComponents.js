import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';

/**
 * Hierarchy component managing parent-child scene graph relationships.
 */
export class HierarchyComponent extends ActorComponent {
  constructor(parentId = null) {
    super('HierarchyComponent');
    this.parentId = parentId;
    this.childrenIds = new Set();
  }

  addChild(childId) {
    this.childrenIds.add(childId);
  }

  removeChild(childId) {
    this.childrenIds.delete(childId);
  }
}

/**
 * Selection component for interactive pick selection.
 */
export class SelectionComponent extends ActorComponent {
  constructor(selectable = true) {
    super('SelectionComponent');
    this.selectable = selectable;
    this.selected = false;
  }

  setSelected(val) {
    this.selected = val;
  }
}

/**
 * Inspector component storing property metadata for live property editing.
 */
export class InspectorComponent extends ActorComponent {
  constructor(properties = {}) {
    super('InspectorComponent');
    this.properties = new Map(Object.entries(properties));
  }

  setProperty(key, value) {
    this.properties.set(key, value);
  }

  getProperty(key) {
    return this.properties.get(key);
  }
}

/**
 * Persistence component defining serializable fields for scene saving.
 */
export class PersistenceComponent extends ActorComponent {
  constructor(serializableKeys = ['x', 'y', 'rotation', 'name']) {
    super('PersistenceComponent');
    this.serializableKeys = serializableKeys;
  }
}

/**
 * UI Widget Component for interactive panels and gizmos.
 */
export class UIWidgetComponent extends ActorComponent {
  constructor(widgetType = 'PANEL', label = 'Widget') {
    super('UIWidgetComponent');
    this.widgetType = widgetType;
    this.label = label;
    this.visible = true;
  }
}

/**
 * Audio cue marker.
 */
export class AudioCueComponent extends ActorComponent {
  constructor() {
    super('AudioCueComponent');
    /** @type {string|null} */
    this.pending = null;
  }

  play(cueName) {
    this.pending = cueName;
  }

  consume() {
    const cue = this.pending;
    this.pending = null;
    return cue;
  }
}
