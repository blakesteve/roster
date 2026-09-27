import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
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

  describe("rounding, and the moment it finishes", () => {
    /* Every other target in this file sits a whole number of seconds away, so
       rounding up, rounding to nearest and flooring all agreed on it, and so
       did three different definitions of "finished". These pin the part in
       between. */

    it("rounds partial seconds down, so 1.5 seconds out reads 1", () => {
      const { result } = renderHook(() => useCountdown(inFuture(1500)));
      expect(result.current).toEqual({
        days: 0, hours: 0, minutes: 0, seconds: 1, isFinished: false,
      });
    });

    it("reads 0 seconds, not finished, for a target under a second away", () => {
      /* Declaring this finished would end the countdown a second early. */
      const { result } = renderHook(() => useCountdown(inFuture(999)));
      expect(result.current).toEqual({
        days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: false,
      });
    });

    it("is not finished at the exact target instant", () => {
      const { result } = renderHook(() => useCountdown(inFuture(0)));
      expect(result.current.isFinished).toBe(false);
    });

    it("is finished a millisecond after the target", () => {
      const { result } = renderHook(() => useCountdown(inFuture(-1)));
      expect(result.current.isFinished).toBe(true);
    });
  });

  describe("measures elapsed time, not calendar time", () => {
    /* Each expectation below is a literal worked out by hand, not a number the
       hook could have produced for itself. Each is also checked against the
       gap between the test's own two timestamps, which says the same thing a
       second way: the fields have to add back up to the real elapsed time.
       Every gap here is a whole number of seconds; rounding is pinned
       separately above.

       Every instant is written in UTC so the true gap is fixed. The zone is
       pinned so that a calendar-based implementation SEES a daylight-saving
       change: under UTC there is none, and the DST cases would pass whether or
       not the bug existed. */
    const ZONE = "America/Chicago";
    let previousZone: string | undefined;

    beforeAll(() => {
      previousZone = process.env.TZ;
      process.env.TZ = ZONE;
    });

    afterAll(() => {
      if (previousZone === undefined) delete process.env.TZ;
      else process.env.TZ = previousZone;
    });

    const at = (now: string, target: string) => {
      vi.setSystemTime(new Date(now));
      const { result } = renderHook(() => useCountdown(new Date(target)));
      return result.current;
    };

    const totalSecondsOf = (r: { days: number; hours: number; minutes: number; seconds: number }) =>
      r.days * 86_400 + r.hours * 3_600 + r.minutes * 60 + r.seconds;

    const gapInSeconds = (now: string, target: string) =>
      (new Date(target).getTime() - new Date(now).getTime()) / 1000;

    it("confirms the zone is pinned, so the DST cases below can fail", () => {
      /* The exact offsets, not merely "winter differs from summer". Assigning
         `process.env.TZ` at runtime is ignored under some test pools, and on a
         machine whose own zone has daylight saving the weaker check still
         passes while the pin does nothing. The DST cases below would then run
         against whatever zone the machine happens to be in. */
      expect(new Date("2026-01-15T12:00:00Z").getTimezoneOffset()).toBe(360);
      expect(new Date("2026-07-15T12:00:00Z").getTimezoneOffset()).toBe(300);
    });

    it("counts a target 45 days out as 45 days", () => {
      const now = "2026-01-01T00:00:00Z";
      const target = "2026-02-15T00:00:00Z";
      const r = at(now, target);

      /* A calendar duration reads this as one month and 14 days, and the
         month was being discarded. */
      expect(r).toMatchObject({ days: 45, hours: 0, minutes: 0, seconds: 0 });
      expect(totalSecondsOf(r)).toBe(gapInSeconds(now, target));
    });

    it("counts a target 400 days out as 400 days", () => {
      const now = "2026-01-01T00:00:00Z";
      const target = "2027-02-05T00:00:00Z";
      const r = at(now, target);

      /* A year and a month dropped from the front used to leave 4. */
      expect(r).toMatchObject({ days: 400, hours: 0, minutes: 0, seconds: 0 });
      expect(totalSecondsOf(r)).toBe(gapInSeconds(now, target));
    });

    it("counts the 23 real hours across the spring clock change as 23 hours", () => {
      /* Noon to noon local, across the night the clocks go forward: one
         calendar day, 23 hours of actual time. */
      const now = "2026-03-07T18:00:00Z";
      const target = "2026-03-08T17:00:00Z";
      const r = at(now, target);

      expect(r).toMatchObject({ days: 0, hours: 23, minutes: 0, seconds: 0 });
      expect(totalSecondsOf(r)).toBe(gapInSeconds(now, target));
    });

    it("counts the 25 real hours across the fall clock change as a day and an hour", () => {
      const now = "2026-10-31T17:00:00Z";
      const target = "2026-11-01T18:00:00Z";
      const r = at(now, target);

      expect(r).toMatchObject({ days: 1, hours: 1, minutes: 0, seconds: 0 });
      expect(totalSecondsOf(r)).toBe(gapInSeconds(now, target));
    });

    it("keeps every field non-negative from the last day of a long month into a short one", () => {
      /* Ten in the morning on the 31st to nine in the morning on the 28th of
         the next month. Calendar arithmetic produced a negative hour here. */
      const now = "2026-01-31T16:00:00Z";
      const target = "2026-02-28T15:00:00Z";
      const r = at(now, target);

      expect(r).toMatchObject({ days: 27, hours: 23, minutes: 0, seconds: 0 });
      expect(totalSecondsOf(r)).toBe(gapInSeconds(now, target));
      for (const v of [r.days, r.hours, r.minutes, r.seconds]) {
        expect(v).toBeGreaterThanOrEqual(0);
      }
    });

    it("keeps a month's worth of days when the gap also crosses a clock change", () => {
      /* One calendar month and 45 minutes, across the spring change. The day
         part of a calendar duration is zero here, so the old reading was
         "0 days, 0 hours, 45 minutes". */
      const now = "2026-02-09T06:00:00Z";
      const target = "2026-03-09T05:45:00Z";
      const r = at(now, target);

      expect(r).toMatchObject({ days: 27, hours: 23, minutes: 45, seconds: 0 });
      expect(totalSecondsOf(r)).toBe(gapInSeconds(now, target));
    });
  });
});
