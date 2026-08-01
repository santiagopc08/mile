/**
 * Async Initializable Interface.
 */
export class Initializable {
  async initialize() {
    throw new Error('Initializable.initialize() must be implemented.');
  }
}
