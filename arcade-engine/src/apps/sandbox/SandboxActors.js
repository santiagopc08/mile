import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  CapabilityComponent,
  CustomScriptComponent,
  DebugInspectorComponent,
  AudioSourceComponent,
  LightComponent,
  GameStatusComponent,
  AudioCueComponent,
} from './SandboxComponents.js';

export class SandboxActorFactory {
  static createCamera(x = 0, y = 0) {
    const cam = new Actor('camera_main', 'MainCamera');
    cam.addTag('CAMERA');
    cam.addComponent(new TransformComponent(x, y));
    cam.addComponent(new CapabilityComponent('RENDERING'));
    return cam;
  }

  static createPlayer(x = 0, y = 0) {
    const player = new Actor('player_sandbox', 'Player');
    player.addTag(ActorTag.PLAYER);
    player.addComponent(new TransformComponent(x, y));
    player.addComponent(new CapabilityComponent('PHYSICS'));
    player.addComponent(new DebugInspectorComponent());
    player.addComponent(new AudioCueComponent());

    const pres = player.addComponent(new PresentationComponent());
    pres.sortingOrder = 20;
    player.addComponent(new SpriteComponent('urn:arcade:textures:player_sandbox'));

    return player;
  }

  static createVehicle(x = 5, y = 0) {
    const car = new Actor('vehicle_sandbox', 'Vehicle');
    car.addTag('VEHICLE');
    car.addComponent(new TransformComponent(x, y));
    car.addComponent(new CapabilityComponent('PHYSICS'));
    car.addComponent(new DebugInspectorComponent());

    const pres = car.addComponent(new PresentationComponent());
    pres.sortingOrder = 15;
    car.addComponent(new SpriteComponent('urn:arcade:textures:car'));

    return car;
  }

  static createNPC(x = -5, y = 0) {
    const npc = new Actor('npc_sandbox', 'NPC');
    npc.addTag(ActorTag.NPC);
    npc.addComponent(new TransformComponent(x, y));
    npc.addComponent(new CapabilityComponent('COGNITION'));
    npc.addComponent(new CapabilityComponent('NAVIGATION'));
    npc.addComponent(new DebugInspectorComponent());

    const pres = npc.addComponent(new PresentationComponent());
    pres.sortingOrder = 15;
    npc.addComponent(new SpriteComponent('urn:arcade:textures:npc'));

    return npc;
  }

  static createLight(x = 0, y = 10) {
    const light = new Actor('light_sun', 'SunLight');
    light.addTag('LIGHT');
    light.addComponent(new TransformComponent(x, y));
    light.addComponent(new LightComponent('#ffffff', 1.5, 50.0));
    light.addComponent(new CapabilityComponent('RENDERING'));
    return light;
  }

  static createProp(id, name, x = 0, y = 0) {
    const prop = new Actor(id, name);
    prop.addTag(ActorTag.DECORATION);
    prop.addComponent(new TransformComponent(x, y));
    prop.addComponent(new DebugInspectorComponent());

    const pres = prop.addComponent(new PresentationComponent());
    pres.sortingOrder = 5;
    prop.addComponent(new SpriteComponent('urn:arcade:textures:prop'));

    return prop;
  }

  static createDebugActor(id = 'debug_01') {
    const debug = new Actor(id, 'DebugActor');
    debug.addTag('DEBUG');
    debug.addComponent(new TransformComponent(0, 0));
    debug.addComponent(new DebugInspectorComponent());
    return debug;
  }
}

export class HudFactory {
  static create() {
    const hud = new Actor('sandbox_hud', 'SandboxHUD');
    hud.addTag('HUD');
    hud.addComponent(new GameStatusComponent());
    return hud;
  }
}
