import { useCallback, useState, useEffect } from 'react';

interface CountdownResult {
  /**
   * Whole days remaining, as the full total rather than a remainder within a
   * month. A target a year out reads 365, so a display that assumes two digits
   * needs room for three.
   */
  days: number;
  /** Hours past the whole days, 0 to 23. */
  hours: number;
  /** Minutes past the whole hours, 0 to 59. */
  minutes: number;
  /** Seconds past the whole minutes, 0 to 59. */
  seconds: number;
  /** True once the target has passed. Stays false for an invalid target. */
  isFinished: boolean;
}

export const useCountdown = (targetDate: Date): CountdownResult => {
  // Keyed on the timestamp rather than the Date object. Callers routinely build
  // the target inline (`useCountdown(new Date(iso))`), which is a fresh object
  // every render, so depending on identity tore down and restarted the interval
  // on every render.
  const targetTime = targetDate.getTime();

  const calculateTimeLeft = useCallback((): CountdownResult => {
    // An invalid target can never elapse. Every field reads 0 and isFinished
    // stays false, so a bad input shows an idle clock rather than a false
    // "done".
    if (Number.isNaN(targetTime)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: false };
    }

    const remaining = targetTime - Date.now();

    if (remaining < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
    }

    // A countdown measures elapsed time, not calendar time, so every field
    // comes from the millisecond difference. `days` is the whole total and
    // is allowed to run past 99.
    //
    // Calendar arithmetic gets this wrong in three separate ways. A calendar
    // duration splits the gap into years, months and days, and a result that
    // reads only the day part drops the rest: 45 days out reads as about 14.
    // A calendar day is not 24 hours across a daylight-saving change, so a
    // gap of 23 real hours reads as one day. And a month that is shorter than
    // the one before it can leave the sub-day fields negative. A plain
    // difference of two timestamps has none of those failure modes.
    const totalSeconds = Math.floor(remaining / 1000);

    return {
      days: Math.floor(totalSeconds / 86_400),
      hours: Math.floor((totalSeconds % 86_400) / 3_600),
      minutes: Math.floor((totalSeconds % 3_600) / 60),
      seconds: totalSeconds % 60,
      isFinished: false,
    };
  }, [targetTime]);

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculateTimeLeft);

  // Recalculate when the target changes, during render rather than in an
  // effect. An effect would commit one frame still showing the previous
  // target's numbers and then cascade a second render to correct it; adjusting
  // here makes React re-run this component before it paints anything.
  // Object.is, not !==, so an invalid target (NaN) compares equal to itself
  // and does not loop forever.
  const [renderedFor, setRenderedFor] = useState(targetTime);
  if (!Object.is(renderedFor, targetTime)) {
    setRenderedFor(targetTime);
    setTimeLeft(calculateTimeLeft());
  }

  useEffect(() => {
    if (Number.isNaN(targetTime)) return;

    const interval = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      
      if (newTime.isFinished) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, calculateTimeLeft]);

  return timeLeft;
};
