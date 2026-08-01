/**
 * Monadic Result type (Ok / Err) for zero-throw functional control flow.
 * @template T, E
 */
export class Result {
  /**
   * @param {boolean} isSuccess 
   * @param {T|null} value 
   * @param {E|null} error 
   */
  constructor(isSuccess, value, error) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  static ok(value) {
    return new Result(true, value, null);
  }

  static err(error) {
    return new Result(false, null, error);
  }

  isOk() {
    return this._isSuccess;
  }

  isErr() {
    return !this._isSuccess;
  }

  unwrap() {
    if (this._isSuccess) return this._value;
    throw this._error instanceof Error ? this._error : new Error(String(this._error));
  }

  unwrapOr(fallback) {
    return this._isSuccess ? this._value : fallback;
  }

  map(fn) {
    return this._isSuccess ? Result.ok(fn(this._value)) : Result.err(this._error);
  }

  mapErr(fn) {
    return this._isSuccess ? Result.ok(this._value) : Result.err(fn(this._error));
  }
}
