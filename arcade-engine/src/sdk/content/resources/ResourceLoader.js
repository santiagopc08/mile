export class ResourceLoader {
  async load(descriptor) {
    throw new Error('ResourceLoader.load() must be implemented by concrete adapters.');
  }
}
