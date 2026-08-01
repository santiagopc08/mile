import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import {
  PlayerPaddleFactory,
  AIPaddleFactory,
  BallFactory,
  ScoreHudFactory,
  FIELD,
} from './PongActors.js';
import {
  PaddleInputSystem,
  AISystem,
  BallMovementSystem,
  CollisionSystem,
} from './PongSystems.js';
import { PongEvents, PongState } from './PongEvents.js';

/**
 * PongWorld — continuous-plane world for the Pong reference game.
 * Coordinates all Systems over the shared Actor set.
 */
export class PongWorld {
  constructor() {
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();

    // Actors
    this.playerPaddle = null;
    this.aiPaddle = null;
    this.ball = null;
    this.scoreHud = null;

    // Systems
    this.paddleInputSystem = new PaddleInputSystem();
    this.aiSystem = new AISystem();
    this.ballMovementSystem = new BallMovementSystem();
    this.collisionSystem = new CollisionSystem();

    // State
    this.state = PongState.READY;
    this.goalCooldown = 0;

    // Audio log (headless — collects cues instead of playing them)
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    this.playerPaddle = PlayerPaddleFactory.create();
    this.aiPaddle = AIPaddleFactory.create();
    this.ball = BallFactory.create();
    this.scoreHud = ScoreHudFactory.create();

    this.actorRegistry.register(this.playerPaddle);
    this.actorRegistry.register(this.aiPaddle);
    this.actorRegistry.register(this.ball);
    this.actorRegistry.register(this.scoreHud);

    this._startRound();
  }

  // ──────────── Input ────────────

  /**
   * @param {number} dir  -1 up, 0 idle, +1 down
   */
  setPlayerInput(dir) {
    if (this.state !== PongState.PLAYING) return;
    const input = this.playerPaddle.getComponent('PaddleInputComponent');
    if (input) input.moveDir = dir;
  }

  togglePause() {
    if (this.state === PongState.PLAYING) {
      this.state = PongState.PAUSED;
      this.eventBus.emit(PongEvents.GAME_PAUSED, {});
    } else if (this.state === PongState.PAUSED) {
      this.state = PongState.PLAYING;
      this.eventBus.emit(PongEvents.GAME_RESUMED, {});
    }
  }

  // ──────────── Update ────────────

  update(dt) {
    if (this.state === PongState.PAUSED || this.state === PongState.FINISHED) return;

    // Goal cooldown (brief freeze after scoring)
    if (this.state === PongState.GOAL) {
      this.goalCooldown -= dt;
      if (this.goalCooldown <= 0) {
        this._startRound();
      }
      return;
    }

    // --- Run Systems in order ---

    // 1. Input → Paddle
    this.paddleInputSystem.update(dt, this.playerPaddle);

    // 2. AI
    this.aiSystem.update(dt, this.aiPaddle, this.ball);

    // 3. Ball movement
    this.ballMovementSystem.update(dt, this.ball);

    // 4. Collision & scoring
    const result = this.collisionSystem.update(dt, this.ball, this.playerPaddle, this.aiPaddle);

    // 5. Consume audio cues
    this._consumeAudio();

    // 6. Handle goal
    if (result.scored) {
      this._handleGoal(result.scored);
    }

    // 7. Actor component updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  // ──────────── Internal ────────────

  _startRound() {
    this.state = PongState.PLAYING;

    // Reset ball to centre
    const btc = this.ball.getComponent('TransformComponent');
    btc.setPosition(FIELD.WIDTH / 2, FIELD.HEIGHT / 2);

    // Launch ball
    BallFactory.launch(this.ball);

    this.eventBus.emit(PongEvents.ROUND_STARTED, {});
    this.eventBus.emit(PongEvents.BALL_SPAWNED, {});
  }

  _handleGoal(scoredBy) {
    const score = this.scoreHud.getComponent('ScoreComponent');
    if (scoredBy === 'player') {
      score.playerScore++;
    } else {
      score.aiScore++;
    }

    this.eventBus.emit(PongEvents.GOAL_SCORED, {
      scoredBy,
      playerScore: score.playerScore,
      aiScore: score.aiScore,
    });

    // Check win condition
    if (score.playerScore >= FIELD.WIN_SCORE || score.aiScore >= FIELD.WIN_SCORE) {
      this.state = PongState.FINISHED;
      this.eventBus.emit(PongEvents.MATCH_ENDED, {
        winner: score.playerScore >= FIELD.WIN_SCORE ? 'player' : 'ai',
        playerScore: score.playerScore,
        aiScore: score.aiScore,
      });
      return;
    }

    // Brief freeze before next round
    this.state = PongState.GOAL;
    this.goalCooldown = 0.5;

    this.eventBus.emit(PongEvents.ROUND_ENDED, {
      playerScore: score.playerScore,
      aiScore: score.aiScore,
    });
  }

  _consumeAudio() {
    const audio = this.ball.getComponent('AudioCueComponent');
    if (!audio) return;
    const cue = audio.consume();
    if (cue) this.audioLog.push(cue);
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.audioLog = [];
    this.initialize();
  }
}
