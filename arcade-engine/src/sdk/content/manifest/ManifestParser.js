import { ManifestValidator } from './ManifestValidator.js';
import { AssetDescriptor } from '../registry/AssetDescriptor.js';

export class ManifestParser {
  static parse(jsonString) {
    const raw = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    ManifestValidator.validate(raw);

    const descriptors = [];
    if (raw.assets && Array.isArray(raw.assets)) {
      raw.assets.forEach((item) => {
        descriptors.push(new AssetDescriptor({
          ...item,
          owner: raw.id,
        }));
      });
    }
    return { manifest: raw, descriptors };
  }
}
