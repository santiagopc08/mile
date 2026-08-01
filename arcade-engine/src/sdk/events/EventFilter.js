export class EventFilter {
  static matchesPattern(eventName, pattern) {
    if (pattern === '*' || pattern === eventName) return true;

    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventName.startsWith(prefix + '.');
    }

    return false;
  }
}
