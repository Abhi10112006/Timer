
import { TimerSettings, StreakSettings } from './types';

export const DB_NAME = 'FocusFlowDB';
export const DB_VERSION = 6; // Bumped version for new journal store
export const STORE_NAME = 'sessions';
export const SETTINGS_STORE_NAME = 'settings';
export const STREAK_STORE_NAME = 'streak_logs';
export const JOURNAL_STORE_NAME = 'journal_entries'; // New store

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
  lastRelapseDate: 0,
  bestStreakSeconds: 0,
  securityQuestion: undefined,
  securityAnswer: undefined,
  credentialId: undefined,
  isActive: false // User must manually start
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

export const STREAK_RANKS = [
    { name: 'Initiate', days: 0, color: 'text-zinc-400' },
    { name: 'Novice', days: 3, color: 'text-emerald-400' },
    { name: 'Apprentice', days: 7, color: 'text-cyan-400' },
    { name: 'Adept', days: 14, color: 'text-indigo-400' },
    { name: 'Expert', days: 30, color: 'text-purple-400' },
    { name: 'Master', days: 90, color: 'text-amber-400' },
    { name: 'Legend', days: 365, color: 'text-rose-400' },
];

export const MOTIVATIONAL_QUOTES = [
    "The only easy day was yesterday.",
    "Discipline is doing what needs to be done, even if you don't want to do it.",
    "Pain is temporary. Quitting lasts forever.",
    "He who conquers himself is the mightiest warrior.",
    "We suffer more often in imagination than in reality.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Do something today that your future self will thank you for.",
    "You are what you do, not what you say you'll do.",
    "Don't count the days, make the days count.",
    "A river cuts through rock, not because of its power, but because of its persistence.",
    "Your potential is endless. Go do what you were created to do.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Success consists of going from failure to failure without loss of enthusiasm.",
    "The man who moves a mountain begins by carrying away small stones.",
    "Believe you can and you're halfway there.",
    "Tough times never last, but tough people do.",
    "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    "If you want something you never had, you have to do something you've never done.",
    "Your life does not get better by chance, it gets better by change.",
    "Mastering others is strength. Mastering yourself is true power.",
    "Self-discipline is the magic power that makes you virtually unstoppable.",
    "We must all suffer from one of two pains: the pain of discipline or the pain of regret.",
    "The distance between dreams and reality is called action.",
    "Great things are not done by impulse, but by a series of small things brought together.",
    "Strength does not come from physical capacity. It comes from an indomitable will.",
    "Fall seven times, stand up eight.",
    "Don't wait. The time will never be just right.",
    "You don't have to be great to start, but you have to start to be great.",
    "Everything you've ever wanted is on the other side of fear.",
    "Freedom is not the absence of commitments, but the ability to choose and commit yourself to what is best for you."
];
