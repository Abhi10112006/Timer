import React from 'react';
import { Play, Pause, Square, RotateCcw, BellOff } from 'lucide-react';
import Button from './Button';
import { motion } from 'framer-motion';

interface TimerControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onStop: () => void;
  onReset: () => void;
  disableStop: boolean;
  isAlarmRinging?: boolean;
  onStopAlarm?: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onToggle,
  onStop,
  onReset,
  disableStop,
  isAlarmRinging,
  onStopAlarm
}) => {
  
  if (isAlarmRinging && onStopAlarm) {
      return (
          <div className="flex items-center justify-center z-10 w-full">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                  <Button 
                    onClick={onStopAlarm} 
                    size="lg" 
                    className="w-48 h-16 text-lg rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/20"
                  >
                    <BellOff className="w-6 h-6 mr-2 fill-current" />
                    Stop Alarm
                  </Button>
              </motion.div>
          </div>
      );
  }

  return (
    <div className="flex items-center gap-4 z-10">
       {!isRunning ? (
         <Button 
           onClick={onToggle} 
           size="lg" 
           className="w-32 h-14 text-lg rounded-2xl"
         >
           <Play className="w-5 h-5 mr-2 fill-current" /> Start
         </Button>
       ) : (
         <Button 
           onClick={onToggle} 
           variant="secondary" 
           size="lg"
           className="w-32 h-14 text-lg rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 ring-1 ring-amber-500/20"
         >
           <Pause className="w-5 h-5 mr-2 fill-current" /> Pause
         </Button>
       )}

       <Button 
         onClick={onStop} 
         variant="secondary" 
         size="icon"
         disabled={disableStop}
         className="h-14 w-14 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
       >
         <Square className="w-5 h-5 fill-current" />
       </Button>

       <Button
          onClick={onReset}
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          title="Reset (No Save)"
       >
         <RotateCcw className="w-5 h-5" />
       </Button>
    </div>
  );
};

export default TimerControls;