import { ValidationError } from '../../core/errors/SDKError.js';

export class Deserializer {
  static deserialize(jsonString) {
    const raw = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!raw.header || raw.header.magic !== 'ARCSAVE') {
      throw new ValidationError('Invalid save file header format.');
    }
    return raw;
  }
}
