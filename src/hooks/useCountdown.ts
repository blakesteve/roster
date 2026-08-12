import { useCallback, useState, useEffect } from 'react';
import { intervalToDuration, isAfter } from 'date-fns';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
}

export const useCountdown = (targetDate: Date): CountdownResult => {
  // Keyed on the timestamp rather than the Date object. Callers routinely build
  // the target inline (`useCountdown(new Date(iso))`), which is a fresh object
  // every render, so depending on identity tore down and restarted the interval
  // on every render.
  const targetTime = targetDate.getTime();

  const calculateTimeLeft = useCallback((): CountdownResult => {
    const now = new Date();
    const target = new Date(targetTime);

    if (isAfter(now, target)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
    }

    // An invalid target yields {} here rather than throwing, so every field
    // falls back to 0 and isFinished stays false.
    const duration = intervalToDuration({
      start: now,
      end: target,
    });

    return {
      days: duration.days ?? 0,
      hours: duration.hours ?? 0,
      minutes: duration.minutes ?? 0,
      seconds: duration.seconds ?? 0,
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
