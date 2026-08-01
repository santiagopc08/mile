import { UUID } from '../../core/utils/UUID.js';
import { AssetType } from './AssetType.js';
import { AssetMetadata } from './AssetMetadata.js';
import { AssetTags } from './AssetTags.js';

export class AssetDescriptor {
  constructor(options = {}) {
    this.uuid = options.uuid || UUID.generate();
    this.urn = options.urn || `urn:arcade:asset:${this.uuid}`;
    this.name = options.name || 'unnamed_asset';
    this.type = options.type || AssetType.CUSTOM;
    this.version = options.version || '1.0.0';
    this.owner = options.owner || 'system';
    this.bundle = options.bundle || 'common';
    this.hash = options.hash || '';
    this.dependencies = options.dependencies || [];
    this.metadata = new AssetMetadata(options.metadata || {});
    this.tags = new AssetTags(options.tags || []);
    this.state = 'REGISTERED';
  }
}
