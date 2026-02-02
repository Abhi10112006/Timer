import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';

interface SnackbarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, actionLabel, onAction, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 pl-5 pr-3 py-3 rounded-full shadow-2xl border border-zinc-800 dark:border-zinc-200"
        >
          <span className="text-sm font-medium whitespace-nowrap">{message}</span>
          
          {actionLabel && onAction && (
            <div className="flex items-center border-l border-zinc-700 dark:border-zinc-300 pl-4 ml-1">
                <button
                onClick={onAction}
                className="flex items-center gap-1.5 text-amber-500 dark:text-amber-600 font-bold text-sm hover:text-amber-400 dark:hover:text-amber-700 transition-colors focus:outline-none"
                >
                <RotateCcw className="w-3.5 h-3.5" />
                {actionLabel}
                </button>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-500 transition-colors ml-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Snackbar;