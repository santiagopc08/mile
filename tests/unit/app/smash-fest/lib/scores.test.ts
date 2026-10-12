import { describe, it, expect } from "vitest";
import { starsFor } from "../../../../../src/app/smash-fest/lib/scores";

describe("starsFor", () => {
  it("returns 1 star when limit is 0 or less", () => {
    expect(starsFor(0, 0)).toBe(1);
    expect(starsFor(5, 0)).toBe(1);
    expect(starsFor(5, -1)).toBe(1);
  });

  it("returns 3 stars when spent is 0.45 or less", () => {
    // 4 / 10 = 0.4
    expect(starsFor(4, 10)).toBe(3);
    // 4.5 / 10 = 0.45
    expect(starsFor(4.5, 10)).toBe(3);
    // 0 / 10 = 0
    expect(starsFor(0, 10)).toBe(3);
  });

  it("returns 2 stars when spent is greater than 0.45 and up to 0.75", () => {
    // 4.6 / 10 = 0.46
    expect(starsFor(4.6, 10)).toBe(2);
    // 6 / 10 = 0.6
    expect(starsFor(6, 10)).toBe(2);
    // 7.5 / 10 = 0.75
    expect(starsFor(7.5, 10)).toBe(2);
  });

  it("returns 1 star when spent is greater than 0.75", () => {
    // 7.6 / 10 = 0.76
    expect(starsFor(7.6, 10)).toBe(1);
    // 10 / 10 = 1.0
    expect(starsFor(10, 10)).toBe(1);
    // 15 / 10 = 1.5
    expect(starsFor(15, 10)).toBe(1);
  });
});
