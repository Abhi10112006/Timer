
export enum TimerMode {
  POMODORO = 'POMODORO',
  STOPWATCH = 'STOPWATCH'
}

export enum SessionStatus {
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED', 
  PARTIAL = 'PARTIAL' // For stopwatch stops or interrupted focus
}

export interface StudySession {
  id?: number;
  subject: string;
  durationSeconds: number;
  timestamp: number;
  mode: TimerMode;
  status: SessionStatus; // Added status field
  notes?: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  sessionCount: number;
}

export interface SubjectStat {
  subject: string;
  totalSeconds: number;
}

export interface TimerSettings {
  focusDuration: number; // seconds
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  alarmType: 'default' | 'custom';
  alarmDuration: number; // seconds
  customAlarmData?: string; // Base64 Data URL
  customAlarmName?: string;
  stopwatchTicking: boolean; // Toggle for ticking sound
}

// --- Secret App Types ---

export interface StreakLog {
  id?: number;
  startDate: number;
  endDate: number; // The time of relapse
  durationSeconds: number;
}

export interface StreakSettings {
  lastRelapseDate: number; // Timestamp
  bestStreakSeconds: number;
}
