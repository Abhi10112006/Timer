
import { TimerSettings, StreakSettings } from './types';

export const DB_NAME = 'FocusFlowDB';
export const DB_VERSION = 5; // Bumped version for new stores
export const STORE_NAME = 'sessions';
export const SETTINGS_STORE_NAME = 'settings';
export const STREAK_STORE_NAME = 'streak_logs'; // New store for secret app

export const DEFAULT_POMODORO_TIME = 25 * 60; // 25 minutes
export const SHORT_BREAK_TIME = 5 * 60;
export const LONG_BREAK_TIME = 15 * 60;

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 20 * 60, // 20 minutes default
  shortBreakDuration: 5,
  longBreakDuration: 15,
  alarmType: 'default',
  alarmDuration: 10, // Default 10 seconds
  stopwatchTicking: false // Default off
};

export const DEFAULT_STREAK_SETTINGS: StreakSettings = {
  lastRelapseDate: Date.now(),
  bestStreakSeconds: 0
};

// Hex colors for Recharts - Amber First
export const CHART_COLORS = [
  '#f59e0b', // Amber
  '#4f46e5', // Indigo
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#84cc16', // Lime
];

// Tailwind classes for UI elements (Session List)
export const SUBJECT_COLORS = [
  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', indicator: 'bg-amber-500' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800/50', text: 'text-indigo-700 dark:text-indigo-400', indicator: 'bg-indigo-500' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-400', indicator: 'bg-emerald-500' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800/50', text: 'text-pink-700 dark:text-pink-400', indicator: 'bg-pink-500' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800/50', text: 'text-cyan-700 dark:text-cyan-400', indicator: 'bg-cyan-500' },
  { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800/50', text: 'text-violet-700 dark:text-violet-400', indicator: 'bg-violet-500' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800/50', text: 'text-rose-700 dark:text-rose-400', indicator: 'bg-rose-500' },
  { bg: 'bg-lime-50 dark:bg-lime-900/20', border: 'border-lime-200 dark:border-lime-800/50', text: 'text-lime-700 dark:text-lime-400', indicator: 'bg-lime-500' },
];
