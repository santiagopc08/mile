import {
  Actor,
  ActorTag,
  TransformComponent,
  MovementComponent,
  FreeMovementController,
  MovementMode,
  SpriteComponent,
  PresentationComponent,
} from '../../sdk/index.js';
import { MinimalAssets } from './Assets.js';

export class PlayerActorFactory {
  static createPlayer(id = 'player_01', startX = 0, startY = 0) {
    const player = new Actor(id, 'PlayerActor');
    player.addTag(ActorTag.PLAYER);

    // 1. Spatial Transform Component
    const transform = player.addComponent(new TransformComponent(startX, startY));

    // 2. Movement Component & Controller
    const movement = player.addComponent(new MovementComponent(5.0, MovementMode.FREE));
    movement.setController(new FreeMovementController());

    // 3. Visual Presentation & Sprite Components
    const presentation = player.addComponent(new PresentationComponent());
    presentation.sortingOrder = 10;

    const sprite = player.addComponent(new SpriteComponent(MinimalAssets.PLAYER_SPRITE));

    return player;
  }
}
