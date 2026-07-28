import { System } from '../../engine/ecs/System.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { PacmanGridComponent } from '../components/PacmanGridComponent.js';
import { GhostAIComponent } from '../components/GhostAIComponent.js';
import { PelletComponent } from '../components/PelletComponent.js';
import { PelletType, GhostState } from '../PacmanConstants.js';

export class PacmanAnimationSystem extends System {
  constructor() {
    super();
    this.timer = 0.0;
  }

  init(world) {
    super.init(world);
    this.pacmanQuery = this.world.createQuery([SpriteComponent, PacmanGridComponent]);
    this.ghostQuery = this.world.createQuery([SpriteComponent, GhostAIComponent]);
    this.pelletQuery = this.world.createQuery([SpriteComponent, PelletComponent]);
  }

  update(dt) {
    this.timer += dt;

    // 1. Pac-Man Mouth Open/Close Animation
    const pacmans = this.world.getEntitiesForQuery(this.pacmanQuery);
    for (let i = 0; i < pacmans.length; i++) {
      const sprite = this.world.getComponent(pacmans[i], SpriteComponent);
      const grid = this.world.getComponent(pacmans[i], PacmanGridComponent);

      if (sprite && sprite.mesh) {
        // Mouth chomp rotation
        if (grid.mouthOpening) {
          grid.mouthAngle += 15.0 * dt;
          if (grid.mouthAngle >= 0.7) grid.mouthOpening = false;
        } else {
          grid.mouthAngle -= 15.0 * dt;
          if (grid.mouthAngle <= 0.05) grid.mouthOpening = true;
        }

        sprite.mesh.rotation.z = grid.currentDirection.angle + Math.sin(grid.mouthAngle) * 0.2;
      }
    }

    // 2. Ghost Color & Frightened Flashing
    const ghosts = this.world.getEntitiesForQuery(this.ghostQuery);
    for (let i = 0; i < ghosts.length; i++) {
      const sprite = this.world.getComponent(ghosts[i], SpriteComponent);
      const ghostAI = this.world.getComponent(ghosts[i], GhostAIComponent);

      if (sprite && sprite.mesh && sprite.mesh.material) {
        if (ghostAI.state === GhostState.FRIGHTENED) {
          if (ghostAI.frightenedTimer < 2.0 && Math.floor(this.timer * 8.0) % 2 === 0) {
            sprite.mesh.material.color.setHex(0xffffff); // Flashing White
          } else {
            sprite.mesh.material.color.setHex(0x0000ff); // Vulnerable Blue
          }
        } else if (ghostAI.state === GhostState.EYES) {
          sprite.mesh.material.color.setHex(0x888888); // Grey Eyes
        } else {
          // Normal Ghost Color
          switch (ghostAI.type) {
            case 'BLINKY': sprite.mesh.material.color.setHex(0xff0000); break;
            case 'PINKY':  sprite.mesh.material.color.setHex(0xffb8ff); break;
            case 'INKY':   sprite.mesh.material.color.setHex(0x00ffff); break;
            case 'CLYDE':  sprite.mesh.material.color.setHex(0xffb852); break;
          }
        }
      }
    }

    // 3. Power Pellet Pulsing
    const pellets = this.world.getEntitiesForQuery(this.pelletQuery);
    for (let i = 0; i < pellets.length; i++) {
      const pellet = this.world.getComponent(pellets[i], PelletComponent);
      const sprite = this.world.getComponent(pellets[i], SpriteComponent);

      if (pellet.type === PelletType.POWER && sprite && sprite.mesh) {
        const scale = 1.0 + Math.sin(this.timer * 6.0) * 0.25;
        sprite.mesh.scale.set(scale, scale, scale);
      }
    }
  }
}
