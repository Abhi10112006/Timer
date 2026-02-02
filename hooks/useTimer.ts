import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode, TimerSettings } from '../types';

interface UseTimerProps {
  settings: TimerSettings;
  onComplete: () => void;
}

export const useTimer = ({ settings, onComplete }: UseTimerProps) => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.POMODORO);
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration);
  const [duration, setDuration] = useState(settings.focusDuration); // Track the total duration for the current session
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);

  // Sync timeLeft and duration when settings change (only if not running and in Pomodoro)
  useEffect(() => {
    if (!isRunning && mode === TimerMode.POMODORO) {
        // We generally want to respect the user's settings if they change them in the settings modal.
        // However, we shouldn't overwrite if the user is in the middle of a custom setup?
        // For simplicity in this app, if settings change, we reset to those settings.
        // But to avoid overwriting a "Break" preset when saving settings, check context?
        // The current behavior in App.tsx re-renders with new settings. 
        // We'll rely on the manual reset or preset buttons to set specific durations.
    }
  }, [settings.focusDuration]);

  const clearTimerInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isRunning) {
      if (mode === TimerMode.STOPWATCH) {
         const start = Date.now() - stopwatchTime;
         intervalRef.current = window.setInterval(() => {
            setStopwatchTime(Date.now() - start);
         }, 33);
      } else {
         if (endTimeRef.current === 0) {
             endTimeRef.current = Date.now() + (timeLeft * 1000);
         }
         
         intervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const remainingMs = endTimeRef.current - now;
            const remainingSec = Math.ceil(remainingMs / 1000);
            
            if (remainingSec <= 0) {
                setTimeLeft(0);
                setIsRunning(false);
                clearTimerInterval();
                onComplete();
            } else {
                setTimeLeft(remainingSec);
            }
         }, 200);
      }
    } else {
       clearTimerInterval();
       endTimeRef.current = 0;
    }
    return clearTimerInterval;
  }, [isRunning, mode, onComplete]);

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    clearTimerInterval();
    if (mode === TimerMode.POMODORO) {
      setTimeLeft(settings.focusDuration);
      setDuration(settings.focusDuration);
    } else {
      setStopwatchTime(0);
    }
  }, [mode, settings.focusDuration]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    clearTimerInterval();
  }, []);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    clearTimerInterval();
    if (newMode === TimerMode.POMODORO) {
        setTimeLeft(settings.focusDuration);
        setDuration(settings.focusDuration);
    } else {
        setStopwatchTime(0);
    }
  }, [settings.focusDuration]);

  return {
    mode,
    timeLeft,
    setTimeLeft,
    duration,      // Exported
    setDuration,   // Exported
    stopwatchTime,
    setStopwatchTime,
    isRunning,
    toggleTimer,
    stopTimer,
    resetTimer,
    switchMode
  };
};