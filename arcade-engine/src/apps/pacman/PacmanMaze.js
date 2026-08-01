/**
 * Pac-Man Maze Layout (28 columns x 31 rows)
 * '#': Wall
 * '.': Pellet
 * 'o': Power Pellet
 * ' ': Empty path
 * 'G': Ghost House
 * 'T': Tunnel (Warp Portal)
 */
export const DEFAULT_MAZE_LAYOUT = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "######.##### ## #####.######",
  "######.##          ##.######",
  "######.## ###GG### ##.######",
  "######.## #GGGGGG# ##.######",
  "T     .   #GGGGGG#   .     T",
  "######.## #GGGGGG# ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "######.## ######## ##.######",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##................##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################"
];

export class PacmanMaze {
  constructor(layout = DEFAULT_MAZE_LAYOUT) {
    this.layout = layout;
    this.height = layout.length;
    this.width = layout[0].length;
    this.tunnels = [];
    this.ghostHouseTiles = [];
    this.pelletPositions = [];
    this.powerPelletPositions = [];
    this.pacmanSpawn = { x: 13, y: 23 };
    this.ghostSpawns = {
      BLINKY: { x: 13, y: 11 },
      PINKY:  { x: 13, y: 14 },
      INKY:   { x: 11, y: 14 },
      CLYDE:  { x: 15, y: 14 },
    };

    this._parseLayout();
  }

  _parseLayout() {
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const char = this.layout[r][c];
        if (char === 'T') {
          this.tunnels.push({ x: c, y: r });
        } else if (char === 'G') {
          this.ghostHouseTiles.push({ x: c, y: r });
        } else if (char === '.') {
          this.pelletPositions.push({ x: c, y: r });
        } else if (char === 'o') {
          this.powerPelletPositions.push({ x: c, y: r });
        }
      }
    }
  }

  isWall(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
    return this.layout[y][x] === '#';
  }

  isWalkable(x, y, allowGhostHouse = true) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const char = this.layout[y][x];
    if (char === '#') return false;
    if (char === 'G' && !allowGhostHouse) return false;
    return true;
  }

  isTunnel(x, y) {
    return x < 0 || x >= this.width || this.layout[y]?.[x] === 'T';
  }

  getWarpTarget(x, y) {
    if (x <= 0) return { x: this.width - 2, y };
    if (x >= this.width - 1) return { x: 1, y };
    return { x, y };
  }

  /**
   * Get valid neighboring cell coordinates for tile navigation.
   */
  getNeighbors(x, y, allowGhostHouse = true) {
    const neighbors = [];
    const dirs = [
      { dx: 0, dy: -1 }, // UP
      { dx: -1, dy: 0 }, // LEFT
      { dx: 0, dy: 1 },  // DOWN
      { dx: 1, dy: 0 },  // RIGHT
    ];

    for (const d of dirs) {
      const nx = x + d.dx;
      const ny = y + d.dy;

      // Handle tunnels
      if (this.isTunnel(nx, ny)) {
        const warp = this.getWarpTarget(nx, ny);
        neighbors.push({ x: warp.x, y: warp.y, dir: d });
      } else if (this.isWalkable(nx, ny, allowGhostHouse)) {
        neighbors.push({ x: nx, y: ny, dir: d });
      }
    }

    return neighbors;
  }
}
