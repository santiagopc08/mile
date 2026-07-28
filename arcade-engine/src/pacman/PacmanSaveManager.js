/**
 * Pac-Man Persistence Manager for High Score & Settings.
 */
export class PacmanSaveManager {
  constructor() {
    this.STORAGE_KEY = 'PACMAN_ARCADE_SAVE';
  }

  getHighScore() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.highScore || 0;
      }
    } catch (e) {}
    return 0;
  }

  setHighScore(score) {
    try {
      const data = { highScore: score, timestamp: Date.now() };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }
}
