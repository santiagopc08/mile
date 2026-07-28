/**
 * Lightweight Entity handle wrapping integer ID and tag.
 */
export class Entity {
  /**
   * @param {number} id 
   * @param {string} [name='Entity'] 
   */
  constructor(id, name = 'Entity') {
    this.id = id;
    this.name = name;
    this.tag = 'default';
    this.active = true;
  }

  reset(id, name = 'Entity') {
    this.id = id;
    this.name = name;
    this.tag = 'default';
    this.active = true;
  }
}
