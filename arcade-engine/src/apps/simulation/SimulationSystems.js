// ──────────────────────────────────────────
// System: Pick Selection System
// ──────────────────────────────────────────
export class SelectionSystem {
  constructor() {
    /** @type {Set<string>} Selected actor IDs */
    this.selectedActorIds = new Set();
  }

  select(actor) {
    if (!actor) return false;
    const selComp = actor.getComponent('SelectionComponent');
    if (!selComp || !selComp.selectable) return false;

    // Deselect current
    this.clearSelection();

    selComp.setSelected(true);
    this.selectedActorIds.add(actor.id);
    return true;
  }

  deselect(actor) {
    if (!actor) return;
    const selComp = actor.getComponent('SelectionComponent');
    if (selComp) selComp.setSelected(false);
    this.selectedActorIds.delete(actor.id);
  }

  clearSelection() {
    this.selectedActorIds.clear();
  }

  getSelectedIds() {
    return Array.from(this.selectedActorIds);
  }
}

// ──────────────────────────────────────────
// System: Parent-Child Scene Graph Hierarchy System
// ──────────────────────────────────────────
export class HierarchySystem {
  /**
   * Update child entity transform positions relative to parent transform.
   */
  update(actorRegistry) {
    const actorsMap = actorRegistry.collection.actors;

    for (const actor of actorsMap.values()) {
      const hier = actor.getComponent('HierarchyComponent');
      const tc = actor.getComponent('TransformComponent');

      if (hier && hier.parentId && tc) {
        const parent = actorsMap.get(hier.parentId);
        if (parent) {
          const parentTc = parent.getComponent('TransformComponent');
          if (parentTc) {
            // Apply parent offset
            tc.setPosition(parentTc.x + (tc.offsetX || 0), parentTc.y + (tc.offsetY || 0));
          }
        }
      }
    }
  }
}

// ──────────────────────────────────────────
// System: Live Property Inspector System
// ──────────────────────────────────────────
export class InspectorSystem {
  inspectActor(actor) {
    if (!actor) return null;
    const inspectorComp = actor.getComponent('InspectorComponent');
    const tc = actor.getComponent('TransformComponent');

    const result = {
      id: actor.id,
      name: actor.name,
      x: tc ? tc.x : 0,
      y: tc ? tc.y : 0,
      rotation: tc ? tc.rotation : 0,
      properties: inspectorComp ? Object.fromEntries(inspectorComp.properties) : {},
    };

    return result;
  }

  modifyProperty(actor, key, value) {
    if (!actor) return false;
    const inspectorComp = actor.getComponent('InspectorComponent');
    const tc = actor.getComponent('TransformComponent');

    if (key === 'x' && tc) {
      tc.x = value;
      return true;
    }
    if (key === 'y' && tc) {
      tc.y = value;
      return true;
    }
    if (key === 'rotation' && tc) {
      tc.rotation = value;
      return true;
    }

    if (inspectorComp) {
      inspectorComp.setProperty(key, value);
      return true;
    }

    return false;
  }
}
