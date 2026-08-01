import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';

/**
 * Component binding an actor to an active domain capability.
 */
export class CapabilityComponent extends ActorComponent {
  constructor(domainCapability = 'PHYSICS') {
    super('CapabilityComponent');
    this.domainCapability = domainCapability;
  }
}

/**
 * Custom script component allowing dynamic behavior injection.
 */
export class CustomScriptComponent extends ActorComponent {
  constructor(scriptName = 'DefaultScript', updateFn = null) {
    super('CustomScriptComponent');
    this.scriptName = scriptName;
    this.updateFn = updateFn;
  }

  onUpdate(dt) {
    if (this.enabled && typeof this.updateFn === 'function') {
      this.updateFn(this.owner, dt);
    }
  }
}

/**
 * Debug Inspector Component for live runtime inspection.
 */
export class DebugInspectorComponent extends ActorComponent {
  constructor() {
    super('DebugInspectorComponent');
    this.inspectCount = 0;
    this.lastState = 'OK';
  }

  inspect() {
    this.inspectCount++;
    return {
      actorId: this.owner ? this.owner.id : null,
      componentsCount: this.owner ? this.owner.components.components.size : 0,
      state: this.owner ? this.owner.state : 'UNKNOWN',
    };
  }
}

/**
 * Audio Source component for spatial audio emission.
 */
export class AudioSourceComponent extends ActorComponent {
  constructor(soundUri = '', volume = 1.0) {
    super('AudioSourceComponent');
    this.soundUri = soundUri;
    this.volume = volume;
    this.playing = false;
  }
}

/**
 * Light component for scene illumination.
 */
export class LightComponent extends ActorComponent {
  constructor(color = '#ffffff', intensity = 1.0, radius = 10.0) {
    super('LightComponent');
    this.color = color;
    this.intensity = intensity;
    this.radius = radius;
  }
}

/**
 * Game Status & Diagnostics HUD component.
 */
export class GameStatusComponent extends ActorComponent {
  constructor() {
    super('GameStatusComponent');
    this.activeActorsCount = 0;
    this.activeCapabilitiesCount = 0;
    this.loadedPluginsCount = 0;
    this.fps = 60;
  }
}

/**
 * Audio cue marker.
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
