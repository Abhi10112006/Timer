
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, ZoomIn, ZoomOut } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StreakLog } from '../types';

interface SecretStatsProps {
    logs: StreakLog[];
    currentStreak: number;
    bestStreak: number;
    isActive: boolean;
}

const SecretStats: React.FC<SecretStatsProps> = ({ logs, currentStreak, bestStreak, isActive }) => {
    const [zoomLevel, setZoomLevel] = useState(1);
    
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

export default SecretStats;
