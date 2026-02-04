
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Activity, Book, Home, AlertTriangle, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { dbService } from '../services/db';
import { StreakSettings, StreakLog, JournalEntry } from '../types';
import { DEFAULT_STREAK_SETTINGS, STREAK_RANKS } from '../constants';
import Snackbar from './Snackbar';
import SecretDashboard from './SecretDashboard';
import SecretJournal from './SecretJournal';
import SecretStats from './SecretStats';
import SecretSOS from './SecretSOS';

interface SecretAppProps {
  onExit: () => void;
}

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
  const currentRank = [...STREAK_RANKS].reverse().find(r => days >= r.days) || STREAK_RANKS[0];
  const nextRank = STREAK_RANKS.find(r => r.days > days);
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
                 <SecretDashboard 
                    key="home"
                    isActive={isActive}
                    days={days} 
                    diff={diff} 
                    startDate={settings.lastRelapseDate}
                    rank={currentRank} 
                    nextRank={nextRank} 
                    progress={progressToNext}
                    onStart={handleStartStreak}
                 />
             )}
             {activeTab === 'journal' && (
                 <SecretJournal key="journal" entries={journal} onAdd={addJournal} onDelete={deleteJournal} />
             )}
             {activeTab === 'stats' && (
                 <SecretStats key="stats" logs={logs} currentStreak={diff/1000} bestStreak={settings.bestStreakSeconds} isActive={isActive} />
             )}
             {activeTab === 'sos' && (
                 <SecretSOS key="sos" onRelapse={handleRelapse} confirmReset={confirmReset} setConfirmReset={setConfirmReset} isActive={isActive} />
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

export default SecretApp;
