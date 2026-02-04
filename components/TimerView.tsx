
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Timer, Brain, Coffee, Armchair, LucideIcon, Settings as SettingsIcon } from 'lucide-react';
import { TimerMode, TimerSettings } from '../types';
import Button from './Button';
import Input from './Input';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import SettingsForm from './SettingsForm';

interface TimerViewProps {
  mode: TimerMode;
  timeLeft: number;
  duration: number; // Max time for current session
  stopwatchTime: number;
  isRunning: boolean;
  settings: TimerSettings;
  subject: string;
  setSubject: (s: string) => void;
  onSwitchMode: (mode: TimerMode) => void;
  onToggleTimer: () => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
  onUpdateSettings: (key: keyof TimerSettings, value: number) => void;
  onFullSettingsUpdate?: (settings: TimerSettings) => void;
  setTimeLeft: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  isAlarmRinging?: boolean;
  onStopAlarm?: () => void;
}

// --- Internal Component: PresetDial ---
interface PresetDialProps {
  minutes: number;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  ringClass: string;
  onClick: () => void;
}

const PresetDial: React.FC<PresetDialProps> = ({ minutes, label, icon: Icon, colorClass, bgClass, ringClass, onClick }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = minutes / 60;
  const dashOffset = circumference * (1 - fillPercent);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-3 group"
    >
      <div className={`relative w-16 h-16 rounded-full ${bgClass} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
        {/* SVG Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform p-1" viewBox="0 0 64 64">
           {/* Background Ring */}
           <circle 
             cx="32" cy="32" r={radius} 
             fill="none" 
             stroke="currentColor" 
             strokeWidth="4" 
             className="text-black/5 dark:text-white/10"
           />
           {/* Progress Ring */}
           <circle 
             cx="32" cy="32" r={radius} 
             fill="none" 
             stroke="currentColor" 
             strokeWidth="4" 
             strokeLinecap="round"
             strokeDasharray={circumference}
             strokeDashoffset={dashOffset}
             className={ringClass}
           />
        </svg>
        
        {/* Center Number */}
        <span className={`text-xl font-bold ${colorClass} font-mono tracking-tighter`}>
          {minutes}
        </span>
      </div>
      
      {/* Label */}
      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <Icon className={`w-3 h-3 ${colorClass}`} />
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
    </motion.button>
  );
};

const TimerView: React.FC<TimerViewProps> = ({
  mode,
  timeLeft,
  duration,
  stopwatchTime,
  isRunning,
  settings,
  subject,
  setSubject,
  onSwitchMode,
  onToggleTimer,
  onStopTimer,
  onResetTimer,
  onUpdateSettings,
  onFullSettingsUpdate,
  setTimeLeft,
  setDuration,
  isAlarmRinging,
  onStopAlarm
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editValues, setEditValues] = useState({ h: '00', m: '00', s: '00' });
  const containerRef = useRef<HTMLDivElement>(null);

  const syncEditValues = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setEditValues({
          h: h.toString().padStart(2, '0'),
          m: m.toString().padStart(2, '0'),
          s: s.toString().padStart(2, '0')
      });
  };

  const handleTimeClick = () => {
      if (mode === TimerMode.POMODORO && !isRunning) {
          setIsEditing(true);
          syncEditValues(timeLeft);
      }
  };

  const handleDurationChange = (newSeconds: number) => {
      setTimeLeft(newSeconds);
      setDuration(newSeconds);
      onUpdateSettings('focusDuration', newSeconds);
      syncEditValues(newSeconds);
  };

  const handleEditChange = (field: 'h' | 'm' | 's', value: string) => {
      const cleanVal = value.replace(/\D/g, '').slice(0, 2);
      setEditValues(prev => ({ ...prev, [field]: cleanVal }));
  };

  const handleEditSubmit = () => {
      setIsEditing(false);
      const h = parseInt(editValues.h || '0');
      const m = parseInt(editValues.m || '0');
      const s = parseInt(editValues.s || '0');
      
      const totalSeconds = (h * 3600) + (m * 60) + s;
      
      if (totalSeconds > 0) {
          setTimeLeft(totalSeconds);
          setDuration(totalSeconds);
          onUpdateSettings('focusDuration', totalSeconds);
      } else {
          syncEditValues(timeLeft);
      }
  };

  // Stable ref for the event listener
  const handleEditSubmitRef = useRef(handleEditSubmit);
  useEffect(() => {
      handleEditSubmitRef.current = handleEditSubmit;
  });

  // Click Outside to Close Logic
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            handleEditSubmitRef.current();
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isEditing]);

  const applyPreset = (mins: number, type: 'focus' | 'short' | 'long') => {
      const seconds = mins * 60;
      setTimeLeft(seconds);
      setDuration(seconds); // Set the max time for the circle
      syncEditValues(seconds);
      
      if (type === 'focus') onUpdateSettings('focusDuration', seconds);
      if (type === 'short') onUpdateSettings('shortBreakDuration', mins);
      if (type === 'long') onUpdateSettings('longBreakDuration', mins);
      
      setIsEditing(false);
  };

  const handleToggle = () => {
      if (isEditing) handleEditSubmit();
      onToggleTimer();
  };

  // Sync edit values when timeLeft updates externally (e.g. from settings load)
  useEffect(() => {
    if (!isRunning && mode === TimerMode.POMODORO && !isEditing) {
       syncEditValues(timeLeft);
    }
  }, [timeLeft, isRunning, mode, isEditing]);

  if (showSettings) {
      return (
          <SettingsForm 
             settings={settings}
             mode={mode}
             onSave={(newSettings) => {
                 onFullSettingsUpdate?.(newSettings);
                 // If the new focus duration differs, apply it (though form mostly updates state for next session)
                 if (!isRunning && mode === TimerMode.POMODORO && newSettings.focusDuration !== settings.focusDuration) {
                     setTimeLeft(newSettings.focusDuration);
                     setDuration(newSettings.focusDuration);
                 }
                 setShowSettings(false);
             }}
             onCancel={() => setShowSettings(false)}
          />
      );
  }

  return (
    <motion.div 
      key="timer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center"
    >
      
      {/* Mode Toggle & Settings Button */}
      <div className="flex items-center justify-between w-full mb-8 px-4">
        <div className="flex items-center gap-2">
            <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => onSwitchMode(TimerMode.POMODORO)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mode === TimerMode.POMODORO ? 'bg-amber-500 text-zinc-950 ring-1 ring-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
            <Clock className="w-3.5 h-3.5" />
            Focus
            </motion.button>
            <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => onSwitchMode(TimerMode.STOPWATCH)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mode === TimerMode.STOPWATCH ? 'bg-amber-500 text-zinc-950 ring-1 ring-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
            <Timer className="w-3.5 h-3.5" />
            Stopwatch
            </motion.button>
        </div>
        
        <button 
           onClick={() => setShowSettings(true)}
           className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
            <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      <div ref={containerRef} className="w-full flex justify-center">
        <TimerDisplay 
            mode={mode}
            timeLeft={timeLeft}
            stopwatchTime={stopwatchTime}
            maxTime={duration} 
            isRunning={isRunning}
            isEditing={isEditing}
            editValues={editValues}
            onTimeClick={handleTimeClick}
            onEditChange={handleEditChange}
            onEditSubmit={handleEditSubmit}
            onDurationChange={handleDurationChange}
        />
      </div>

      {/* Quick Actions / Presets */}
      <AnimatePresence>
          {(isEditing || (mode === TimerMode.POMODORO && !isRunning)) && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="flex justify-center gap-6 sm:gap-8 md:gap-12 mb-10 w-full"
              >
                  <PresetDial 
                    minutes={25} 
                    label="Focus" 
                    icon={Brain} 
                    onClick={() => applyPreset(25, 'focus')}
                    bgClass="bg-amber-50 dark:bg-amber-900/10"
                    colorClass="text-amber-600 dark:text-amber-500"
                    ringClass="text-amber-500"
                  />
                  
                  <PresetDial 
                    minutes={5} 
                    label="Short" 
                    icon={Coffee} 
                    onClick={() => applyPreset(5, 'short')}
                    bgClass="bg-emerald-50 dark:bg-emerald-900/10"
                    colorClass="text-emerald-600 dark:text-emerald-500"
                    ringClass="text-emerald-500"
                  />

                  <PresetDial 
                    minutes={15} 
                    label="Long" 
                    icon={Armchair} 
                    onClick={() => applyPreset(15, 'long')}
                    bgClass="bg-indigo-50 dark:bg-indigo-900/10"
                    colorClass="text-indigo-600 dark:text-indigo-500"
                    ringClass="text-indigo-500"
                  />
              </motion.div>
          )}
      </AnimatePresence>

      <div className="w-full max-w-sm mb-8 z-10">
         <Input 
           placeholder="What are you studying?" 
           value={subject}
           onChange={(e) => setSubject(e.target.value)}
           className="text-center"
         />
      </div>

      <TimerControls 
        isRunning={isRunning}
        onToggle={handleToggle}
        onStop={onStopTimer}
        onReset={onResetTimer}
        disableStop={!isRunning && (mode === TimerMode.POMODORO ? timeLeft === settings.focusDuration : stopwatchTime === 0)}
        isAlarmRinging={isAlarmRinging}
        onStopAlarm={onStopAlarm}
      />

    </motion.div>
  );
};

export default TimerView;
