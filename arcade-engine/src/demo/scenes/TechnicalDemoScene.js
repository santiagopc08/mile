import * as THREE from 'three';
import { BaseScene } from '../../engine/scene/BaseScene.js';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { VelocityComponent } from '../../components/VelocityComponent.js';
import { ColliderComponent, CollisionLayer } from '../../components/ColliderComponent.js';
import { PlayerControlComponent } from '../components/PlayerControlComponent.js';
import { TestObjectComponent, TestObjectType } from '../components/TestObjectComponent.js';
import { ObjectPool } from '../../engine/utils/ObjectPool.js';

export class TechnicalDemoScene extends BaseScene {
  constructor() {
    super('TechnicalDemo');
    /** @type {ObjectPool|null} */
    this.stressPool = null;
    /** @type {number[]} Active pooled entity IDs */
    this.pooledEntityIds = [];
  }

  onEnter() {
    if (!this.engine) return;

    const world = this.engine.world;
    const scene = this.engine.rendererManager.scene;

    // Register Keyboard / Action Bindings (Function Keys + Convenient Letter Keys)
    const input = this.engine.inputManager;
    input.registerAction('MOVE_LEFT', { keys: ['ArrowLeft', 'KeyA'] });
    input.registerAction('MOVE_RIGHT', { keys: ['ArrowRight', 'KeyD'] });
    input.registerAction('MOVE_UP', { keys: ['ArrowUp', 'KeyW'] });
    input.registerAction('MOVE_DOWN', { keys: ['ArrowDown', 'KeyS'] });
    input.registerAction('SPRINT', { keys: ['ShiftLeft', 'ShiftRight'] });

    input.registerAction('TOGGLE_DEBUG', { keys: ['F1', 'KeyI'] });
    input.registerAction('CYCLE_CAMERA', { keys: ['F2', 'KeyC'] });
    input.registerAction('SPAWN_POOL', { keys: ['F3', 'KeyO'] });
    input.registerAction('DESPAWN_POOL', { keys: ['F4', 'KeyL'] });
    input.registerAction('RESET_SCENE', { keys: ['F5', 'KeyR'] });
    input.registerAction('PAUSE', { keys: ['Escape', 'KeyP'] });

    // 1. Build Laboratory Floor & Perimeter Walls
    this._buildLaboratoryEnvironment(scene, world);

    // 2. Spawn Generic TestPlayer Entity
    this._spawnTestPlayer(scene, world);

    // 3. Spawn Interactive Test Objects (Coins, Portals, Buttons, Crystals, Platforms)
    this._spawnTestObjects(scene, world);

    // 4. Initialize Stress Test Object Pool
    this._initObjectPool(scene, world);

    this.engine.eventBus.emit('SceneLoaded', { scene: 'TechnicalDemo' });
  }

  onUpdate(dt) {
    if (!this.engine) return;
    const input = this.engine.inputManager;

    // F1 / I: Toggle Debug Overlay
    if (input.wasActionJustPressed('TOGGLE_DEBUG')) {
      this.engine.debugOverlay.toggle();
      this.engine.eventBus.emit('DebugToggle', { visible: this.engine.debugOverlay.isVisible });
    }

    // F3 / O: Spawn 200 Pooled Entities
    if (input.wasActionJustPressed('SPAWN_POOL')) {
      this.spawnStressEntities(200);
    }

    // F4 / L: Despawn & Release Pooled Entities
    if (input.wasActionJustPressed('DESPAWN_POOL')) {
      this.despawnStressEntities();
    }

    // F5 / R: Reset Scene
    if (input.wasActionJustPressed('RESET_SCENE')) {
      this.engine.sceneManager.switchScene('TechnicalDemo');
    }

    // ESC / P: Pause or Resume
    if (input.wasActionJustPressed('PAUSE')) {
      if (this.engine.loop.isPaused) {
        this.engine.resume();
      } else {
        this.engine.pause();
      }
    }
  }

