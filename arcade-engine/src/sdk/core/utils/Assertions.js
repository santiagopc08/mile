import { ContractError } from '../errors/SDKError.js';

export class Assertions {
  static isTrue(condition, message = 'Assertion failed: condition is not true') {
    if (!condition) {
      throw new ContractError(message);
    }
  }

  static isFunction(fn, message = 'Assertion failed: argument is not a function') {
    if (typeof fn !== 'function') {
      throw new ContractError(message);
    }
  }

  static isObject(obj, message = 'Assertion failed: argument is not an object') {
    if (typeof obj !== 'object' || obj === null) {
      throw new ContractError(message);
    }
  }
}
