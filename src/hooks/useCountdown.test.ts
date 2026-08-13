import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCountdown } from "./useCountdown";

// Fixed clock so the arithmetic below is exact rather than racing real time.
const NOW = new Date("2026-01-01T00:00:00.000Z");

const inFuture = (ms: number) => new Date(NOW.getTime() + ms);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("breaks the remaining time into days, hours, minutes and seconds", () => {
    const { result } = renderHook(() =>
      useCountdown(inFuture(2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND)),
    );

    expect(result.current).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      isFinished: false,
    });
  });

  it("counts down as time passes", () => {
    const { result } = renderHook(() => useCountdown(inFuture(10 * SECOND)));

    expect(result.current.seconds).toBe(10);

    act(() => {
      vi.advanceTimersByTime(3 * SECOND);
    });

    expect(result.current.seconds).toBe(7);
    expect(result.current.isFinished).toBe(false);
  });

  it("reports isFinished once the target passes", () => {
    const { result } = renderHook(() => useCountdown(inFuture(2 * SECOND)));

    act(() => {
      vi.advanceTimersByTime(3 * SECOND);
    });

    expect(result.current).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isFinished: true,
    });
  });

  it("stops ticking after finishing", () => {
    renderHook(() => useCountdown(inFuture(1 * SECOND)));

    act(() => {
      vi.advanceTimersByTime(2 * SECOND);
    });

    // The interval clears itself on the tick that finishes, so nothing is left
    // pending. A still-running timer here would keep firing forever.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("recalculates immediately when the target changes", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useCountdown(target),
      { initialProps: { target: inFuture(5 * SECOND) } },
    );

    expect(result.current.seconds).toBe(5);

    // No timer advance: the new value must be there on the same commit, not
    // one second later when the interval next fires.
    rerender({ target: inFuture(30 * SECOND) });

    expect(result.current.seconds).toBe(30);
  });

  it("keeps the interval alive across re-renders with an equal target", () => {
    const iso = inFuture(10 * SECOND).toISOString();
    const { result, rerender } = renderHook(() => useCountdown(new Date(iso)));

    // A fresh Date object every render used to restart the interval, so the
    // countdown never advanced. Re-render repeatedly between ticks.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender();
    rerender();
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.seconds).toBe(9);
  });

  it("returns zeros without finishing for an invalid target", () => {
    const { result } = renderHook(() => useCountdown(new Date("not a date")));

    expect(result.current).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isFinished: false,
    });
    // No interval is scheduled for a target that can never elapse.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not re-render forever on an invalid target", () => {
    let renders = 0;
    const { rerender } = renderHook(() => {
      renders++;
      return useCountdown(new Date("not a date"));
    });

    const afterMount = renders;
    rerender();

    // NaN !== NaN, so comparing targets with !== instead of Object.is would
    // set state on every render and loop.
    expect(renders - afterMount).toBeLessThanOrEqual(2);
  });
});
