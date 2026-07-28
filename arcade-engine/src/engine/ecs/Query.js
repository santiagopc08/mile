import { Component } from './Component.js';

/**
 * Component Composition Query for fast entity filtering.
 */
export class Query {
  /**
   * @param {Array<Function>} componentClasses - Component classes required
   */
  constructor(componentClasses = []) {
    this.componentClasses = componentClasses;
    this.typeIds = componentClasses.map((cls) => Component.getTypeId(cls));
    /** @type {Set<number>} */
    this.matchingEntityIds = new Set();
  }

  /**
   * Check if a set of entity type IDs satisfies this query.
   * @param {Set<number>} entityTypeIds 
   * @returns {boolean}
   */
  matches(entityTypeIds) {
    for (let i = 0; i < this.typeIds.length; i++) {
      if (!entityTypeIds.has(this.typeIds[i])) {
        return false;
      }
    }
    return true;
  }
}