  _buildLaboratoryEnvironment(scene, world) {
    // Floor Grid Plane
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x120f24,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Grid Overlay Line Helper
    const gridHelper = new THREE.GridHelper(36, 36, 0x00ffaa, 0x1a243a);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = 0.01;
    scene.add(gridHelper);

    // Perimeter Wall Entities (Colliders)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x221d3b, roughness: 0.5 });

    const createWall = (x, y, w, h) => {
      const geo = new THREE.BoxGeometry(w, h, 1.5);
      const mesh = new THREE.Mesh(geo, wallMaterial);
      mesh.position.set(x, y, 0.75);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const wallEnt = world.createEntity('Wall');
      world.addComponent(wallEnt, new TransformComponent(x, y, 0));
      world.addComponent(wallEnt, new SpriteComponent({ mesh }));
      world.addComponent(wallEnt, new ColliderComponent({
        type: 'aabb',
        width: w,
        height: h,
        layer: CollisionLayer.WALL,
        mask: CollisionLayer.PLAYER | CollisionLayer.ENEMY,
      }));
    };

    // Outer Perimeter
    createWall(0, 18, 36, 1.0);  // Top Wall
    createWall(0, -18, 36, 1.0); // Bottom Wall
    createWall(-18, 0, 1.0, 36); // Left Wall
    createWall(18, 0, 1.0, 36);  // Right Wall

    // Inner Lab Columns & Obstacles
    createWall(-8, 6, 2.0, 8.0);
    createWall(8, -6, 8.0, 2.0);
    createWall(-6, -8, 3.0, 3.0);
    createWall(6, 8, 3.0, 3.0);
  }

