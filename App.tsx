
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { dbService } from './services/db';
import { StudySession, TimerMode, TimerSettings, SessionStatus } from './types';
import { DEFAULT_SETTINGS } from './constants';
import Header from './components/Header';
import TimerView from './components/TimerView';
import StatsView from './components/StatsView';
import Snackbar from './components/Snackbar';
import SecretApp from './components/SecretApp'; // Import the new app
import { useTimer } from './hooks/useTimer';

const App: React.FC = () => {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [view, setView] = useState<'timer' | 'stats'>('timer');
  const [subject, setSubject] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [hasUnviewed, setHasUnviewed] = useState(false);
  
  // Secret Mode State
  const [showSecretApp, setShowSecretApp] = useState(false);

  // Alarm State
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Ticking State
  const tickingCtxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number>(0);

  // Undo State
  const [undoSession, setUndoSession] = useState<StudySession | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<number | null>(null);

  // -- Theme Management --
  useEffect(() => {
      const savedTheme = localStorage.getItem('focusflow-theme') as 'light' | 'dark' | null;
      if (savedTheme) {
          setTheme(savedTheme);
      }
  }, []);

  useEffect(() => {
      if (theme === 'dark' || showSecretApp) { // Force dark mode for secret app
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      if (!showSecretApp) {
          localStorage.setItem('focusflow-theme', theme);
      }
  }, [theme, showSecretApp]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // -- Data Loading --
  useEffect(() => {
    const init = async () => {
        try {
            await Promise.all([loadSessions(), loadSettings()]);
        } catch (e) {
            console.error(e);
        }
    };
    init();
  }, []);

  // -- Audio Context Cleanup on Unmount --
  useEffect(() => {
    return () => {
        if (tickingCtxRef.current) tickingCtxRef.current.close();
        if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const loadSessions = async () => {
    try {
      const data = await dbService.getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await dbService.getSettings();
      setSettings(saved);
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  // -- Audio / Alarm Logic --
  const stopAlarm = useCallback(() => {
    // Stop Web Audio (Default)
    if (audioCtxRef.current) {
        try {
            audioCtxRef.current.close();
        } catch(e) { /* ignore */ }
        audioCtxRef.current = null;
    }
    // Stop HTML Audio (Custom)
    if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.currentTime = 0;
        customAudioRef.current = null;
    }
    setIsAlarmRinging(false);
  }, []);

  const playTick = useCallback(() => {
      if (!settings.stopwatchTicking) return;
      
      try {
        let ctx = tickingCtxRef.current;
        if (!ctx || ctx.state === 'closed') {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            ctx = new Ctx();
            tickingCtxRef.current = ctx;
        }
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // High-pitched short tick
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.03);
      } catch (e) {
          console.error("Tick error", e);
      }
  }, [settings.stopwatchTicking]);

  const playAlarm = useCallback(() => {
    stopAlarm(); // Stop any existing
    
    // Determine duration (fallback to 10s if undefined)
    const duration = settings.alarmDuration || 10;
    
    // Play Custom Alarm if configured
    if (settings.alarmType === 'custom' && settings.customAlarmData) {
        try {
            const audio = new Audio(settings.customAlarmData);
            audio.loop = true; // Loop it to ensure it lasts the full duration
            audio.play().catch(e => {
                console.error("Failed to play custom audio, falling back to default", e);
                // Fallback to default if custom fails (e.g. bad data)
                playDefaultAlarm(duration);
            });
            customAudioRef.current = audio;
            setIsAlarmRinging(true);

            // Auto cleanup after configured duration
            setTimeout(() => {
                setIsAlarmRinging(prev => {
                    if (prev) {
                        stopAlarm();
                        return false;
                    }
                    return prev;
                });
            }, duration * 1000);
            return;
        } catch (e) {
            console.error("Error setting up custom audio", e);
        }
    }

    playDefaultAlarm(duration);

  }, [stopAlarm, settings.alarmType, settings.customAlarmData, settings.alarmDuration]);

  const playDefaultAlarm = useCallback((duration: number) => {
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.value = 1.0; // Full volume

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

        // Envelope for pulsing (Beep in/Beep out effect)
        const pulseGain = ctx.createGain();
        pulseGain.connect(masterGain);
        osc.connect(pulseGain);
        
        const now = ctx.currentTime;
        const cycle = 1.0; 

        for (let i = 0; i < duration; i += cycle) {
           const start = now + i;
           // 0.1s Fade In
           pulseGain.gain.setValueAtTime(0, start);
           pulseGain.gain.linearRampToValueAtTime(1, start + 0.1);
           // Sustain until 0.5s
           pulseGain.gain.setValueAtTime(1, start + 0.5);
           // 0.1s Fade Out
           pulseGain.gain.linearRampToValueAtTime(0, start + 0.6);
        }

        osc.start(now);
        osc.stop(now + duration);
        
        setIsAlarmRinging(true);
        
        // Auto cleanup state after duration
        setTimeout(() => {
            setIsAlarmRinging(prev => {
                if (prev) {
                    stopAlarm();
                    return false;
                }
                return prev;
            });
        }, duration * 1000 + 200);

    } catch (e) {
        console.error("Audio error", e);
        setIsAlarmRinging(false);
    }
  }, [stopAlarm]);

  // -- Actions --
  const handleViewChange = (newView: 'timer' | 'stats') => {
      if (isAlarmRinging) stopAlarm();
      setView(newView);
      if (newView === 'stats') {
          setHasUnviewed(false);
      }
  };

  const saveSession = useCallback(async (durationSeconds: number, status: SessionStatus, currentMode: TimerMode) => {
    if (durationSeconds < 1) return; 

    const newSession: StudySession = {
      subject: subject.trim() || 'General Study',
      durationSeconds: durationSeconds,
      timestamp: Date.now(),
      mode: currentMode,
      status: status
    };

    try {
      await dbService.addSession(newSession);
      await loadSessions();
      setHasUnviewed(true); 
    } catch (err) {
      console.error("Failed to save session", err);
    }
  }, [subject]);

  const updateSetting = async (key: keyof TimerSettings, value: number) => {
      // Note: This simple update is mostly for duration sliders/inputs. 
      // Complex updates (like alarm data) are handled by SettingsForm calling a full save.
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await dbService.saveSettings(newSettings);
  };
  
  const handleFullSettingsUpdate = async (newSettings: TimerSettings) => {
      setSettings(newSettings);
      await dbService.saveSettings(newSettings);
  };

  // -- Timer Hook --
  const handleTimerComplete = useCallback(() => {
      saveSession(settings.focusDuration, SessionStatus.COMPLETED, TimerMode.POMODORO);
      playAlarm();
  }, [settings.focusDuration, saveSession, playAlarm]);

  const timer = useTimer({
      settings,
      onComplete: handleTimerComplete
  });

  // -- Ticking Effect --
  useEffect(() => {
    if (timer.mode === TimerMode.STOPWATCH && timer.isRunning && settings.stopwatchTicking && !showSecretApp) {
        // Calculate current second
        const currentSecond = Math.floor(timer.stopwatchTime / 1000);
        
        // If we advanced to a new second (and it's not the initial 0)
        if (currentSecond > lastTickRef.current && currentSecond > 0) {
            playTick();
            lastTickRef.current = currentSecond;
        }
    } else if (!timer.isRunning || timer.stopwatchTime === 0) {
        // Reset tracker when stopped or reset
        lastTickRef.current = 0;
    }
  }, [timer.stopwatchTime, timer.mode, timer.isRunning, settings.stopwatchTicking, playTick, showSecretApp]);


  const handleStop = () => {
      if (isAlarmRinging) stopAlarm();

      if (timer.mode === TimerMode.STOPWATCH) {
          saveSession(timer.stopwatchTime / 1000, SessionStatus.PARTIAL, TimerMode.STOPWATCH);
      } else {
          const elapsed = timer.duration - timer.timeLeft;
          if (elapsed > 1) {
              saveSession(elapsed, SessionStatus.PARTIAL, TimerMode.POMODORO);
          }
      }
      timer.resetTimer();
  };

  const handleSwitchMode = (newMode: TimerMode) => {
      if (isAlarmRinging) stopAlarm();
      if (timer.isRunning) handleStop();
      timer.switchMode(newMode);
  };

  useEffect(() => {
    if (timer.mode === TimerMode.POMODORO && !timer.isRunning && timer.timeLeft !== settings.focusDuration && timer.duration === settings.focusDuration) {
        timer.setTimeLeft(settings.focusDuration);
    }
  }, [settings.focusDuration, timer.mode, timer.duration]);

  // -- Session Management --
  const handleDeleteSession = async (id: number) => {
    const sessionToDelete = sessions.find(s => s.id === id);
    if (!sessionToDelete) return;

    if (navigator.vibrate) navigator.vibrate(50);
    
    await dbService.deleteSession(id);
    loadSessions();

    setUndoSession(sessionToDelete);
    setShowUndo(true);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = window.setTimeout(() => {
        setShowUndo(false);
        setUndoSession(null);
    }, 5000);
  };

  const handleUndoDelete = async () => {
      if (!undoSession) return;
      try {
          const { id, ...sessionData } = undoSession;
          await dbService.addSession(sessionData);
          await loadSessions();
          setShowUndo(false);
          setUndoSession(null);
          if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      } catch (e) {
          console.error("Undo failed", e);
      }
  };

  const handleUpdateSession = async (session: StudySession) => {
    try {
        await dbService.updateSession(session);
        await loadSessions();
    } catch (e) {
        console.error("Failed to update session", e);
    }
  };

  // -- Secret App Toggle --
  const handleSecretToggle = () => {
      // If timer is running in FocusFlow, maybe pause it? 
      // For now, we let it run in background or user should stop it.
      if (timer.isRunning) {
          if (confirm("Timer is running. Stop it to enter secret mode?")) {
              handleStop();
              setShowSecretApp(true);
          }
      } else {
          setShowSecretApp(true);
      }
  };

  if (showSecretApp) {
      return <SecretApp onExit={() => setShowSecretApp(false)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 flex flex-col items-center overflow-hidden select-none transition-colors duration-300">
      
      <Header 
        view={view} 
        setView={handleViewChange} 
        showIndicator={hasUnviewed} 
        theme={theme}
        toggleTheme={toggleTheme}
        onSecretClick={handleSecretToggle}
      />

      <main className="flex-1 w-full max-w-2xl px-6 pb-12 flex flex-col gap-8 relative z-0">
        <AnimatePresence mode="wait">
          {view === 'timer' && (
             <TimerView 
                mode={timer.mode}
                timeLeft={timer.timeLeft}
                duration={timer.duration}
                stopwatchTime={timer.stopwatchTime}
                isRunning={timer.isRunning}
                settings={settings}
                subject={subject}
                setSubject={setSubject}
                onSwitchMode={handleSwitchMode}
                onToggleTimer={timer.toggleTimer}
                onStopTimer={handleStop}
                onResetTimer={timer.resetTimer}
                onUpdateSettings={updateSetting}
                onFullSettingsUpdate={handleFullSettingsUpdate}
                setTimeLeft={timer.setTimeLeft}
                setDuration={timer.setDuration}
                isAlarmRinging={isAlarmRinging}
                onStopAlarm={stopAlarm}
             />
          )}

          {view === 'stats' && (
             <StatsView 
                sessions={sessions}
                onDelete={handleDeleteSession}
                onUpdate={handleUpdateSession}
             />
          )}
        </AnimatePresence>
      </main>

      <Snackbar 
        isOpen={showUndo}
        message="Session deleted"
        actionLabel="Undo"
        onAction={handleUndoDelete}
        onClose={() => setShowUndo(false)}
      />
    </div>
  );
};

export default App;
