import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  HierarchyComponent,
  SelectionComponent,
  InspectorComponent,
  PersistenceComponent,
  UIWidgetComponent,
  AudioCueComponent,
} from './SimulationComponents.js';

export class SimulationActorFactory {
  static createCamera(x = 0, y = 0) {
    const cam = new Actor('camera_viewport', 'ViewportCamera');
    cam.addTag('CAMERA');
    cam.addComponent(new TransformComponent(x, y));
    return cam;
  }

  static createEntity(id, name, x = 0, y = 0) {
    const entity = new Actor(id, name);
    entity.addTag('ENTITY');

    entity.addComponent(new TransformComponent(x, y));
    entity.addComponent(new HierarchyComponent());
    entity.addComponent(new SelectionComponent(true));
    entity.addComponent(new InspectorComponent({ name, opacity: 1.0, scale: 1.0 }));
    entity.addComponent(new PersistenceComponent(['x', 'y', 'rotation', 'name']));
    entity.addComponent(new AudioCueComponent());

    const pres = entity.addComponent(new PresentationComponent());
    pres.sortingOrder = 10;
    entity.addComponent(new SpriteComponent('urn:arcade:textures:entity_node'));

    return entity;
  }

  static createLight(id = 'light_ambient', x = 0, y = 0) {
    const light = new Actor(id, 'AmbientLight');
    light.addTag('LIGHT');

    light.addComponent(new TransformComponent(x, y));
    light.addComponent(new SelectionComponent(true));
    light.addComponent(new InspectorComponent({ intensity: 1.0, color: '#ffffff' }));

    const pres = light.addComponent(new PresentationComponent());
    pres.sortingOrder = 5;
    light.addComponent(new SpriteComponent('urn:arcade:textures:light_bulb'));

    return light;
  }

  static createWidget(id, label, x = 0, y = 0) {
    const widget = new Actor(id, label);
    widget.addTag('UI');

    widget.addComponent(new TransformComponent(x, y));
    widget.addComponent(new UIWidgetComponent('PANEL', label));
    widget.addComponent(new SelectionComponent(false));

    return widget;
  }

  static createDebugTool(id = 'debug_tool_01') {
    const tool = new Actor(id, 'DebugInspectorTool');
    tool.addTag('DEBUG');
    tool.addComponent(new TransformComponent(0, 0));
    tool.addComponent(new InspectorComponent({ inspectMode: 'ALL' }));
    return tool;
  }
}

export class HudFactory {
  static create() {
    const hud = new Actor('simulation_hud', 'SimulationHUD');
    hud.addTag('HUD');
    return hud;
  }
}
