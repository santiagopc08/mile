export class ReplayEvent {
  constructor(frameNumber, eventName, payload) {
    this.frameNumber = frameNumber;
    this.eventName = eventName;
    this.payload = payload;
    this.timestamp = Date.now();
  }
}

export class Replay {
  constructor() {
    this.events = [];
  }
}

export class ReplayRecorder {
  constructor() {
    this.replay = new Replay();
    this.recording = false;
  }

  start() { this.recording = true; this.replay = new Replay(); }
  stop() { this.recording = false; }
  record(frameNumber, eventName, payload) {
    if (this.recording) {
      this.replay.events.push(new ReplayEvent(frameNumber, eventName, payload));
    }
  }
}

export class ReplayPlayer {
  constructor(replay) {
    this.replay = replay;
    this.playing = false;
    this.currentIndex = 0;
  }

  play() { this.playing = true; this.currentIndex = 0; }
  stop() { this.playing = false; }
}
