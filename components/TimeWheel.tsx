import React, { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TimeWheelProps {
  totalSeconds: number;
  onChange: (seconds: number) => void;
}

const ITEM_HEIGHT = 64; 
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 320px
// Reduced loops from 20 to 6 to significantly improve mount performance while maintaining infinite scroll illusion.
// We need enough buffer for the scroll reset logic (buffer top + visible + buffer bottom).
const LOOPS = 6; 

interface WheelColumnProps {
  max: number;
  value: number;
  onChange: (val: number) => void;
  label: string;
  delayIndex: number;
}

const WheelColumn: React.FC<WheelColumnProps> = ({ 
  max, 
  value, 
  onChange, 
  label,
  delayIndex
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastEmittedValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < LOOPS; i++) {
        for (let j = 0; j < max; j++) {
            arr.push({ id: `${i}-${j}`, value: j });
        }
    }
    return arr;
  }, [max]);

  // --- Visual Scaling Logic (The Fisheye Effect) ---
  const updateVisuals = useCallback(() => {
    if (!rootRef.current) return;
    
    const root = rootRef.current;
    const centerLine = root.scrollTop + (WHEEL_HEIGHT / 2);
    const children = root.querySelectorAll('.wheel-item');
    
    // Check if dark mode is active to toggle text color logic
    const isDark = document.documentElement.classList.contains('dark');
    
    children.forEach((child) => {
        const el = child as HTMLElement;
        const childCenter = el.offsetTop + (ITEM_HEIGHT / 2);
        const distance = Math.abs(centerLine - childCenter);
        
        let scale = 1 - (distance / ITEM_HEIGHT) * 0.25;
        scale = Math.max(0.25, scale);
        
        const opacity = Math.max(0.1, scale ** 1.5);
        
        el.style.transform = `scale(${scale})`;
        el.style.opacity = opacity.toString();
        el.style.fontWeight = scale > 0.85 ? '700' : '400';
        
        if (isDark) {
            el.style.color = scale > 0.85 ? '#ffffff' : '#a1a1aa'; 
        } else {
            // Darkened from #71717a to #52525b for better visibility in light mode
            el.style.color = scale > 0.85 ? '#09090b' : '#52525b'; 
        }
    });
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const setInitialPos = () => {
        const centerLoop = Math.floor(LOOPS / 2);
        const targetIndex = (centerLoop * max) + value;
        const targetScroll = targetIndex * ITEM_HEIGHT;
        root.scrollTop = targetScroll;
        updateVisuals(); 
    };

    setInitialPos();
    lastEmittedValueRef.current = value;
  }, []); 

  useEffect(() => {
    if (rootRef.current && !isScrollingRef.current) {
        const centerLoop = Math.floor(LOOPS / 2);
        const targetIndex = (centerLoop * max) + value;
        const targetScroll = targetIndex * ITEM_HEIGHT;
        
        if (Math.abs(rootRef.current.scrollTop - targetScroll) > ITEM_HEIGHT / 2) {
             rootRef.current.scrollTo({ top: targetScroll, behavior: 'auto' });
             requestAnimationFrame(updateVisuals);
        }
    }
  }, [value, max, updateVisuals]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleScroll = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(updateVisuals);

        isScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = window.setTimeout(() => {
            isScrollingRef.current = false;
            const scrollTop = root.scrollTop;
            const totalHeight = root.scrollHeight;
            const oneLoopHeight = max * ITEM_HEIGHT;
            
            // Adjust threshold for smaller loop count
            if (scrollTop < oneLoopHeight || scrollTop > totalHeight - oneLoopHeight * 1.5) {
                const currentVal = lastEmittedValueRef.current;
                const centerLoop = Math.floor(LOOPS / 2);
                const newPos = ((centerLoop * max) + currentVal) * ITEM_HEIGHT;
                root.scrollTop = newPos;
            }
        }, 150);
    };

    root.addEventListener('scroll', handleScroll, { passive: true });
    updateVisuals();

    return () => {
      root.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [max, updateVisuals]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const margin = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;
    const observerOptions = {
      root: root,
      rootMargin: `-${margin}px 0px -${margin}px 0px`, 
      threshold: 0.5
    };
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const newVal = parseInt(el.dataset.val || '0');
            if (newVal !== lastEmittedValueRef.current) {
                lastEmittedValueRef.current = newVal;
                if (navigator.vibrate) {
                    try { navigator.vibrate(5); } catch(e) { /* ignore */ }
                }
                onChange(newVal);
            }
        }
      });
    };
    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const children = root.querySelectorAll('.wheel-item');
    children.forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, [max, onChange]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delayIndex * 0.05, ease: "easeOut" }}
      className={`relative h-[${WHEEL_HEIGHT}px] w-28 md:w-32 flex justify-center group z-20`}
    >
       <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 pointer-events-none z-30 transition-colors group-hover:text-zinc-500 pl-4">
           {label}
       </div>
       <div 
          ref={rootRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar z-20"
          style={{ scrollbarWidth: 'none' }}
       >
          <div className="w-full relative py-[128px]"> 
              {items.map((item) => (
                  <div 
                    key={item.id}
                    data-val={item.value}
                    className="wheel-item flex items-center justify-center snap-center 
                               cursor-pointer select-none origin-center
                               text-5xl tabular-nums tracking-wide"
                    style={{ 
                        height: `${ITEM_HEIGHT}px`,
                        opacity: 0.3,
                        transform: 'scale(0.8)'
                    }}
                  >
                     {item.value.toString().padStart(2, '0')}
                  </div>
              ))}
          </div>
       </div>
    </motion.div>
  );
};

const TimeWheel: React.FC<TimeWheelProps> = ({ totalSeconds, onChange }) => {
   const h = Math.floor(totalSeconds / 3600);
   const m = Math.floor((totalSeconds % 3600) / 60);
   const s = totalSeconds % 60;

   const updateH = (val: number) => onChange((val * 3600) + (m * 60) + s);
   const updateM = (val: number) => onChange((h * 3600) + (val * 60) + s);
   const updateS = (val: number) => onChange((h * 3600) + (m * 60) + val);

   return (
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         transition={{ duration: 0.2 }}
         className="relative flex items-center justify-center gap-1 md:gap-2 w-full max-w-lg h-[320px] mx-auto bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800/50"
       >
          {/* Global Gradient Mask for 3D fade effect */}
          <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-b from-white via-transparent to-white dark:from-zinc-950 dark:via-transparent dark:to-zinc-950" />
          
          {/* Highlight Bar */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[64px] bg-zinc-100/50 dark:bg-zinc-800/30 pointer-events-none z-10 border-y border-zinc-200 dark:border-white/5 backdrop-blur-[1px]" />
          
          <WheelColumn max={100} value={h} onChange={updateH} label="H" delayIndex={0} />
          <WheelColumn max={60} value={m} onChange={updateM} label="M" delayIndex={1} />
          <WheelColumn max={60} value={s} onChange={updateS} label="S" delayIndex={2} />
       </motion.div>
   );
};

export default TimeWheel;