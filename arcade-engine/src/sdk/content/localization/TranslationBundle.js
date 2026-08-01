export class TranslationBundle {
  constructor(locale, dictionary = {}) {
    this.locale = locale;
    this.dictionary = new Map(Object.entries(dictionary));
  }

  get(key) {
    return this.dictionary.get(key) || null;
  }
}
