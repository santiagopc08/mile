import { ValidationError } from '../errors/SDKError.js';

export class Guard {
  static againstNullOrUndefined(value, parameterName) {
    if (value === null || value === undefined) {
      throw new ValidationError(`Parameter '${parameterName}' cannot be null or undefined.`);
    }
  }

  static againstEmptyString(value, parameterName) {
    Guard.againstNullOrUndefined(value, parameterName);
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`Parameter '${parameterName}' cannot be an empty string.`);
    }
  }

  static againstOutOfRange(value, min, max, parameterName) {
    Guard.againstNullOrUndefined(value, parameterName);
    if (typeof value !== 'number' || value < min || value > max) {
      throw new ValidationError(`Parameter '${parameterName}' must be between ${min} and ${max}. Got: ${value}`);
    }
  }

  static againstNegative(value, parameterName) {
    Guard.againstNullOrUndefined(value, parameterName);
    if (typeof value !== 'number' || value < 0) {
      throw new ValidationError(`Parameter '${parameterName}' cannot be negative. Got: ${value}`);
    }
  }
}
