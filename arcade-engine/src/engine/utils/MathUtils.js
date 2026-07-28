/**
 * High-performance 2D/2.5D Arcade Math Helpers.
 */

export function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distanceSq2D(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function distance2D(x1, y1, x2, y2) {
  return Math.sqrt(distanceSq2D(x1, y1, x2, y2));
}

/**
 * Axis-Aligned Bounding Box Overlap Test.
 */
export function intersectsAABB(aMinX, aMinY, aMaxX, aMaxY, bMinX, bMinY, bMaxX, bMaxY) {
  return aMinX <= bMaxX && aMaxX >= bMinX && aMinY <= bMaxY && aMaxY >= bMinY;
}

/**
 * Circle vs Circle Overlap Test.
 */
export function intersectsCircle(x1, y1, r1, x2, y2, r2) {
  const radiusSum = r1 + r2;
  return distanceSq2D(x1, y1, x2, y2) <= radiusSum * radiusSum;
}

/**
 * Circle vs AABB Overlap Test.
 */
export function intersectsCircleAABB(cx, cy, radius, minX, minY, maxX, maxY) {
  const closestX = clamp(cx, minX, maxX);
  const closestY = clamp(cy, minY, maxY);

  const distX = cx - closestX;
  const distY = cy - closestY;

  return distX * distX + distY * distY <= radius * radius;
}

/**
 * Raycast 2D vs AABB.
 * Returns true if line segment (x1, y1) -> (x2, y2) intersects box.
 */
export function intersectsRayAABB(x1, y1, x2, y2, minX, minY, maxX, maxY) {
  let tmin = 0;
  let tmax = 1;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dx) < 1e-8) {
    if (x1 < minX || x1 > maxX) return false;
  } else {
    const invD = 1.0 / dx;
    let t1 = (minX - x1) * invD;
    let t2 = (maxX - x1) * invD;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  if (Math.abs(dy) < 1e-8) {
    if (y1 < minY || y1 > maxY) return false;
  } else {
    const invD = 1.0 / dy;
    let t1 = (minY - y1) * invD;
    let t2 = (maxY - y1) * invD;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  return true;
}
