import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  GridPositionComponent,
  NavigationComponent,
  PacmanInputComponent,
  GhostBehaviorComponent,
  PerceptionComponent,
  GameStatusComponent,
  AudioCueComponent,
} from './PacmanComponents.js';
import { GhostType, Direction } from './PacmanEvents.js';

export class PacmanActorFactory {
  static createPacman(gridX = 13, gridY = 23) {
    const pacman = new Actor('pacman', 'PacMan');
    pacman.addTag(ActorTag.PLAYER);
    pacman.addTag('PACMAN');

    const pos = pacman.addComponent(new GridPositionComponent(gridX, gridY));
    pacman.addComponent(new TransformComponent(gridX, gridY));
    const nav = pacman.addComponent(new NavigationComponent());
    nav.currentDirection = Direction.LEFT;
    pacman.addComponent(new PacmanInputComponent());
    pacman.addComponent(new AudioCueComponent());

    const pres = pacman.addComponent(new PresentationComponent());
    pres.sortingOrder = 30;
    pacman.addComponent(new SpriteComponent('urn:arcade:textures:pacman'));

    pacman.gridX = gridX;
    pacman.gridY = gridY;

    return pacman;
  }
}

export class GhostActorFactory {
  static createGhost(ghostType = GhostType.BLINKY, gridX = 13, gridY = 11) {
    const nameMap = {
      BLINKY: 'Blinky',
      PINKY: 'Pinky',
      INKY: 'Inky',
      CLYDE: 'Clyde',
    };

    const cornerMap = {
      BLINKY: { x: 25, y: 0 },   // Top-Right
      PINKY:  { x: 2, y: 0 },    // Top-Left
      INKY:   { x: 27, y: 30 },  // Bottom-Right
      CLYDE:  { x: 0, y: 30 },   // Bottom-Left
    };

    const id = `ghost_${ghostType.toLowerCase()}`;
    const ghost = new Actor(id, nameMap[ghostType] || 'Ghost');
    ghost.addTag(ActorTag.ENEMY);
    ghost.addTag('GHOST');

    ghost.addComponent(new GridPositionComponent(gridX, gridY));
    ghost.addComponent(new TransformComponent(gridX, gridY));
    ghost.addComponent(new NavigationComponent());
    ghost.addComponent(new GhostBehaviorComponent(ghostType, cornerMap[ghostType]));
    ghost.addComponent(new PerceptionComponent());

    const pres = ghost.addComponent(new PresentationComponent());
    pres.sortingOrder = 25;
    ghost.addComponent(new SpriteComponent(`urn:arcade:textures:ghost_${ghostType.toLowerCase()}`));

    ghost.gridX = gridX;
    ghost.gridY = gridY;

    return ghost;
  }
}

export class PelletFactory {
  static createPellet(id, gridX, gridY, isPower = false) {
    const pellet = new Actor(id, isPower ? 'PowerPellet' : 'Pellet');
    pellet.addTag(ActorTag.COLLECTIBLE);
    pellet.addTag(isPower ? 'POWER_PELLET' : 'PELLET');

    pellet.addComponent(new GridPositionComponent(gridX, gridY));
    pellet.addComponent(new TransformComponent(gridX, gridY));

    const pres = pellet.addComponent(new PresentationComponent());
    pres.sortingOrder = 5;
    pellet.addComponent(
      new SpriteComponent(isPower ? 'urn:arcade:textures:power_pellet' : 'urn:arcade:textures:pellet')
    );

    pellet.gridX = gridX;
    pellet.gridY = gridY;
    pellet.isPower = isPower;
    pellet.points = isPower ? 50 : 10;

    return pellet;
  }
}

export class FruitFactory {
  static createFruit(gridX = 13, gridY = 17, points = 100) {
    const fruit = new Actor('fruit_active', 'Fruit');
    fruit.addTag(ActorTag.COLLECTIBLE);
    fruit.addTag('FRUIT');

    fruit.addComponent(new GridPositionComponent(gridX, gridY));
    fruit.addComponent(new TransformComponent(gridX, gridY));

    const pres = fruit.addComponent(new PresentationComponent());
    pres.sortingOrder = 10;
    fruit.addComponent(new SpriteComponent('urn:arcade:textures:cherry'));

    fruit.gridX = gridX;
    fruit.gridY = gridY;
    fruit.points = points;

    return fruit;
  }
}

export class HudFactory {
  static create() {
    const hud = new Actor('pacman_hud', 'PacmanHUD');
    hud.addTag('HUD');
    hud.addComponent(new GameStatusComponent(3));
    return hud;
  }
}
