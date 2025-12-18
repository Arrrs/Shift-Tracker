import { useState, useEffect } from 'react';
import { ActiveShift } from '../types';
import { calculateRemainingTime, formatTimeRemaining } from '../utils';

export function useCountdown(activeShift: ActiveShift | null) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!activeShift || activeShift.status !== 'active') {
      setIsRunning(false);
      setTimeRemaining(0);
      return;
    }

    setIsRunning(true);

    // Update immediately
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);

    function updateTimeRemaining() {
      if (!activeShift) return;

      const remaining = calculateRemainingTime(activeShift.endTime);
      setTimeRemaining(remaining);

      // Stop countdown when it reaches zero
      if (remaining === 0) {
        setIsRunning(false);
      }
    }
  }, [activeShift]);

  const formatted = formatTimeRemaining(timeRemaining);

  return {
    timeRemaining,
    isRunning,
    hours: formatted.hours,
    minutes: formatted.minutes,
    seconds: formatted.seconds,
  };
}
