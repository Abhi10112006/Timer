import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, CheckCircle2, Hourglass, Pencil, Check, X, Trash2 } from 'lucide-react';
import { StudySession, TimerMode, SessionStatus } from '../types';
import { SUBJECT_COLORS } from '../constants';
import Button from './Button';

interface SessionItemProps {
  session: StudySession;
  onDelete: (id: number) => void;
  onUpdate: (session: StudySession) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  // ReadOnly hack state for inline input
  const [isInputReadOnly, setIsInputReadOnly] = useState(true);
  
  // Random ID for inline edit to prevent autofill history
  const [randomInputId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);

  const formatDuration = (seconds: number) => {
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatTimeOfDay = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditSubject(session.subject);
    // Reset readOnly state when starting edit
    setIsInputReadOnly(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditSubject('');
  };

  const saveEditing = () => {
    onUpdate({ ...session, subject: editSubject.trim() || 'Untitled' });
    setIsEditing(false);
  };

  const getStatusIcon = (colorText: string) => {
      const className = `w-4 h-4 ${colorText}`;
      if (session.mode === TimerMode.STOPWATCH) return <Timer className={className} />;
      if (session.status === SessionStatus.COMPLETED) return <CheckCircle2 className={className} />;
      return <Hourglass className={className} />;
  };

  const getSubjectColor = (subject: string) => {
    let hash = 0;
    const str = subject || 'Unspecified';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
  };

  const colors = getSubjectColor(session.subject);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all hover:bg-white dark:hover:bg-zinc-900 shadow-sm hover:shadow-md ${colors.bg} ${colors.border} cursor-default`}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        <div className={`p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shrink-0`}>
            {getStatusIcon(colors.text)}
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
              <div className="flex items-center gap-2 mb-1">
                  <input 
                    autoFocus
                    readOnly={isInputReadOnly}
                    onFocus={() => setIsInputReadOnly(false)}
                    onTouchStart={() => setIsInputReadOnly(false)}
                    name={randomInputId}
                    id={randomInputId}
                    type="search"
                    autoComplete={`off-${randomInputId}`}
                    list="autocompleteOff"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    data-form-type="other"
                    data-lpignore="true"
                    value={editSubject}
                    onClick={(e) => e.stopPropagation()} 
                    onChange={(e) => setEditSubject(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') saveEditing();
                        if(e.key === 'Escape') cancelEditing();
                    }}
                    className="bg-white dark:bg-zinc-800 border border-indigo-500 rounded px-2 py-0.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none w-full max-w-[200px] select-text shadow-sm appearance-none"
                  />
                  <button onClick={saveEditing} className="text-emerald-600 hover:text-emerald-500 shrink-0">
                      <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelEditing} className="text-rose-600 hover:text-rose-500 shrink-0">
                      <X className="w-4 h-4" />
                  </button>
              </div>
          ) : (
              <div className="flex items-center gap-2 group/title mb-1">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight truncate">
                      {session.subject || 'Focus Session'}
                  </h4>
                  <button 
                    onClick={startEditing}
                    className="opacity-0 group-hover/title:opacity-100 text-zinc-400 hover:text-indigo-600 transition-opacity shrink-0"
                  >
                      <Pencil className="w-3 h-3" />
                  </button>
              </div>
          )}
          
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <span className="shrink-0">{formatTimeOfDay(session.timestamp)}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
            <span className={`${colors.text} shrink-0`}>
                 {formatDuration(session.durationSeconds)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center z-10 relative gap-2 pl-2">
           {session.status === SessionStatus.PARTIAL && session.mode === TimerMode.POMODORO && (
               <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-amber-600/70">
                   Interrupted
               </span>
           )}
           
           <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
                e.stopPropagation();
                if (session.id !== undefined) {
                    onDelete(session.id);
                } else {
                    console.warn("Attempted to delete session without ID:", session);
                }
            }}
            className="text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4 pointer-events-none" />
          </Button>
      </div>
    </motion.div>
  );
};

export default SessionItem;