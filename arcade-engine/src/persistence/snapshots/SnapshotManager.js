export class Snapshot {
  constructor(id, data, timestamp = Date.now()) {
    this.id = id;
    this.data = data;
    this.timestamp = timestamp;
  }
}

export class SnapshotBuilder {
  static build(id, data) {
    return new Snapshot(id, JSON.parse(JSON.stringify(data)));
  }
}

export class SnapshotDiff {
  static computeDiff(oldData, newData) {
    const diff = {};
    Object.keys(newData).forEach((key) => {
      if (oldData[key] !== newData[key]) {
        diff[key] = newData[key];
      }
    });
    return diff;
  }
}

export class SnapshotManager {
  constructor() {
    this.snapshots = new Map();
  }

  takeSnapshot(id, data) {
    const snap = SnapshotBuilder.build(id, data);
    this.snapshots.set(id, snap);
    return snap;
  }

  getSnapshot(id) {
    return this.snapshots.get(id) || null;
  }
}
