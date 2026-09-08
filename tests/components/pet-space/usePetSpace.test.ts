import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { driftJoy } from '../../../src/components/pet-space/usePetSpace';

describe('driftJoy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns rounded joy if ts is 0', () => {
    expect(driftJoy(85.6, 0)).toBe(86);
  });

  it('decreases joy based on elapsed hours (1.2 per hour)', () => {
    // Current time is 10 hours after ts
    const ts = Date.now();
    vi.setSystemTime(ts + 10 * 3600000);

    // Initial joy 95
    // After 10 hours: 95 - 10 * 1.2 = 95 - 12 = 83
    expect(driftJoy(95, ts)).toBe(83);
  });

  it('respects the JOY_FLOOR of 78', () => {
    const ts = Date.now();
    vi.setSystemTime(ts + 20 * 3600000); // 20 hours

    // Initial joy 90
    // After 20 hours: 90 - 20 * 1.2 = 90 - 24 = 66
    // Since 66 is below JOY_FLOOR (78), it should return 78
    expect(driftJoy(90, ts)).toBe(78);
  });

  it('caps joy at 100', () => {
    const ts = Date.now();
    // 0 hours elapsed
    vi.setSystemTime(ts);

    // Initial joy 105
    // After 0 hours: 105 - 0 * 1.2 = 105
    // Since 105 is above 100, it should return 100
    expect(driftJoy(105, ts)).toBe(100);
  });

  it('rounds the result correctly', () => {
    const ts = Date.now();
    vi.setSystemTime(ts + 1 * 3600000); // 1 hour

    // Initial joy 95
    // After 1 hour: 95 - 1 * 1.2 = 93.8
    // Should round to 94
    expect(driftJoy(95, ts)).toBe(94);
  });
});
