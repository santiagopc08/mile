import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';

export class FoodActorFactory {
  static createFood(id = 'food_01', gridX = 5, gridY = 5) {
    const food = new Actor(id, 'FoodActor');
    food.addTag(ActorTag.COLLECTIBLE);

    food.addComponent(new TransformComponent(gridX, gridY));
    const presentation = food.addComponent(new PresentationComponent());
    presentation.sortingOrder = 5;
    food.addComponent(new SpriteComponent('urn:arcade:textures:food_apple'));

    food.gridX = gridX;
    food.gridY = gridY;

    return food;
  }
}
