import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';

/**
 * 2D RigidBody component with mass, linear velocity, angular velocity, and drag.
 */
export class RigidBodyComponent extends ActorComponent {
  constructor(mass = 1.0, restitution = 0.2, friction = 0.8) {
    super('RigidBodyComponent');
    this.mass = mass;
    this.restitution = restitution;
    this.friction = friction;
    this.vx = 0;
    this.vy = 0;
    this.angularVelocity = 0;
  }
}

/**
 * Spring-damper suspension joint connecting a wheel to the vehicle chassis.
 */
export class WheelJointComponent extends ActorComponent {
  constructor(offsetX = 0, offsetY = 0, stiffness = 120, damping = 8, restLength = 1.5) {
    super('WheelJointComponent');
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.stiffness = stiffness;
    this.damping = damping;
    this.restLength = restLength;
    this.currentLength = restLength;
    this.wheelActor = null;
  }
}

/**
 * Vehicle engine component providing drive torque.
 */
export class EngineComponent extends ActorComponent {
  constructor(maxTorque = 80, maxSpeed = 35) {
    super('EngineComponent');
    this.maxTorque = maxTorque;
    this.maxSpeed = maxSpeed;
    this.throttle = 0; // -1 (brake/reverse) to +1 (forward gas)
  }
}

/**
 * Fuel tank component storing fuel level and consumption rate.
 */
export class FuelTankComponent extends ActorComponent {
  constructor(maxFuel = 100, consumptionRate = 2.5) {
    super('FuelTankComponent');
    this.maxFuel = maxFuel;
    this.fuel = maxFuel;
    this.consumptionRate = consumptionRate;
  }

  consume(amount) {
    this.fuel = Math.max(0, this.fuel - amount);
    return this.fuel <= 0;
  }

  refill(amount = 50) {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
  }
}

/**
 * Camera follow target descriptor.
 */
export class CameraFollowComponent extends ActorComponent {
  constructor(smoothSpeed = 5.0, offsetX = 10, offsetY = 5) {
    super('CameraFollowComponent');
    this.smoothSpeed = smoothSpeed;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
}

/**
 * Input state for vehicle controls.
 */
export class VehicleInputComponent extends ActorComponent {
  constructor() {
    super('VehicleInputComponent');
    this.gas = false;
    this.brake = false;
  }
}

/**
 * Game status / HUD component for distance, coins, fuel, high score.
 */
export class GameStatusComponent extends ActorComponent {
  constructor() {
    super('GameStatusComponent');
    this.distance = 0;
    this.highDistance = 0;
    this.coins = 0;
    this.score = 0;
  }
}

/**
 * Audio cue marker for sound triggers.
 */
export class AudioCueComponent extends ActorComponent {
  constructor() {
    super('AudioCueComponent');
    /** @type {string|null} */
    this.pending = null;
  }

  play(cueName) {
    this.pending = cueName;
  }

  consume() {
    const cue = this.pending;
    this.pending = null;
    return cue;
  }
}
