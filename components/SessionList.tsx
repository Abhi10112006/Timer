import React, { useMemo } from 'react';
import { StudySession } from '../types';
import { Clock } from 'lucide-react';
import SessionItem from './SessionItem';

interface SessionListProps {
  sessions: StudySession[];
  onDelete: (id: number) => void;
  onUpdate: (session: StudySession) => void;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onDelete, onUpdate }) => {
  // Group sessions by Date
  const groupedSessions = useMemo(() => {
      const groups: Record<string, StudySession[]> = {};
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      sessions.forEach(session => {
          const date = new Date(session.timestamp).toDateString();
          let key = date;
          if (date === today) key = "Today";
          else if (date === yesterday) key = "Yesterday";
          else key = new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(session);
      });
      
      return Object.entries(groups).sort((a, b) => {
          const maxA = Math.max(...a[1].map(s => s.timestamp));
          const maxB = Math.max(...b[1].map(s => s.timestamp));
          return maxB - maxA;
      });
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-600 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-medium text-zinc-500 dark:text-zinc-400">No activity yet</p>
        <p className="text-sm mt-1 opacity-60">Start a timer to build your history</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedSessions.map(([dateLabel, groupSessions]) => (
        <div key={dateLabel} className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2 sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 py-2 z-10 backdrop-blur-sm">
                {dateLabel}
            </h4>
            {groupSessions.map((session) => (
                <SessionItem 
                    key={session.id || session.timestamp} 
                    session={session} 
                    onDelete={onDelete} 
                    onUpdate={onUpdate} 
                />
            ))}
        </div>
      ))}
      
      {sessions.length > 20 && (
          <div className="text-center pt-4 pb-8">
              <span className="text-xs text-zinc-500">End of history</span>
          </div>
      )}
    </div>
  );
};

export default SessionList;