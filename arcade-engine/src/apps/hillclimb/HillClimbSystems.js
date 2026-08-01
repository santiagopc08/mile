import { FIELD } from './HillClimbActors.js';

// ──────────────────────────────────────────
// System: Vehicle Input Handling
// ──────────────────────────────────────────
export class VehicleInputSystem {
  update(chassis) {
    const input = chassis.getComponent('VehicleInputComponent');
    const engine = chassis.getComponent('EngineComponent');
    if (!input || !engine) return;

    if (input.gas) {
      engine.throttle = 1.0;
    } else if (input.brake) {
      engine.throttle = -0.6; // Reverse / Brake
    } else {
      engine.throttle = 0;
    }
  }
}

// ──────────────────────────────────────────
// System: Fixed Physics Engine & Suspension Constraints
// ──────────────────────────────────────────
export class PhysicsEngineSystem {
  /**
   * Run physics integration and spring suspension constraint resolution.
   */
  update(dt, vehicle, terrain) {
    const { chassis, frontWheel, rearWheel } = vehicle;

    const cBody = chassis.getComponent('RigidBodyComponent');
    const cTc = chassis.getComponent('TransformComponent');
    const cRot = chassis.getComponent('RotationComponent') || { angle: cTc.rotation };
    const engine = chassis.getComponent('EngineComponent');
    const audio = chassis.getComponent('AudioCueComponent');

    const fJoint = chassis.getComponent('WheelJointComponent');
    const rJoint = chassis.getComponent('WheelJointComponent'); // Note: multiple joint query

    if (!cBody || !cTc || !engine) return;

    // 1. Gravity Force on Chassis & Wheels
    cBody.vy += FIELD.GRAVITY * dt;

    if (frontWheel) {
      const fwBody = frontWheel.getComponent('RigidBodyComponent');
      if (fwBody) fwBody.vy += FIELD.GRAVITY * dt;
    }
    if (rearWheel) {
      const rwBody = rearWheel.getComponent('RigidBodyComponent');
      if (rwBody) rwBody.vy += FIELD.GRAVITY * dt;
    }

    // 2. Engine Torque on Drive Wheels
    const driveTorque = engine.throttle * engine.maxTorque;

    // 3. Terrain Collision & Ground Reaction for Wheels
    this._updateWheelPhysics(dt, frontWheel, terrain, driveTorque * 0.4);
    this._updateWheelPhysics(dt, rearWheel, terrain, driveTorque * 0.6);

    // 4. Spring-Damper Suspension Constraints (chassis <-> wheels)
    this._applySuspension(dt, chassis, frontWheel, FIELD.FRONT_WHEEL_OFFSET);
    this._applySuspension(dt, chassis, rearWheel, FIELD.REAR_WHEEL_OFFSET);

    // 5. Position & Velocity Integration for Chassis
    cTc.x += cBody.vx * dt;
    cTc.y += cBody.vy * dt;
    cTc.rotation += cBody.angularVelocity * dt;

    // 6. Air Drag
    cBody.vx *= Math.pow(0.98, dt * 60);
    cBody.vy *= Math.pow(0.98, dt * 60);

    // Chassis terrain ground impact check (prevents falling below ground)
    const groundY = terrain.getHeight(cTc.x);
    if (cTc.y < groundY + FIELD.CHASSIS_RADIUS) {
      cTc.y = groundY + FIELD.CHASSIS_RADIUS;
      cBody.vy = Math.max(0, cBody.vy * -0.2);
    }
  }

