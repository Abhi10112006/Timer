import React from 'react';
import { motion } from 'framer-motion';
import { StudySession } from '../types';
import StatChart from './StatChart';
import SessionList from './SessionList';

interface StatsViewProps {
  sessions: StudySession[];
  onDelete: (id: number) => void;
  onUpdate: (session: StudySession) => void;
}

const StatsView: React.FC<StatsViewProps> = ({ sessions, onDelete, onUpdate }) => {
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  return (
    <motion.div 
       key="stats"
       initial={{ opacity: 0, x: 20 }}
       animate={{ opacity: 1, x: 0 }}
       exit={{ opacity: 0, x: -20 }}
       className="flex flex-col gap-6"
    >
      {/* Stats Header */}
       <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">Total Sessions</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{sessions.length}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">Total Time</p>
              <p className="text-3xl font-bold text-amber-500 mt-1">
                  {(totalSeconds / 3600).toFixed(1)}<span className="text-sm text-zinc-500 dark:text-zinc-500 font-medium ml-1">hrs</span>
              </p>
          </div>
       </div>
       
       <StatChart sessions={sessions} />
       
       <div className="mt-2">
          <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Recent History</h3>
          </div>
          <SessionList 
            sessions={sessions} 
            onDelete={onDelete}
            onUpdate={onUpdate} 
          />
       </div>
    </motion.div>
  );
};

export default StatsView;