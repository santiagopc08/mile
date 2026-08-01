import { SupportedPlatforms, SupportedRenderers, SupportedProviders } from './SupportedPlatforms.js';

export class CompatibilityMatrix {
  static generateMatrix() {
    return {
      platforms: Object.values(SupportedPlatforms),
      renderers: Object.values(SupportedRenderers),
      storageProviders: Object.values(SupportedProviders),
      fullySupported: true,
    };
  }
}
