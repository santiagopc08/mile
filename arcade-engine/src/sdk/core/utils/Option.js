/**
 * Monadic Option type (Some / None) for null-safe control flow.
 * @template T
 */
export class Option {
  /**
   * @param {boolean} isSome 
   * @param {T|null} value 
   */
  constructor(isSome, value) {
    this._isSome = isSome;
    this._value = value;
  }

  static some(value) {
    if (value === null || value === undefined) return Option.none();
    return new Option(true, value);
  }

  static none() {
    return new Option(false, null);
  }

  isSome() {
    return this._isSome;
  }

  isNone() {
    return !this._isSome;
  }

  unwrap() {
    if (this._isSome) return this._value;
    throw new Error('Called Option.unwrap() on a None value');
  }

  unwrapOr(fallback) {
    return this._isSome ? this._value : fallback;
  }

  map(fn) {
    return this._isSome ? Option.some(fn(this._value)) : Option.none();
  }
}
