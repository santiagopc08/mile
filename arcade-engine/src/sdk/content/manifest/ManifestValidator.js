import { ValidationError } from '../../core/errors/SDKError.js';

export class ManifestValidator {
  static validate(manifestJson) {
    if (!manifestJson || typeof manifestJson !== 'object') {
      throw new ValidationError('Manifest must be a valid JSON object.');
    }
    if (!manifestJson.id || typeof manifestJson.id !== 'string') {
      throw new ValidationError('Manifest missing required string field: "id"');
    }
    if (!manifestJson.version || typeof manifestJson.version !== 'string') {
      throw new ValidationError('Manifest missing required string field: "version"');
    }
    return true;
  }
}
