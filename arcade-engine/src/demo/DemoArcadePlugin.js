import * as THREE from 'three';
import { BasePlugin } from '../engine/plugin/BasePlugin.js';
import { BaseScene } from '../engine/scene/BaseScene.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { SpriteComponent } from '../components/SpriteComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { ColliderComponent, CollisionLayer } from '../components/ColliderComponent.js';
import { System } from '../engine/ecs/System.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { EngineEvents } from '../engine/core/EventBus.js';

/**
 * Player Controller System for Demo Workbench.
 */
class PlayerControlSystem extends System {
  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, VelocityComponent]);
  }

  update(dt) {
    if (!this.world || !this.world.engine) return;
    const input = this.world.engine.inputManager;
    const axis = input.getAxisVector('MOVE_LEFT', 'MOVE_RIGHT', 'MOVE_DOWN', 'MOVE_UP');

    const entities = this.world.getEntitiesForQuery(this.query);
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (ent.name === 'Player') {
        const vel = this.world.getComponent(ent, VelocityComponent);
        const speed = 12;
        vel.velocity.x = axis.x * speed;
        vel.velocity.y = axis.y * speed;
      }
    }
  }
}

/**
 * Main Gameplay Scene for Demo Plugin.
 */
class DemoGameplayScene extends BaseScene {
  constructor() {
    super('DemoGameplay');
  }

  onEnter() {
    if (!this.engine) return;
    const world = this.engine.world;
    const scene = this.engine.rendererManager.scene;

    // Set up Input Actions
    this.engine.inputManager.registerAction('MOVE_LEFT', { keys: ['ArrowLeft', 'KeyA'] });
    this.engine.inputManager.registerAction('MOVE_RIGHT', { keys: ['ArrowRight', 'KeyD'] });
    this.engine.inputManager.registerAction('MOVE_UP', { keys: ['ArrowUp', 'KeyW'] });
    this.engine.inputManager.registerAction('MOVE_DOWN', { keys: ['ArrowDown', 'KeyS'] });

    // 1. Create Player Entity
    const playerGeo = new THREE.BoxGeometry(1, 1, 0.2);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ffaa, roughness: 0.2 });
    const playerMesh = new THREE.Mesh(playerGeo, playerMat);
    scene.add(playerMesh);

    const player = world.createEntity('Player');
    world.addComponent(player, new TransformComponent(0, -3, 0));
    world.addComponent(player, new SpriteComponent({ mesh: playerMesh }));
    world.addComponent(player, new VelocityComponent(0, 0, 15));
    world.addComponent(player, new ColliderComponent({
      type: 'aabb',
      width: 1,
      height: 1,
      layer: CollisionLayer.PLAYER,
      mask: CollisionLayer.POWERUP | CollisionLayer.ENEMY,
      onCollide: (targetEntity) => {
        if (targetEntity.name.startsWith('Collectible')) {
          // Increment Score
          const currentScore = this.engine.uiBridge.state.score + 100;
          this.engine.eventBus.emit(EngineEvents.SCORE_CHANGED, currentScore);

          // Remove collectible mesh from scene
          const targetSprite = world.getComponent(targetEntity, SpriteComponent);
          if (targetSprite && targetSprite.mesh) {
            scene.remove(targetSprite.mesh);
          }
          world.destroyEntity(targetEntity);
        }
      },
    }));

    // 2. Create Collectible Entities
    for (let i = 0; i < 5; i++) {
      const colGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const colMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xaa0033 });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      const posX = (Math.random() - 0.5) * 12;
      const posY = Math.random() * 4 + 1;
      colMesh.position.set(posX, posY, 0);
      scene.add(colMesh);

      const item = world.createEntity(`Collectible_${i}`);
      world.addComponent(item, new TransformComponent(posX, posY, 0));
      world.addComponent(item, new SpriteComponent({ mesh: colMesh }));
      world.addComponent(item, new ColliderComponent({
        type: 'circle',
        radius: 0.4,
        layer: CollisionLayer.POWERUP,
        mask: CollisionLayer.PLAYER,
      }));
    }
  }

  onExit() {
    this.engine.world.clear();
  }
}

/**
 * Demo Arcade Game Plugin.
 */
export class DemoArcadePlugin extends BasePlugin {
  constructor() {
    super('demo-arcade-plugin', 'ARCADE ENGINE WORKBENCH');
  }

  async loadAssets(assetManager) {
    assetManager.createPlaceholderTexture('player', '#00ffaa', 32);
    assetManager.createPlaceholderTexture('item', '#ff0055', 32);
  }

  registerComponents(world) {}

  registerSystems(world) {
    world.addSystem(new PlayerControlSystem());
    world.addSystem(new MovementSystem());
    world.addSystem(new CollisionSystem());
    world.addSystem(new RenderSystem());
  }

  registerScenes(sceneManager) {
    const gameplayScene = new DemoGameplayScene();
    sceneManager.registerScene(gameplayScene);
    sceneManager.switchScene('DemoGameplay');
  }
}
