/**
 * Procedural Terrain Heightmap Generator using multi-octave sine wave composition.
 */
export class ProceduralTerrain {
  constructor(baseHeight = 30, amplitude1 = 8, frequency1 = 0.03, amplitude2 = 3, frequency2 = 0.08) {
    this.baseHeight = baseHeight;
    this.amplitude1 = amplitude1;
    this.frequency1 = frequency1;
    this.amplitude2 = amplitude2;
    this.frequency2 = frequency2;
  }

  /**
   * Evaluate terrain height y = f(x) at any horizontal position x.
   */
  getHeight(x) {
    if (x < 10) return this.baseHeight; // Flat starting zone for vehicle spawn

    const wave1 = Math.sin(x * this.frequency1) * this.amplitude1;
    const wave2 = Math.sin(x * this.frequency2) * this.amplitude2;
    const gradualClimb = (x - 10) * 0.02; // Gradual uphill incline

    return this.baseHeight + wave1 + wave2 + gradualClimb;
  }

  /**
   * Evaluate terrain slope dy/dx at position x.
   */
  getSlope(x) {
    const delta = 0.1;
    const y1 = this.getHeight(x - delta);
    const y2 = this.getHeight(x + delta);
    return (y2 - y1) / (2 * delta);
  }

  /**
   * Get surface normal vector { nx, ny } at position x.
   */
  getNormal(x) {
    const slope = this.getSlope(x);
    const angle = Math.atan(slope);
    return {
      nx: -Math.sin(angle),
      ny: Math.cos(angle),
      angle,
    };
  }
}
