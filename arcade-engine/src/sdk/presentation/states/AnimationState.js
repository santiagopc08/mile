export const AnimationState = Object.freeze({
  IDLE: 'IDLE',
  MOVE: 'MOVE',
  ATTACK: 'ATTACK',
  HIT: 'HIT',
  DEAD: 'DEAD',
  SPAWN: 'SPAWN',
  CUSTOM: 'CUSTOM',
});

export const PresentationState = Object.freeze({
  VISIBLE: 'VISIBLE',
  HIDDEN: 'HIDDEN',
  CULLED: 'CULLED',
});

export class SpriteState {
  constructor(frame = 0, flipX = false, flipY = false, tint = 0xffffff) {
    this.frame = frame;
    this.flipX = flipX;
    this.flipY = flipY;
    this.tint = tint;
  }
}
