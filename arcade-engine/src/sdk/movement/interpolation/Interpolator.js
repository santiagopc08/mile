export class Interpolator {
  interpolate(start, end, t) {
    throw new Error('Interpolator.interpolate() must be implemented.');
  }
}

export class LinearInterpolation extends Interpolator {
  interpolate(start, end, t) {
    return start + (end - start) * Math.max(0, Math.min(1, t));
  }
}

export class GridInterpolation extends Interpolator {
  interpolate(start, end, t) {
    const smoothT = t * t * (3 - 2 * t); // Smoothstep
    return start + (end - start) * Math.max(0, Math.min(1, smoothT));
  }
}

export class BezierInterpolation extends Interpolator {
  interpolate(start, end, t) {
    return start + (end - start) * t;
  }
}

export class SmoothInterpolation extends Interpolator {
  interpolate(start, end, t) {
    const smoothT = t * t * (3 - 2 * t);
    return start + (end - start) * Math.max(0, Math.min(1, smoothT));
  }
}
