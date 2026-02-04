
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerMode } from '../types';
import { formatTime } from '../utils/time';
import TimeWheel from './TimeWheel';

interface TimerDisplayProps {
  mode: TimerMode;
  timeLeft: number;
  stopwatchTime: number;
  maxTime: number;
  isRunning: boolean;
  isEditing: boolean;
  editValues: { h: string; m: string; s: string };
  onTimeClick: () => void;
  onEditChange: (field: 'h' | 'm' | 's', value: string) => void;
  onEditSubmit: () => void;
  onDurationChange: (seconds: number) => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  mode,
  timeLeft,
  stopwatchTime,
  maxTime,
  isRunning,
  isEditing,
  editValues,
  onTimeClick,
  onEditChange,
  onEditSubmit,
  onDurationChange
}) => {
  // Move state up so it can be used in rendering logic
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<HTMLDivElement>(null);

  const displayValue = mode === TimerMode.POMODORO ? timeLeft : stopwatchTime;
  const showMs = mode === TimerMode.STOPWATCH;
  
  // Check if stopwatch is over 1 hour (3600000 ms) to adjust font size
  const isLongFormat = showMs && stopwatchTime >= 3600000;

  const circumference = 289.02; // 2 * pi * 46
  
  // Pomodoro: Full -> Empty logic
  const dialMax = 60 * 60; 
  
  let dialProgress = 0;
  if (mode === TimerMode.POMODORO) {
      if (isRunning) {
          dialProgress = maxTime > 0 ? timeLeft / maxTime : 0;
      } else if (isDragging) {
          dialProgress = Math.min(timeLeft / dialMax, 1);
      } else {
          dialProgress = 1;
      }
  }

  const strokeOffset = (1 - dialProgress) * circumference;

  // Stopwatch Rotation
  const totalSeconds = Math.floor(stopwatchTime / 1000);
  const secondHandRotation = (totalSeconds % 60) * 6;
  const radarRotation = (stopwatchTime % 2000) / 2000 * 360;

  // --- Drag Logic ---

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow drag editing in Pomodoro mode when NOT running and NOT in wheel editing mode
    if (mode !== TimerMode.POMODORO || isRunning || isEditing) return;
    
    // Note: The Center Overlay stops propagation, so this function only runs
    // when clicking the outer ring area (the gap + ring).
    
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    updateTimeFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if ((e.target as Element).releasePointerCapture) {
        (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const updateTimeFromPointer = (e: React.PointerEvent) => {
      if (!timerRef.current) return;
      
      const rect = timerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = e.clientX - centerX;
      const y = e.clientY - centerY;
      
      // Calculate angle relative to center (0 at top)
      // atan2(y, x) -> 0 is right, 90 is bottom, -90 is top
      let angleRad = Math.atan2(y, x);
      let angleDeg = angleRad * (180 / Math.PI);
      
      // Convert to Clockwise from Top (0-360)
      let clockDeg = angleDeg + 90;
      if (clockDeg < 0) clockDeg += 360;
      
      // Map 0-360 degrees to 0-60 minutes
      let minutes = (clockDeg / 360) * 60;
      
      // Snap to nearest minute
      let snappedMinutes = Math.round(minutes);
      
      // Handle the 60/0 edge case
      if (snappedMinutes === 60) snappedMinutes = 0;
      
      onDurationChange(snappedMinutes * 60);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (isDragging && mode === TimerMode.POMODORO && !isRunning && !isEditing) {
          updateTimeFromPointer(e);
      }
  };

  return (
    <div 
        ref={timerRef}
        className={`relative mb-8 w-full max-w-[20rem] aspect-square md:max-w-none md:w-96 md:h-96 flex items-center justify-center touch-none ${mode === TimerMode.POMODORO && !isRunning && !isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
    >
       
       <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          
          {/* POMODORO MODE */}
          {mode === TimerMode.POMODORO && (
            <>
              {/* Ticks Background - Only visible when dragging */}
              <motion.g 
                className="text-zinc-300 dark:text-zinc-800"
                animate={{ opacity: isDragging ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                  {Array.from({ length: 60 }).map((_, i) => {
                    const isMajor = i % 5 === 0;
                    return (
                      <line
                        key={i}
                        x1="50" y1="2"
                        x2="50" y2={isMajor ? "6" : "3"}
                        transform={`rotate(${i * 6} 50 50)`}
                        stroke="currentColor"
                        strokeWidth={isMajor ? "1.5" : "1"}
                        strokeLinecap="round"
                        className={isMajor ? "opacity-100" : "opacity-40"}
                      />
                    );
                  })}
              </motion.g>

              {/* Progress Arc */}
              <motion.circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4"
                className={`${isDragging ? 'text-amber-400' : 'text-amber-500'}`}
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={isDragging ? { duration: 0 } : { duration: 0.5, ease: "easeInOut" }}
                strokeLinecap="round"
              />
            </>
          )}

          {/* STOPWATCH MODE */}
          {mode === TimerMode.STOPWATCH && (
            <g transform="rotate(90 50 50)">
               {/* Tick Marks Ring - Always visible for stopwatch precision */}
               <g className="text-zinc-300 dark:text-zinc-800">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const isMajor = i % 5 === 0;
                    return (
                      <line
                        key={i}
                        x1="50" y1="2"
                        x2="50" y2={isMajor ? "6" : "3"}
                        transform={`rotate(${i * 6} 50 50)`}
                        stroke="currentColor"
                        strokeWidth={isMajor ? "1.5" : "1"}
                        strokeLinecap="round"
                      />
                    );
                  })}
               </g>

               {/* Inner decorative fast ring */}
               <motion.g
                  initial={{ rotate: 0 }}
                  animate={{ rotate: radarRotation }}
                  transition={{ duration: 0, ease: "linear" }}
                  style={{ originX: "50px", originY: "50px" }}
               >
                   <circle 
                      cx="50" cy="50" r="38" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1"
                      className="text-amber-500/10"
                      strokeDasharray="40 100" 
                   />
               </motion.g>

               {/* Second Hand */}
               <motion.g
                  initial={{ rotate: 0 }}
                  animate={{ rotate: secondHandRotation }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ originX: "50px", originY: "50px" }}
               >
                   <circle 
                      cx="50" cy="4" r="2.5" 
                      fill="#f59e0b"
                      className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                   />
               </motion.g>
            </g>
          )}
       </svg>
       
       {/* Center Click Area Overlay - Handles opening the TimeWheel */}
       {mode === TimerMode.POMODORO && !isRunning && !isEditing && (
           <div 
               className="absolute z-20 rounded-full cursor-pointer flex items-center justify-center touch-manipulation"
               style={{ width: '65%', height: '65%' }}
               onClick={(e) => {
                   e.stopPropagation();
                   onTimeClick();
               }}
               onPointerDown={(e) => {
                   // Critical: Prevents the parent's onPointerDown (drag logic) from firing
                   e.stopPropagation(); 
               }}
               title="Click to Edit Time"
           />
       )}

       <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          {/* We use pointer-events-auto on children that need interaction (inputs) */}
          
          <AnimatePresence mode="wait">
            {isEditing ? (
                <motion.div 
                   key="wheel"
                   className="pointer-events-auto"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   transition={{ duration: 0.2 }}
                >
                   <TimeWheel 
                      totalSeconds={timeLeft} 
                      onChange={onDurationChange} 
                   />
                </motion.div>
            ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileHover={mode === TimerMode.POMODORO && !isRunning ? { scale: 1.1 } : {}}
                  whileTap={mode === TimerMode.POMODORO && !isRunning ? { scale: 0.95 } : {}}
                  className={`flex flex-col items-center`}
                >
                  {/* Time Display */}
                  <span className={`font-mono font-bold tracking-tighter tabular-nums ${isRunning ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-500'} ${isLongFormat ? 'text-4xl sm:text-5xl md:text-6xl' : (showMs ? 'text-5xl sm:text-6xl md:text-7xl' : 'text-6xl sm:text-7xl md:text-8xl')}`}>
                      {formatTime(displayValue, showMs)}
                  </span>
                   {mode === TimerMode.POMODORO && !isRunning && (
                       <span className="text-xs text-amber-500 mt-2 font-medium opacity-60 transition-opacity">
                           {isDragging ? 'Release to Set' : 'Drag Dial or Click to Edit'}
                       </span>
                   )}
                </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {!isEditing && (
                <motion.span 
                    key="status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-zinc-500 mt-2 font-medium tracking-widest uppercase"
                >
                    {isRunning ? 'Running' : 'Paused'}
                </motion.span>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
};

export default TimerDisplay;
