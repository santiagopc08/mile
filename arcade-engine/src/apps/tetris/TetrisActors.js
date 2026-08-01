import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  GridPositionComponent,
  TetrominoComponent,
  TetrisInputComponent,
  GameStatusComponent,
  AudioCueComponent,
} from './TetrisComponents.js';
import { TetrominoType } from './TetrisEvents.js';

export const GRID_CONFIG = Object.freeze({
  WIDTH: 10,
  HEIGHT: 20,
  START_X: 3,
  START_Y: 0,
});

export class PieceFactory {
  static createPiece(type = TetrominoType.T, gridX = GRID_CONFIG.START_X, gridY = GRID_CONFIG.START_Y) {
    const piece = new Actor(`piece_${type}_${Date.now()}`, `Tetromino_${type}`);
    piece.addTag(ActorTag.PLAYER);
    piece.addTag('TETROMINO');

    piece.addComponent(new GridPositionComponent(gridX, gridY));
    piece.addComponent(new TransformComponent(gridX, gridY));
    piece.addComponent(new TetrominoComponent(type));
    piece.addComponent(new TetrisInputComponent());
    piece.addComponent(new AudioCueComponent());

    const pres = piece.addComponent(new PresentationComponent());
    pres.sortingOrder = 20;

    return piece;
  }
}

let blockIdCounter = 0;

export class BlockFactory {
  static createBlock(x, y, color = '#ffffff') {
    const id = `block_${blockIdCounter++}`;
    const block = new Actor(id, 'GridBlock');
    block.addTag('BLOCK');

    block.addComponent(new GridPositionComponent(x, y));
    block.addComponent(new TransformComponent(x, y));

    const pres = block.addComponent(new PresentationComponent());
    pres.sortingOrder = 10;
    block.addComponent(new SpriteComponent(`urn:arcade:textures:block_${color}`));

    block.color = color;
    return block;
  }

  static resetCounter() {
    blockIdCounter = 0;
  }
}

export class HudFactory {
  static create() {
    const hud = new Actor('tetris_hud', 'TetrisHUD');
    hud.addTag('HUD');
    hud.addComponent(new GameStatusComponent());
    return hud;
  }
}
