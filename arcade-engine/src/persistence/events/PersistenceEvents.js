export const PersistenceEvents = Object.freeze({
  STATE_SAVED: 'Persistence.StateSaved',
  STATE_LOADED: 'Persistence.StateLoaded',
  SNAPSHOT_CREATED: 'Persistence.SnapshotCreated',
  REPLAY_STARTED: 'Persistence.ReplayStarted',
  REPLAY_FINISHED: 'Persistence.ReplayFinished',
  MIGRATION_COMPLETED: 'Persistence.MigrationCompleted',
  STORAGE_ERROR: 'Persistence.StorageError',
});
