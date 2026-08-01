import { ValidationError } from '../../core/errors/SDKError.js';

export class MapValidator {
  static validate(mapData) {
    if (!mapData || typeof mapData !== 'object') {
      throw new ValidationError('Map data must be a valid JSON object.');
    }
    if (!mapData.width || !mapData.height) {
      throw new ValidationError('Map data missing width or height dimensions.');
    }
    return true;
  }
}
