import { LocaleRegistry } from './LocaleRegistry.js';

export class LocalizationManager {
  constructor(defaultLocale = 'en-US') {
    this.registry = new LocaleRegistry();
    this.currentLocale = defaultLocale;
  }

  t(key, options = {}) {
    const bundle = this.registry.getBundle(this.currentLocale);
    if (bundle && bundle.get(key)) {
      return bundle.get(key);
    }
    return options.default || key;
  }

  setLocale(locale) {
    this.currentLocale = locale;
  }
}