  _updateWheelPhysics(dt, wheel, terrain, torque) {
    if (!wheel) return;
    const body = wheel.getComponent('RigidBodyComponent');
    const tc = wheel.getComponent('TransformComponent');
    if (!body || !tc) return;

    // Apply Drive Torque into horizontal velocity
    body.vx += (torque / body.mass) * dt;

    // Position Integration
    tc.x += body.vx * dt;
    tc.y += body.vy * dt;

    // Terrain Surface Height Evaluation
    const groundY = terrain.getHeight(tc.x);
    const minHeight = groundY + FIELD.WHEEL_RADIUS;

    if (tc.y <= minHeight) {
      // Ground Contact Reaction
      tc.y = minHeight;
      const slope = terrain.getSlope(tc.x);

      // Normal Ground Reaction & Rebound
      if (body.vy < 0) {
        body.vy = -body.vy * body.restitution;
      }

      // Slope Acceleration: Component of gravity along incline
      const slopeAccel = -Math.sin(Math.atan(slope)) * Math.abs(FIELD.GRAVITY);
      body.vx += slopeAccel * dt;

      // Ground Friction Damping
      body.vx *= Math.pow(body.friction, dt * 60);
    }

    body.vx *= Math.pow(0.99, dt * 60);
  }

  _applySuspension(dt, chassis, wheel, offsetX) {
    if (!wheel) return;
    const cTc = chassis.getComponent('TransformComponent');
    const cBody = chassis.getComponent('RigidBodyComponent');
    const wTc = wheel.getComponent('TransformComponent');
    const wBody = wheel.getComponent('RigidBodyComponent');
    if (!cTc || !cBody || !wTc || !wBody) return;

    // Ideal wheel position relative to chassis
    const idealX = cTc.x + offsetX;
    const idealY = cTc.y - 1.2;

    // Horizontal Spring Constraint & Drive Force Transfer
    const dx = idealX - wTc.x;
    wBody.vx += dx * 30 * dt;
    cBody.vx += (wBody.vx - cBody.vx) * 5.0 * dt;

    // Vertical Suspension Spring Force
    const dy = idealY - wTc.y;
    const springForce = dy * 80;
    wBody.vy += springForce * dt;
    cBody.vy -= springForce * 0.3 * dt;
  }
}

// ──────────────────────────────────────────
// System: Dynamic Camera Follow
// ──────────────────────────────────────────
export class CameraFollowSystem {
  update(dt, camera, targetActor) {
    if (!targetActor) return;
    const targetTc = targetActor.getComponent('TransformComponent');
    const cameraComp = targetActor.getComponent('CameraFollowComponent');
    if (!targetTc) return;

    const smooth = cameraComp ? cameraComp.smoothSpeed : 5.0;
    const offsetX = cameraComp ? cameraComp.offsetX : 10;
    const offsetY = cameraComp ? cameraComp.offsetY : 5;

    const targetCamX = targetTc.x + offsetX;
    const targetCamY = targetTc.y + offsetY;

    camera.x += (targetCamX - camera.x) * Math.min(1.0, smooth * dt);
    camera.y += (targetCamY - camera.y) * Math.min(1.0, smooth * dt);
  }
}

// ──────────────────────────────────────────
// System: Collectibles System (Coins & Fuel Cans)
// ──────────────────────────────────────────
export class CollectibleSystem {
  /**
   * Check overlap between vehicle chassis/wheels and collectibles.
   * @returns {{ collectedCoins: any[], collectedFuel: any[] }}
   */
  update(vehicle, collectibles) {
    const { chassis } = vehicle;
    const cTc = chassis.getComponent('TransformComponent');
    if (!cTc) return { collectedCoins: [], collectedFuel: [] };

    const collectedCoins = [];
    const collectedFuel = [];

    for (const item of collectibles) {
      const itc = item.getComponent('TransformComponent');
      if (!itc) continue;

      const dist = Math.hypot(cTc.x - itc.x, cTc.y - itc.y);
      if (dist <= item.radius + FIELD.CHASSIS_RADIUS) {
        if (item.hasTag('COIN')) {
          collectedCoins.push(item);
        } else if (item.hasTag('FUEL')) {
          collectedFuel.push(item);
        }
      }
    }

    return { collectedCoins, collectedFuel };
  }
}
