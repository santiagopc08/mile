import { Component } from '../../engine/ecs/Component.js';

export const TestObjectType = Object.freeze({
  BOX: 'BOX',
  COIN: 'COIN',
  PORTAL: 'PORTAL',
  BUTTON: 'BUTTON',
  SWITCH: 'SWITCH',
  CRYSTAL: 'CRYSTAL',
  LIGHT: 'LIGHT',
  PLATFORM: 'PLATFORM',
});

export class TestObjectComponent extends Component {
  constructor(type = TestObjectType.BOX, { interactable = true, tag = 'test-object' } = {}) {
    super();
    this.type = type;
    this.interactable = interactable;
    this.tag = tag;
    this.activated = false;
    this.initialY = 0;
    this.pulseTimer = 0;
  }
}
Component.register(TestObjectComponent);
