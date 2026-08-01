/**
 * Base SDK Error class and specialized exception hierarchy.
 */
export class SDKError extends Error {
  /**
   * @param {string} message 
   * @param {string} [code='SDK_ERROR'] 
   * @param {Object} [details={}] 
   */
  constructor(message, code = 'SDK_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ConfigurationError extends SDKError {
  constructor(message, details = {}) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}

export class LifecycleError extends SDKError {
  constructor(message, details = {}) {
    super(message, 'LIFECYCLE_ERROR', details);
  }
}

export class DependencyError extends SDKError {
  constructor(message, details = {}) {
    super(message, 'DEPENDENCY_ERROR', details);
  }
}

export class ValidationError extends SDKError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class ContractError extends SDKError {
  constructor(message, details = {}) {
    super(message, 'CONTRACT_ERROR', details);
  }
}
