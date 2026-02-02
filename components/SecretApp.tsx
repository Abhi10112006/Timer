
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RefreshCw, Trophy, History, ArrowLeft, ShieldCheck, Quote } from 'lucide-react';
import { dbService } from '../services/db';
import { StreakSettings, StreakLog } from '../types';
import { DEFAULT_STREAK_SETTINGS } from '../constants';
import Button from './Button';

interface SecretAppProps {
  onExit: () => void;
}

const QUOTES = [
  "The only person you are destined to become is the person you decide to be.",
  "Discipline is doing what needs to be done, even if you don't want to do it.",
  "Your future self is watching you right now through memories.",
  "Don't trade what you want most for what you want now.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Mastering yourself is true power.",
  "Pain of discipline is far less than pain of regret."
];

const SecretApp: React.FC<SecretAppProps> = ({ onExit }) => {
  const [settings, setSettings] = useState<StreakSettings>(DEFAULT_STREAK_SETTINGS);
  const [logs, setLogs] = useState<StreakLog[]>([]);
  const [now, setNow] = useState(Date.now());
  const [confirmReset, setConfirmReset] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);

  // -- Load Data --
  useEffect(() => {
    const load = async () => {
      try {
        const s = await dbService.getStreakSettings();
        const l = await dbService.getStreakLogs();
        setSettings(s);
        setLogs(l);
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
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
  const diff = Math.max(0, now - settings.lastRelapseDate);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const bestDiff = settings.bestStreakSeconds * 1000;
  const bestDays = Math.floor(bestDiff / (1000 * 60 * 60 * 24));
  const bestHours = Math.floor((bestDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  // -- Handlers --
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
      lastRelapseDate: endDate,
      bestStreakSeconds: newBest
    };

    try {
      await dbService.addStreakLog(newLog);
      await dbService.saveStreakSettings(newSettings);
      
      setLogs(prev => [newLog, ...prev]);
      setSettings(newSettings);
      setConfirmReset(false);
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    } catch (e) {
      console.error("Failed to save relapse", e);
    }
  };

  const formatDurationSimple = (sec: number) => {
    const d = Math.floor(sec / (3600 * 24));
    const h = Math.floor((sec % (3600 * 24)) / 3600);
    if (d > 0) return `${d}d ${h}h`;
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center overflow-y-auto font-sans selection:bg-red-500/30">
      
      {/* Navbar */}
      <div className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
         <button onClick={onExit} className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
         </button>
         <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
            <ShieldCheck className="w-4 h-4" />
            Iron Will
         </div>
      </div>

      <main className="w-full max-w-lg px-6 pb-20 flex flex-col gap-12 mt-4">
        
        {/* Main Counter */}
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full" />
                
                <div className="relative flex flex-col items-center gap-1 z-10">
                    <span className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Current Streak</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-8xl font-bold tracking-tighter text-white tabular-nums">
                            {days}
                        </span>
                        <span className="text-xl text-zinc-500 font-medium">days</span>
                    </div>
                    <div className="flex gap-4 text-zinc-400 font-mono text-lg mt-2 opacity-80">
                         <span className="tabular-nums">{hours.toString().padStart(2, '0')}h</span>
                         <span className="opacity-30">:</span>
                         <span className="tabular-nums">{minutes.toString().padStart(2, '0')}m</span>
                         <span className="opacity-30">:</span>
                         <span className="tabular-nums">{seconds.toString().padStart(2, '0')}s</span>
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            <motion.div 
               className="mt-4"
               animate={confirmReset ? { scale: 1.05 } : { scale: 1 }}
            >
                <button
                    onClick={handleRelapse}
                    onMouseLeave={() => setConfirmReset(false)}
                    className={`
                        relative group px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-300
                        ${confirmReset 
                            ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]' 
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}
                    `}
                >
                    <span className="flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${confirmReset ? 'animate-spin' : ''}`} />
                        {confirmReset ? "CONFIRM RELAPSE" : "RESET COUNTER"}
                    </span>
                </button>
            </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Best Streak</span>
                <span className="text-xl font-bold text-white">
                    {bestDays}d {bestHours}h
                </span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mb-1">
                    <History className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Relapses</span>
                <span className="text-xl font-bold text-white">
                    {logs.length}
                </span>
            </div>
        </div>

        {/* Quote */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden">
             <Quote className="absolute top-4 left-4 w-8 h-8 text-zinc-800" />
             <p className="relative z-10 text-center text-zinc-300 font-serif italic text-lg leading-relaxed">
                 "{quote}"
             </p>
        </div>

        {/* History List */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest pl-2">
                <Flame className="w-4 h-4" />
                Past Streaks
            </div>
            
            <div className="flex flex-col gap-2">
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 text-sm">
                        No history recorded yet.
                    </div>
                ) : (
                    logs.slice(0, 5).map((log, i) => (
                        <div key={log.id || i} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                             <div className="flex flex-col">
                                 <span className="text-zinc-300 font-bold tabular-nums">
                                     {formatDurationSimple(log.durationSeconds)}
                                 </span>
                                 <span className="text-xs text-zinc-600 mt-0.5">
                                     Ended {new Date(log.endDate).toLocaleDateString()}
                                 </span>
                             </div>
                             <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-zinc-600 rounded-full" 
                                    style={{ width: `${Math.min(100, (log.durationSeconds / (settings.bestStreakSeconds || 1)) * 100)}%` }} 
                                 />
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </main>
    </div>
  );
};

export default SecretApp;
