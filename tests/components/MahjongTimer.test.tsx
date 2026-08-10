import React, { useRef } from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MahjongTimer, {
  MahjongTimerHandle,
} from "../../src/components/MahjongTimer";

describe("MahjongTimer Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it("renders initial time and styling correctly when inactive", () => {
    render(
      <MahjongTimer
        isActive={false}
        formatTime={(s: number) => `Time: ${s}`}
        accentColor="#ff0000"
      />,
    );

    const timeElements = screen.getAllByText("Time: 0");
    expect(timeElements.length).toBeGreaterThan(0);

    const labelElements = screen.getAllByText("Tiempo");
    expect(labelElements.length).toBeGreaterThan(0);
  });

  it("increments time when active", () => {
    render(
      <MahjongTimer
        isActive={true}
        formatTime={(s: number) => `Time: ${s}`}
        accentColor="#ff0000"
      />,
    );

    expect(screen.getAllByText("Time: 0").length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText("Time: 1").length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getAllByText("Time: 3").length).toBeGreaterThan(0);
  });

  it("exposes ref methods getTime and resetTime", () => {
    let handle: MahjongTimerHandle | null = null;

    const TestWrapper = () => {
      const ref = useRef<MahjongTimerHandle>(null);

      return (
        <MahjongTimer
          ref={(node) => {
            handle = node;
          }}
          isActive={true}
          formatTime={(s: number) => `Time: ${s}`}
          accentColor="#ff0000"
        />
      );
    };

    render(<TestWrapper />);
    expect(handle).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const timerHandle = handle as MahjongTimerHandle | null;
    expect(timerHandle?.getTime()).toBe(1);

    act(() => {
      timerHandle?.resetTime();
    });

    expect(timerHandle?.getTime()).toBe(0);
    expect(screen.getAllByText("Time: 0").length).toBeGreaterThan(0);
  });
});
