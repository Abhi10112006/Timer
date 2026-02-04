
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Crown, LogOut } from 'lucide-react';
import Button from './Button';
import DailyRewardCard from './DailyReward';

interface SecretDashboardProps {
    isActive: boolean;
    days: number;
    diff: number;
    startDate: number;
    rank: { name: string; days: number; color: string };
    nextRank?: { name: string; days: number; color: string };
    progress: number;
    onStart: (timestamp: number) => void;
}

const SecretDashboard: React.FC<SecretDashboardProps> = ({ isActive, days, diff, startDate, rank, nextRank, progress, onStart }) => {
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

    // Graduation State: 100+ Days
    if (isActive && days >= 100) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full px-6 text-center pb-24"
            >
                <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse">
                    <Crown className="w-16 h-16 text-black" />
                </div>
                
                <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Iron Will</h1>
                
                <div className="max-w-xs space-y-6">
                    <p className="text-amber-100/80 text-lg font-medium leading-relaxed">
                        You have forged yourself in fire for {days} days.
                    </p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        The chains of habit are broken. You are the master of your own mind.
                        You no longer need this app to control yourself.
                    </p>
                    
                    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl mt-8">
                        <span className="block text-4xl font-bold text-white mb-1">{days}</span>
                        <span className="text-xs text-zinc-500 uppercase tracking-widest">Days Free</span>
                    </div>

                    <p className="text-xs text-zinc-600 italic">
                        "He who conquers himself is the mightiest warrior."
                    </p>
                </div>
                
                {/* Still allow daily card generation for Day 100+ */}
                <div className="w-full max-w-sm mt-8 pb-8">
                     <DailyRewardCard day={days + 1} startDate={startDate} />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-start h-full px-6 pb-24 w-full overflow-y-auto scrollbar-hide pt-6"
        >
            {!isActive ? (
                <div className="flex flex-col items-center text-center gap-8 w-full max-w-sm my-auto">
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
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className={`text-xs font-bold uppercase tracking-widest ${rank.color} bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800`}>
                            {rank.name}
                        </div>
                        
                        {/* Circular Progress with SVG ViewBox Fix */}
                        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0">
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
                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs shrink-0">
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

                    {/* Daily Reward Section */}
                    <div className="w-full max-w-sm mt-8 pb-8">
                         <DailyRewardCard day={days + 1} startDate={startDate} />
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default SecretDashboard;
