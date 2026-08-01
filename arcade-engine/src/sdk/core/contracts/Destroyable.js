/**
 * Destroyable Service Interface.
 */
export class Destroyable {
  destroy() {
    throw new Error('Destroyable.destroy() must be implemented.');
  }
}
