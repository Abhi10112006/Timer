
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Book, Trash2 } from 'lucide-react';
import { JournalEntry } from '../types';
import Button from './Button';

interface SecretJournalProps {
    entries: JournalEntry[];
    onAdd: (content: string, mood: JournalEntry['mood']) => void;
    onDelete: (id: number) => void;
}

const SecretJournal: React.FC<SecretJournalProps> = ({ entries, onAdd, onDelete }) => {
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

export default SecretJournal;
