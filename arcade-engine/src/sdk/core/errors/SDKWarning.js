/**
 * SDK Warning reporter for non-fatal issues.
 */
export class SDKWarning {
  /**
   * @param {string} message 
   * @param {string} [code='SDK_WARNING'] 
   * @param {Object} [details={}] 
   */
  constructor(message, code = 'SDK_WARNING', details = {}) {
    this.message = message;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }

  static warn(message, code = 'SDK_WARNING', details = {}) {
    const warning = new SDKWarning(message, code, details);
    console.warn(`[SDK Warning: ${code}] ${message}`, details);
    return warning;
  }
}
