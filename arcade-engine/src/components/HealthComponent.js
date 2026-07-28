import { Component } from '../engine/ecs/Component.js';

export class HealthComponent extends Component {
  constructor(maxHealth = 100) {
    super();
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.invulnerableTimer = 0;
  }

  damage(amount) {
    if (this.invulnerableTimer > 0) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    return true;
  }

  heal(amount) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }
}
Component.register(HealthComponent);
