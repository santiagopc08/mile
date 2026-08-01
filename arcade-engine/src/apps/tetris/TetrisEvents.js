export const TetrisEvents = Object.freeze({
  PIECE_SPAWNED: 'Tetris.PieceSpawned',
  PIECE_LOCKED: 'Tetris.PieceLocked',
  LINE_COMPLETED: 'Tetris.LineCompleted',
  LINES_REMOVED: 'Tetris.LinesRemoved',
  LEVEL_UP: 'Tetris.LevelUp',
  GAME_OVER: 'Tetris.GameOver',
  REPLAY_SAVED: 'Tetris.ReplaySaved',
  GAME_PAUSED: 'Tetris.GamePaused',
  GAME_RESUMED: 'Tetris.GameResumed',
});

export const TetrisState = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LINE_CLEAR: 'LINE_CLEAR',
  LEVEL_TRANSITION: 'LEVEL_TRANSITION',
  GAME_OVER: 'GAME_OVER',
});

export const TetrominoType = Object.freeze({
  I: 'I',
  J: 'J',
  L: 'L',
  O: 'O',
  S: 'S',
  T: 'T',
  Z: 'Z',
});
