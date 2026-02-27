import { useState, useEffect } from 'react';
import { intervalToDuration, isAfter } from 'date-fns';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
}

export const useCountdown = (targetDate: Date): CountdownResult => {
  const calculateTimeLeft = (): CountdownResult => {
    const now = new Date();
    
    if (isAfter(now, targetDate)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
    }

    const duration = intervalToDuration({
      start: now,
      end: targetDate,
    });

    return {
      days: duration.days ?? 0,
      hours: duration.hours ?? 0,
      minutes: duration.minutes ?? 0,
      seconds: duration.seconds ?? 0,
      isFinished: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculateTimeLeft);

  useEffect(() => {
    if (isNaN(targetDate.getTime())) return;

    // Recalculate instantly if targetDate prop changes
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      
      if (newTime.isFinished) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};
