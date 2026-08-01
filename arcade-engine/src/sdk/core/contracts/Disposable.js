/**
 * Disposable Resource Interface.
 */
export class Disposable {
  dispose() {
    throw new Error('Disposable.dispose() must be implemented.');
  }
}