  _spawnTestPlayer(scene, world) {
    const playerGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x004422,
    });
    const playerMesh = new THREE.Mesh(playerGeo, playerMat);
    playerMesh.castShadow = true;
    playerMesh.position.set(0, -10, 0.6);
    scene.add(playerMesh);

    const player = world.createEntity('TestPlayer');
    world.addComponent(player, new TransformComponent(0, -10, 0.6));
    world.addComponent(player, new SpriteComponent({ mesh: playerMesh }));
    world.addComponent(player, new VelocityComponent(0, 0, 18));
    world.addComponent(player, new PlayerControlComponent({ speed: 14, acceleration: 45, friction: 12 }));
    world.addComponent(player, new ColliderComponent({
      type: 'aabb',
      width: 1.2,
      height: 1.2,
      layer: CollisionLayer.PLAYER,
      mask: CollisionLayer.POWERUP | CollisionLayer.WALL | CollisionLayer.ENEMY,
      onCollide: (targetEntity) => {
        this.engine.eventBus.emit('CollisionDetected', {
          entityA: 'TestPlayer',
          entityB: targetEntity.name,
        });

        // Trigger Audio SFX
        this.engine.audioManager.playSFX('sfx_click', 0.6);
        this.engine.eventBus.emit('AudioPlayed', { name: 'sfx_click' });
      },
    }));
  }

  _spawnTestObjects(scene, world) {
    // 1. Interactive Crystals
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.OctahedronGeometry(0.7);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00dbe9, emissive: 0x005577, roughness: 0.2 });
      const mesh = new THREE.Mesh(geo, mat);
      const posX = -10 + i * 6;
      const posY = 12;
      mesh.position.set(posX, posY, 1.0);
      mesh.castShadow = true;
      scene.add(mesh);

      const crystal = world.createEntity(`Crystal_${i}`);
      world.addComponent(crystal, new TransformComponent(posX, posY, 1.0));
      world.addComponent(crystal, new SpriteComponent({ mesh }));
      const testComp = new TestObjectComponent(TestObjectType.CRYSTAL);
      testComp.initialY = posY;
      world.addComponent(crystal, testComp);
      world.addComponent(crystal, new ColliderComponent({
        type: 'circle',
        radius: 0.7,
        layer: CollisionLayer.POWERUP,
        mask: CollisionLayer.PLAYER,
      }));
    }

    // 2. Interactive Coins
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      const posX = -12 + i * 4;
      const posY = 0;
      mesh.position.set(posX, posY, 0.5);
      mesh.castShadow = true;
      scene.add(mesh);

      const coin = world.createEntity(`Coin_${i}`);
      world.addComponent(coin, new TransformComponent(posX, posY, 0.5));
      world.addComponent(coin, new SpriteComponent({ mesh }));
      const testComp = new TestObjectComponent(TestObjectType.COIN);
      testComp.initialY = posY;
      world.addComponent(coin, testComp);
      world.addComponent(coin, new ColliderComponent({
        type: 'circle',
        radius: 0.5,
        layer: CollisionLayer.POWERUP,
        mask: CollisionLayer.PLAYER,
        onCollide: (playerEnt) => {
          // Increment Score & emit event
          const score = this.engine.uiBridge.state.score + 50;
          this.engine.eventBus.emit('ScoreChanged', score);
          this.engine.eventBus.emit('ObjectCollected', { type: 'COIN', id: coin.id });

          scene.remove(mesh);
          world.destroyEntity(coin);
        },
      }));
    }

    // 3. Test Portal Trigger Area
    const portalGeo = new THREE.TorusGeometry(1.2, 0.2, 16, 32);
    const portalMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xaa0033 });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(0, 14, 0.5);
    scene.add(portalMesh);

    const portal = world.createEntity('TestPortal');
    world.addComponent(portal, new TransformComponent(0, 14, 0.5));
    world.addComponent(portal, new SpriteComponent({ mesh: portalMesh }));
    world.addComponent(portal, new ColliderComponent({
      type: 'circle',
      radius: 1.2,
      isTrigger: true,
      layer: CollisionLayer.POWERUP,
      mask: CollisionLayer.PLAYER,
      onCollide: () => {
        this.engine.eventBus.emit('PortalEntered', { portal: 'TestPortal' });
        this.engine.cameraManager.shake(0.6, 0.4);
      },
    }));
  }

  _initObjectPool(scene, world) {
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    this.stressPool = new ObjectPool(() => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      return mesh;
    }, (mesh) => {
      mesh.visible = false;
    }, 200);
  }

  spawnStressEntities(count = 200) {
    if (!this.stressPool || !this.engine) return;
    const world = this.engine.world;

    // Despawn existing pooled entities to maintain clean pool state
    this.despawnStressEntities();

    for (let i = 0; i < count; i++) {
      const mesh = this.stressPool.acquire();
      const posX = (Math.random() - 0.5) * 28;
      const posY = (Math.random() - 0.5) * 28;
      mesh.position.set(posX, posY, 0.3);
      mesh.visible = true;

      const ent = world.createEntity(`StressParticle_${i}`);
      world.addComponent(ent, new TransformComponent(posX, posY, 0.3));
      world.addComponent(ent, new SpriteComponent({ mesh }));
      this.pooledEntityIds.push(ent.id);
    }

    this.engine.eventBus.emit('ObjectPoolSpawned', { count: this.pooledEntityIds.length });
  }

  despawnStressEntities() {
    if (!this.stressPool || !this.engine) return;
    const world = this.engine.world;

    this.pooledEntityIds.forEach((id) => {
      const ent = world.getEntity(id);
      if (ent) {
        const sprite = world.getComponent(ent, SpriteComponent);
        if (sprite && sprite.mesh) {
          this.stressPool.release(sprite.mesh);
        }
        world.destroyEntity(ent);
      }
    });

    this.pooledEntityIds = [];
    this.engine.eventBus.emit('ObjectPoolDespawned', { remaining: 0 });
  }

  onExit() {
    this.despawnStressEntities();
    if (this.stressPool) this.stressPool.clear();
    this.engine.world.clear();
  }
}

