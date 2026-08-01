export class MemoryEntry {
  constructor(key, value, confidence = 1.0, decayRate = 0.1) {
    this.key = key;
    this.value = value;
    this.confidence = confidence;
    this.decayRate = decayRate;
    this.timestamp = Date.now();
  }

  decay(dt) {
    this.confidence = Math.max(0, this.confidence - this.decayRate * dt);
  }
}

export class MemoryStore {
  constructor() {
    this.entries = new Map();
  }

  set(key, value, confidence = 1.0) {
    this.entries.set(key, new MemoryEntry(key, value, confidence));
  }

  get(key) {
    const entry = this.entries.get(key);
    return entry && entry.confidence > 0 ? entry.value : undefined;
  }

  update(dt) {
    this.entries.forEach((entry, key) => {
      entry.decay(dt);
      if (entry.confidence <= 0) this.entries.delete(key);
    });
  }
}

export class WorkingMemory extends MemoryStore {}
export class ShortTermMemory extends MemoryStore {}
export class LongTermMemory extends MemoryStore {}
