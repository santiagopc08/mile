export class SensorFilter {
  static filter(entity) { return true; }
}

export class SensorVolume {
  constructor(radius = 1) {
    this.radius = radius;
  }
}

export class Sensor {
  constructor(id, volume) {
    this.id = id;
    this.volume = volume;
    this.active = true;
  }
}
