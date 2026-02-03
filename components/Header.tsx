
import React from 'react';
import { Fingerprint, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';

interface HeaderProps {
  view: 'timer' | 'stats';
  setView: (view: 'timer' | 'stats') => void;
  showIndicator: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onSecretClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, setView, showIndicator, theme, toggleTheme, onSecretClick }) => {
  return (
    <header className="w-full max-w-2xl px-6 py-8 flex items-center justify-between z-10">
      <div 
        className="flex items-center gap-3 cursor-pointer group select-none"
        onClick={onSecretClick}
        title="Access Secret Mode"
      >
         <motion.div 
           className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors duration-300"
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
         >
           <Fingerprint className="w-6 h-6" strokeWidth={1.5} />
         </motion.div>
         <div className="flex flex-col">
             <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none group-hover:text-amber-500 transition-colors">
               FocusFlow
             </h1>
             <span className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase h-3 transition-opacity duration-300">
                 <span className="opacity-0 group-hover:opacity-100">Tap to Access</span>
             </span>
         </div>
      </div>
      <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm">
             <Button 
               variant={view === 'timer' ? 'secondary' : 'ghost'} 
               size="sm"
               onClick={() => setView('timer')}
               className={`rounded-lg ${view === 'timer' ? 'shadow-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
             >
               Timer
             </Button>
             <Button 
               variant={view === 'stats' ? 'secondary' : 'ghost'} 
               size="sm"
               onClick={() => setView('stats')}
               className={`rounded-lg relative ${view === 'stats' ? 'shadow-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
             >
               History
               {showIndicator && view !== 'stats' && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
               )}
             </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </motion.div>
          </Button>
      </div>
    </header>
  );
};

export default Header;
