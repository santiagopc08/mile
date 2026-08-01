export const PongEvents = Object.freeze({
  ROUND_STARTED: 'Pong.RoundStarted',
  BALL_SPAWNED: 'Pong.BallSpawned',
  GOAL_SCORED: 'Pong.GoalScored',
  ROUND_ENDED: 'Pong.RoundEnded',
  MATCH_ENDED: 'Pong.MatchEnded',
  GAME_PAUSED: 'Pong.GamePaused',
  GAME_RESUMED: 'Pong.GameResumed',
});

export const PongState = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GOAL: 'GOAL',
  FINISHED: 'FINISHED',
});
