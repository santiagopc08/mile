/**
 * Base Component Definition.
 * Components must be pure data containers (no logic).
 */

let componentTypeCounter = 0;
const componentTypes = new Map();

export class Component {
  /**
   * Register a component class and return its unique bit index.
   * @param {Function} componentClass 
   * @returns {number}
   */
  static register(componentClass) {
    if (!componentTypes.has(componentClass)) {
      const typeId = componentTypeCounter++;
      componentTypes.set(componentClass, typeId);
      componentClass.typeId = typeId;
    }
    return componentTypes.get(componentClass);
  }

  /**
   * Get the bit type ID of a component class.
   * @param {Function} componentClass 
   * @returns {number}
   */
  static getTypeId(componentClass) {
    if (!componentTypes.has(componentClass)) {
      return Component.register(componentClass);
    }
    return componentTypes.get(componentClass);
  }
}
