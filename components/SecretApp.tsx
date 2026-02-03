
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, RefreshCw, Trophy, History, ArrowLeft, ShieldCheck, 
  Quote, Activity, Book, Home, AlertTriangle, Send, Heart, Wind, Power,
  Calendar, Trash2, X, ZoomIn, ZoomOut
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { dbService } from '../services/db';
import { StreakSettings, StreakLog, JournalEntry } from '../types';
import { DEFAULT_STREAK_SETTINGS } from '../constants';
import Button from './Button';
import Snackbar from './Snackbar';

interface SecretAppProps {
  onExit: () => void;
}

const RANKS = [
    { name: 'Initiate', days: 0, color: 'text-zinc-400' },
    { name: 'Novice', days: 3, color: 'text-emerald-400' },
    { name: 'Apprentice', days: 7, color: 'text-cyan-400' },
    { name: 'Adept', days: 14, color: 'text-indigo-400' },
    { name: 'Expert', days: 30, color: 'text-purple-400' },
    { name: 'Master', days: 90, color: 'text-amber-400' },
    { name: 'Legend', days: 365, color: 'text-rose-400' },
];

const QUOTES = [
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

const SecretApp: React.FC<SecretAppProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'journal' | 'stats' | 'sos'>('home');
  const [settings, setSettings] = useState<StreakSettings>(DEFAULT_STREAK_SETTINGS);
  const [logs, setLogs] = useState<StreakLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  const [confirmReset, setConfirmReset] = useState(false);

  // Undo State
  const [showUndo, setShowUndo] = useState(false);
  const [undoEntry, setUndoEntry] = useState<JournalEntry | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  // -- Load Data --
  useEffect(() => {
    const load = async () => {
      try {
        const [s, l, j] = await Promise.all([
            dbService.getStreakSettings(),
            dbService.getStreakLogs(),
            dbService.getJournalEntries()
        ]);
        // Merge defaults in case of missing fields (like isActive)
        setSettings({ ...DEFAULT_STREAK_SETTINGS, ...s });
        setLogs(l);
        setJournal(j);
      } catch (e) {
        console.error("Failed to load secret data", e);
      }
    };
    load();
  }, []);

  // -- Timer Tick --
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // -- Calculations --
  const isActive = settings.isActive;
  const diff = isActive ? Math.max(0, now - settings.lastRelapseDate) : 0;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const currentRank = [...RANKS].reverse().find(r => days >= r.days) || RANKS[0];
  const nextRank = RANKS.find(r => r.days > days);
  const progressToNext = nextRank 
      ? Math.min(100, ((days - currentRank.days) / (nextRank.days - currentRank.days)) * 100)
      : 100;

  // -- Handlers --
  const handleStartStreak = async (startTimestamp: number = Date.now()) => {
      const newSettings: StreakSettings = {
          ...settings,
          isActive: true,
          lastRelapseDate: startTimestamp
      };
      await dbService.saveStreakSettings(newSettings);
      setSettings(newSettings);
  };

  const handleRelapse = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    const currentDurationSeconds = Math.floor(diff / 1000);
    const endDate = Date.now();

    const newLog: StreakLog = {
      startDate: settings.lastRelapseDate,
      endDate: endDate,
      durationSeconds: currentDurationSeconds
    };

    const newBest = Math.max(settings.bestStreakSeconds, currentDurationSeconds);

    const newSettings: StreakSettings = {
      ...settings,
      isActive: true, // Remains active, just resets
      lastRelapseDate: endDate,
      bestStreakSeconds: newBest
    };

    try {
      await dbService.addStreakLog(newLog);
      await dbService.saveStreakSettings(newSettings);
      
      setLogs(prev => [newLog, ...prev]);
      setSettings(newSettings);
      setConfirmReset(false);
      setActiveTab('journal'); // Prompt to write about it
    } catch (e) {
      console.error("Failed to save relapse", e);
    }
  };

  const addJournal = async (content: string, mood: JournalEntry['mood']) => {
      const entry: JournalEntry = {
          timestamp: Date.now(),
          content,
          mood
      };
      await dbService.addJournalEntry(entry);
      const newEntries = await dbService.getJournalEntries();
      setJournal(newEntries);
  };

  const deleteJournal = async (id: number) => {
      // Find the entry to delete for potential undo
      const entryToDelete = journal.find(j => j.id === id);
      if (!entryToDelete) return;

      // Optimistic update
      setJournal(prev => prev.filter(j => j.id !== id));
      
      // Delete from DB
      await dbService.deleteJournalEntry(id);

      // Setup Undo
      setUndoEntry(entryToDelete);
      setShowUndo(true);

      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = window.setTimeout(() => {
          setShowUndo(false);
          setUndoEntry(null);
      }, 5000);
  };

  const handleUndoDelete = async () => {
      if (!undoEntry) return;
      try {
          const { id, ...entryData } = undoEntry;
          // Re-add to DB (will get new ID, which is fine)
          await dbService.addJournalEntry(entryData);
          const newEntries = await dbService.getJournalEntries();
          setJournal(newEntries);
          setShowUndo(false);
          setUndoEntry(null);
          if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      } catch (e) {
          console.error("Undo failed", e);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md z-10 shrink-0">
         <button onClick={onExit} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
         </button>
         <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Iron Will
         </div>
         <div className="w-8" /> 
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
         <AnimatePresence mode="wait">
             {activeTab === 'home' && (
                 <DashboardView 
                    key="home"
                    isActive={isActive}
                    days={days} 
                    diff={diff} 
                    rank={currentRank} 
                    nextRank={nextRank} 
                    progress={progressToNext}
                    onStart={handleStartStreak}
                 />
             )}
             {activeTab === 'journal' && (
                 <JournalView key="journal" entries={journal} onAdd={addJournal} onDelete={deleteJournal} />
             )}
             {activeTab === 'stats' && (
                 <StatsView key="stats" logs={logs} currentStreak={diff/1000} bestStreak={settings.bestStreakSeconds} isActive={isActive} />
             )}
             {activeTab === 'sos' && (
                 <SOSView key="sos" onRelapse={handleRelapse} confirmReset={confirmReset} setConfirmReset={setConfirmReset} isActive={isActive} />
             )}
         </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 w-full bg-zinc-950 border-t border-zinc-900 px-6 py-3 flex justify-between items-center z-20 shrink-0 safe-area-bottom">
          <NavButton icon={Home} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={Book} label="Journal" isActive={activeTab === 'journal'} onClick={() => setActiveTab('journal')} />
          <NavButton icon={Activity} label="Stats" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <NavButton icon={AlertTriangle} label="Panic" isActive={activeTab === 'sos'} onClick={() => setActiveTab('sos')} isDanger />
      </nav>

      <Snackbar 
        isOpen={showUndo}
        message="Entry deleted"
        actionLabel="Undo"
        onAction={handleUndoDelete}
        onClose={() => setShowUndo(false)}
      />

    </div>
  );
};

