export class LocaleRegistry {
  constructor() {
    this.locales = new Map();
    this.fallbackLocale = 'en-US';
  }

  registerLocale(bundle) {
    this.locales.set(bundle.locale, bundle);
  }

  getBundle(locale) {
    return this.locales.get(locale) || this.locales.get(this.fallbackLocale) || null;
  }
}
