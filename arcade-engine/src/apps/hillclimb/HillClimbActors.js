import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  RigidBodyComponent,
  WheelJointComponent,
  EngineComponent,
  FuelTankComponent,
  CameraFollowComponent,
  VehicleInputComponent,
  GameStatusComponent,
  AudioCueComponent,
} from './HillClimbComponents.js';

export const FIELD = Object.freeze({
  GRAVITY: -25.0,
  WHEEL_RADIUS: 0.8,
  CHASSIS_RADIUS: 1.5,
  FRONT_WHEEL_OFFSET: 1.8,
  REAR_WHEEL_OFFSET: -1.8,
});

export class VehicleFactory {
  /**
   * Create a Composite Vehicle Actor consisting of Chassis + Front Wheel + Rear Wheel.
   */
  static createVehicle(startX = 10, startY = 32) {
    // 1. Chassis Actor
    const chassis = new Actor('vehicle_chassis', 'VehicleChassis');
    chassis.addTag(ActorTag.PLAYER);
    chassis.addTag('VEHICLE');

    chassis.addComponent(new TransformComponent(startX, startY));
    chassis.addComponent(new RigidBodyComponent(3.0, 0.1, 0.5)); // Chassis mass = 3.0
    chassis.addComponent(new EngineComponent(90, 40));
    chassis.addComponent(new FuelTankComponent(100, 3.0));
    chassis.addComponent(new CameraFollowComponent(6.0, 8, 3));
    chassis.addComponent(new VehicleInputComponent());
    chassis.addComponent(new AudioCueComponent());

    const frontJoint = chassis.addComponent(new WheelJointComponent(FIELD.FRONT_WHEEL_OFFSET, -1.0, 150, 10, 1.2));
    const rearJoint = chassis.addComponent(new WheelJointComponent(FIELD.REAR_WHEEL_OFFSET, -1.0, 150, 10, 1.2));

    const chassisPres = chassis.addComponent(new PresentationComponent());
    chassisPres.sortingOrder = 25;
    chassis.addComponent(new SpriteComponent('urn:arcade:textures:jeep_chassis'));

    // 2. Front Wheel Actor
    const frontWheel = new Actor('wheel_front', 'FrontWheel');
    frontWheel.addTag('WHEEL');
    frontWheel.addComponent(new TransformComponent(startX + FIELD.FRONT_WHEEL_OFFSET, startY - 1.2));
    frontWheel.addComponent(new RigidBodyComponent(1.0, 0.3, 0.9)); // Wheel mass = 1.0
    const fPres = frontWheel.addComponent(new PresentationComponent());
    fPres.sortingOrder = 20;
    frontWheel.addComponent(new SpriteComponent('urn:arcade:textures:wheel'));

    // 3. Rear Wheel Actor
    const rearWheel = new Actor('wheel_rear', 'RearWheel');
    rearWheel.addTag('WHEEL');
    rearWheel.addComponent(new TransformComponent(startX + FIELD.REAR_WHEEL_OFFSET, startY - 1.2));
    rearWheel.addComponent(new RigidBodyComponent(1.0, 0.3, 0.9));
    const rPres = rearWheel.addComponent(new PresentationComponent());
    rPres.sortingOrder = 20;
    rearWheel.addComponent(new SpriteComponent('urn:arcade:textures:wheel'));

    frontJoint.wheelActor = frontWheel;
    rearJoint.wheelActor = rearWheel;

    return {
      chassis,
      frontWheel,
      rearWheel,
    };
  }
}

let collectibleIdCounter = 0;

export class CoinFactory {
  static createCoin(x, y, value = 5) {
    const coin = new Actor(`coin_${collectibleIdCounter++}`, 'Coin');
    coin.addTag(ActorTag.COLLECTIBLE);
    coin.addTag('COIN');

    coin.addComponent(new TransformComponent(x, y));
    const pres = coin.addComponent(new PresentationComponent());
    pres.sortingOrder = 15;
    coin.addComponent(new SpriteComponent('urn:arcade:textures:coin_gold'));

    coin.value = value;
    coin.radius = 1.0;
    return coin;
  }
}

export class FuelCanFactory {
  static createFuelCan(x, y, amount = 50) {
    const fuelCan = new Actor(`fuel_${collectibleIdCounter++}`, 'FuelCan');
    fuelCan.addTag(ActorTag.COLLECTIBLE);
    fuelCan.addTag('FUEL');

    fuelCan.addComponent(new TransformComponent(x, y));
    const pres = fuelCan.addComponent(new PresentationComponent());
    pres.sortingOrder = 15;
    fuelCan.addComponent(new SpriteComponent('urn:arcade:textures:fuel_can'));

    fuelCan.amount = amount;
    fuelCan.radius = 1.2;
    return fuelCan;
  }

  static resetCounter() {
    collectibleIdCounter = 0;
  }
}

export class HudFactory {
  static create() {
    const hud = new Actor('hillclimb_hud', 'HillClimbHUD');
    hud.addTag('HUD');
    hud.addComponent(new GameStatusComponent());
    return hud;
  }
}