interface NavButtonProps {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isDanger?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick, isDanger = false }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? (isDanger ? 'text-rose-500' : 'text-white') : 'text-zinc-600'}`}
    >
        <Icon className={`w-6 h-6 ${isActive && isDanger ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
);

// --- SUB-VIEWS ---

interface DashboardViewProps {
    isActive: boolean;
    days: number;
    diff: number;
    rank: { name: string; days: number; color: string };
    nextRank?: { name: string; days: number; color: string };
    progress: number;
    onStart: (timestamp: number) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ isActive, days, diff, rank, nextRank, progress, onStart }) => {
    const [showDateInput, setShowDateInput] = useState(false);
    const [customDate, setCustomDate] = useState('');

    // Breakdown time
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    const handleCustomStart = () => {
        if (!customDate) return;
        const timestamp = new Date(customDate).getTime();
        if (timestamp > Date.now()) {
            alert("Cannot start a streak in the future.");
            return;
        }
        onStart(timestamp);
    };

    // Centered layout logic: h-full plus justification
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center h-full px-6 gap-8 pb-16 w-full"
        >
            {!isActive ? (
                <div className="flex flex-col items-center text-center gap-8 w-full max-w-sm">
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                        <Power className="w-10 h-10 text-zinc-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-3">Begin Your Journey</h2>
                        <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
                            "The best time to start was yesterday. The next best time is now."
                        </p>
                    </div>
                    
                    {!showDateInput ? (
                        <div className="flex flex-col gap-4 w-full">
                            <Button 
                                onClick={() => onStart(Date.now())}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-emerald-900/20"
                            >
                                Start Now
                            </Button>
                            <button 
                                onClick={() => setShowDateInput(true)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                            >
                                I started earlier
                            </button>
                        </div>
                    ) : (
                        <div className="w-full bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 animate-in fade-in zoom-in-95">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block text-left">
                                Select Start Date & Time
                            </label>
                            <input 
                                type="datetime-local"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => setShowDateInput(false)}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleCustomStart}
                                    disabled={!customDate}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center gap-4">
                        <div className={`text-xs font-bold uppercase tracking-widest ${rank.color} bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800`}>
                            {rank.name}
                        </div>
                        
                        {/* Circular Progress with SVG ViewBox Fix */}
                        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                {/* Background Circle */}
                                <circle 
                                    cx="50" cy="50" r="45" 
                                    fill="none" 
                                    stroke="#18181b" 
                                    strokeWidth="6" 
                                />
                                {/* Progress Circle */}
                                <circle 
                                    cx="50" cy="50" r="45" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="6"
                                    strokeDasharray={2 * Math.PI * 45} // Circumference ~282.7
                                    strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
                                    className={`${rank.color} transition-all duration-1000 ease-out`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            
                            <div className="flex flex-col items-center z-10">
                                <span className="text-7xl md:text-8xl font-bold tracking-tighter text-white tabular-nums">
                                    {days}
                                </span>
                                <span className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-2">Days Clean</span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Counter */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                        <div className="flex flex-col items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                            <span className="text-xl md:text-2xl font-bold text-white tabular-nums">{h}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Hrs</span>
                        </div>
                        <div className="flex flex-col items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                            <span className="text-xl md:text-2xl font-bold text-white tabular-nums">{m}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Mins</span>
                        </div>
                        <div className="flex flex-col items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                            <span className="text-xl md:text-2xl font-bold text-amber-500 tabular-nums">{s}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Secs</span>
                        </div>
                    </div>

                    {/* Next Rank Info */}
                    {nextRank && (
                        <div className="w-full max-w-xs bg-zinc-900/30 px-6 py-4 rounded-xl border border-zinc-800/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Next Rank</span>
                                <span className={`font-bold text-sm ${nextRank.color}`}>{nextRank.name}</span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-white font-bold text-lg">{nextRank.days - days}</span>
                                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">days left</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

interface JournalViewProps {
    entries: JournalEntry[];
    onAdd: (content: string, mood: JournalEntry['mood']) => void;
    onDelete: (id: number) => void;
}

const JournalView: React.FC<JournalViewProps> = ({ entries, onAdd, onDelete }) => {
    const [text, setText] = useState('');
    const [mood, setMood] = useState<JournalEntry['mood']>('neutral');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text, mood);
        setText('');
        setMood('neutral');
    };

    // Group entries by date
    const groupedEntries = useMemo(() => {
        const groups: Record<string, JournalEntry[]> = {};
        entries.forEach((entry: JournalEntry) => {
            const dateKey = new Date(entry.timestamp).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(entry);
        });
        return groups;
    }, [entries]);

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full pt-6 px-4 gap-6"
        >
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shrink-0">
                 <h3 className="text-zinc-400 text-xs uppercase font-bold mb-3">New Entry</h3>
                 <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                     <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="How are you feeling today?"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 min-h-[80px]"
                     />
                     <div className="flex items-center justify-between">
                         <div className="flex gap-2">
                             {(['good', 'neutral', 'bad', 'urge'] as const).map(m => (
                                 <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMood(m)}
                                    className={`p-2 rounded-lg border text-xs transition-colors ${mood === m 
                                        ? 'bg-zinc-800 border-zinc-600 text-white' 
                                        : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900'}`}
                                 >
                                     {m === 'good' && '😊'}
                                     {m === 'neutral' && '😐'}
                                     {m === 'bad' && '😔'}
                                     {m === 'urge' && '⚠️'}
                                 </button>
                             ))}
                         </div>
                         <button 
                            type="submit" 
                            disabled={!text.trim()}
                            className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 disabled:opacity-50"
                         >
                             Save
                         </button>
                     </div>
                 </form>
             </div>

             <div className="flex flex-col gap-4 pb-8">
                 {entries.length === 0 ? (
                     <div className="text-center text-zinc-600 text-sm py-12 flex flex-col items-center gap-3">
                         <Book className="w-8 h-8 opacity-20" />
                         <p>Your journal is empty.</p>
                     </div>
                 ) : (
                     Object.entries(groupedEntries).map(([date, group]) => (
                         <div key={date} className="flex flex-col gap-3">
                             <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md py-2 border-b border-zinc-900">
                                 <h3 className="text-zinc-500 text-xs uppercase font-bold pl-1">{date}</h3>
                             </div>
                             {(group as JournalEntry[]).map((entry) => (
                                <div key={entry.id || entry.timestamp} className="group relative bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                                                {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {entry.mood === 'good' && '😊'}
                                                {entry.mood === 'neutral' && '😐'}
                                                {entry.mood === 'bad' && '😔'}
                                                {entry.mood === 'urge' && '⚠️'}
                                            </span>
                                            <Button 
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (entry.id) onDelete(entry.id);
                                                }}
                                                className="text-zinc-600 hover:text-rose-500 hover:bg-rose-950/30 transition-colors w-7 h-7 rounded-lg -mr-1"
                                                title="Delete Entry"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                                </div>
                             ))}
                         </div>
                     ))
                 )}
             </div>
        </motion.div>
    );
};

interface StatsViewProps {
    logs: StreakLog[];
    currentStreak: number;
    bestStreak: number;
    isActive: boolean;
}

const StatsView: React.FC<StatsViewProps> = ({ logs, currentStreak, bestStreak, isActive }) => {
    const [zoomLevel, setZoomLevel] = useState(1);
    
    // Use ALL logs, do not slice. 
    // We reverse logs so newest are at the right (traditional chart flow) or left? 
    // Recharts draws left-to-right. Usually time series go oldest -> newest.
    // The logs from DB are sorted desc (newest first). Let's reverse them for the chart (oldest -> newest)
    const chartData = useMemo(() => {
        return [...logs].reverse().map((l: StreakLog) => ({
            date: new Date(l.endDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
            days: parseFloat((l.durationSeconds / 86400).toFixed(1))
        }));
    }, [logs]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col pt-6 px-4 gap-6 h-full"
        >
             <div className="grid grid-cols-2 gap-4 shrink-0">
                 <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                     <div className="flex items-center gap-2 mb-2 text-amber-500">
                         <Trophy className="w-4 h-4" />
                         <span className="text-[10px] uppercase font-bold tracking-wider">Best</span>
                     </div>
                     <span className="text-2xl font-bold text-white">
                         {Math.floor(bestStreak / 86400)} <span className="text-sm font-normal text-zinc-500">days</span>
                     </span>
                 </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                     <div className="flex items-center gap-2 mb-2 text-emerald-500">
                         <Flame className="w-4 h-4" />
                         <span className="text-[10px] uppercase font-bold tracking-wider">Current</span>
                     </div>
                     <span className="text-2xl font-bold text-white">
                         {isActive ? Math.floor(currentStreak / 86400) : 0} <span className="text-sm font-normal text-zinc-500">days</span>
                     </span>
                 </div>
             </div>

             <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shrink-0 flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-zinc-400 text-xs uppercase font-bold">Performance</h3>
                    <div className="flex items-center gap-1">
                        <button onClick={handleZoomOut} disabled={zoomLevel <= 1} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-zinc-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={handleZoomIn} disabled={zoomLevel >= 5} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
                 
                 {/* Scrollable Chart Container */}
                 <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50">
                     <div style={{ width: `${Math.max(100, chartData.length * 25 * zoomLevel)}%`, minWidth: '100%', height: '200px' }}>
                         {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#52525b" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        interval={zoomLevel > 1.5 ? 0 : 'preserveStartEnd'}
                                    />
                                    <Tooltip 
                                       contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                       itemStyle={{ color: '#fff', fontSize: '12px' }}
                                       cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="days" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorDays)" 
                                        activeDot={{ r: 4, fill: "#fff" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="flex items-center justify-center h-full text-zinc-600 text-xs">
                                 No history available yet.
                             </div>
                         )}
                     </div>
                 </div>
             </div>

             {/* Scrollable History List for Long Log Management */}
             <div className="flex flex-col gap-3 flex-1 overflow-hidden min-h-0">
                 <h3 className="text-zinc-400 text-xs uppercase font-bold pl-1">Relapse History</h3>
                 <div className="overflow-y-auto pr-1 pb-12 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                     {logs.length === 0 ? (
                         <div className="text-center py-8 text-zinc-600 text-xs">No records found.</div>
                     ) : (
                         logs.map((log, i) => {
                             const daysLasted = (log.durationSeconds / 86400).toFixed(1);
                             const dateStr = new Date(log.endDate).toLocaleDateString(undefined, {
                                 month: 'short', day: 'numeric', year: 'numeric'
                             });
                             return (
                                 <div key={i} className="flex items-center justify-between p-3 border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                                     <div className="flex flex-col">
                                         <span className="text-sm text-zinc-300">{dateStr}</span>
                                         <span className="text-[10px] text-zinc-500">Ended at {new Date(log.endDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <span className={`text-sm font-bold ${Number(daysLasted) > 7 ? 'text-emerald-500' : Number(daysLasted) > 3 ? 'text-cyan-500' : 'text-zinc-500'}`}>
                                             {daysLasted} Days
                                         </span>
                                     </div>
                                 </div>
                             );
                         })
                     )}
                 </div>
             </div>
        </motion.div>
    );
};

interface SOSViewProps {
    onRelapse: () => void;
    confirmReset: boolean;
    setConfirmReset: (val: boolean) => void;
    isActive: boolean;
}

const SOSView: React.FC<SOSViewProps> = ({ onRelapse, confirmReset, setConfirmReset, isActive }) => {
    const [phase, setPhase] = useState('Inhale');
    const [quoteIndex, setQuoteIndex] = useState(0);
    
    // Pick a random quote on mount
    useEffect(() => {
        setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    }, []);

    // Breathing Animation Loop
    useEffect(() => {
        const sequence = [
            { text: 'Inhale', time: 4000 },
            { text: 'Hold', time: 4000 },
            { text: 'Exhale', time: 4000 }
        ];
        let step = 0;

        const run = () => {
            setPhase(sequence[step].text);
            const duration = sequence[step].time;
            step = (step + 1) % sequence.length;
            // Change quote on Exhale occasionally? No, stick to one to focus.
            return duration;
        };

        let timer: number;
        const loop = () => {
             const duration = run();
             timer = window.setTimeout(loop, duration);
        };
        loop();

        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full px-6 relative overflow-hidden pb-16"
        >
            <div className="absolute inset-0 bg-rose-900/10 z-0 pointer-events-none" />

            <div className="z-10 flex flex-col items-center gap-12 w-full max-w-sm">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Urge Surfing</h2>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                        This feeling is temporary. Breathe through it.
                    </p>
                </div>

                {/* Breathing Circle */}
                <div className="relative flex items-center justify-center w-64 h-64">
                    <motion.div 
                        animate={{ 
                            scale: phase === 'Inhale' ? 1.5 : (phase === 'Hold' ? 1.5 : 1),
                            opacity: phase === 'Hold' ? 0.8 : 0.5
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl"
                    />
                    <motion.div 
                        animate={{ 
                            scale: phase === 'Inhale' ? 1.2 : (phase === 'Hold' ? 1.2 : 1),
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] z-10"
                    >
                         <span className="text-lg font-bold text-white uppercase tracking-widest">{phase}</span>
                    </motion.div>
                </div>

                {/* Quote Display */}
                <motion.div
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="min-h-[60px] flex items-center justify-center"
                >
                    <p className="text-center text-zinc-300 text-sm italic font-medium leading-relaxed px-4">
                        "{QUOTES[quoteIndex]}"
                    </p>
                </motion.div>

                {/* Relapse Button - Only show if active */}
                {isActive && (
                    <div className="mt-4 w-full">
                        <button
                            onClick={onRelapse}
                            onMouseLeave={() => setConfirmReset(false)}
                            className={`w-full py-4 rounded-xl border font-bold text-sm tracking-widest transition-all duration-300
                                ${confirmReset 
                                    ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                                    : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-red-900/50 hover:text-red-500 hover:bg-red-950/10'
                                }
                            `}
                        >
                            {confirmReset ? "I HAVE RELAPSED" : "REGISTER RELAPSE"}
                        </button>
                        {confirmReset && <p className="text-center text-xs text-red-400 mt-2">Click again to confirm reset.</p>}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SecretApp;
