
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MOTIVATIONAL_QUOTES } from '../constants';

interface SecretSOSProps {
    onRelapse: () => void;
    confirmReset: boolean;
    setConfirmReset: (val: boolean) => void;
    isActive: boolean;
}

const SecretSOS: React.FC<SecretSOSProps> = ({ onRelapse, confirmReset, setConfirmReset, isActive }) => {
    const [phase, setPhase] = useState('Inhale');
    const [quoteIndex, setQuoteIndex] = useState(0);
    
    // Pick a random quote on mount
    useEffect(() => {
        setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
    }, []);

    // Breathing Animation Loop
    useEffect(() => {
        const sequence = [
            { text: 'Inhale', time: 4000 },
            { text: 'Hold', time: 4000 },
            { text: 'Exhale', time: 4000 }
        ];
        let step = 0;

        const run = () => {
            setPhase(sequence[step].text);
            const duration = sequence[step].time;
            step = (step + 1) % sequence.length;
            // Change quote on Exhale occasionally? No, stick to one to focus.
            return duration;
        };

        let timer: number;
        const loop = () => {
             const duration = run();
             timer = window.setTimeout(loop, duration);
        };
        loop();

        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full px-6 relative overflow-hidden pb-16"
        >
            <div className="absolute inset-0 bg-rose-900/10 z-0 pointer-events-none" />

            <div className="z-10 flex flex-col items-center gap-12 w-full max-w-sm">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Urge Surfing</h2>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                        This feeling is temporary. Breathe through it.
                    </p>
                </div>

                {/* Breathing Circle */}
                <div className="relative flex items-center justify-center w-64 h-64">
                    <motion.div 
                        animate={{ 
                            scale: phase === 'Inhale' ? 1.5 : (phase === 'Hold' ? 1.5 : 1),
                            opacity: phase === 'Hold' ? 0.8 : 0.5
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl"
                    />
                    <motion.div 
                        animate={{ 
                            scale: phase === 'Inhale' ? 1.2 : (phase === 'Hold' ? 1.2 : 1),
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] z-10"
                    >
                         <span className="text-lg font-bold text-white uppercase tracking-widest">{phase}</span>
                    </motion.div>
                </div>

                {/* Quote Display */}
                <motion.div
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="min-h-[60px] flex items-center justify-center"
                >
                    <p className="text-center text-zinc-300 text-sm italic font-medium leading-relaxed px-4">
                        "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                    </p>
                </motion.div>

                {/* Relapse Button - Only show if active */}
                {isActive && (
                    <div className="mt-4 w-full">
                        <button
                            onClick={onRelapse}
                            onMouseLeave={() => setConfirmReset(false)}
                            className={`w-full py-4 rounded-xl border font-bold text-sm tracking-widest transition-all duration-300
                                ${confirmReset 
                                    ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                                    : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-red-900/50 hover:text-red-500 hover:bg-red-950/10'
                                }
                            `}
                        >
                            {confirmReset ? "I HAVE RELAPSED" : "REGISTER RELAPSE"}
                        </button>
                        {confirmReset && <p className="text-center text-xs text-red-400 mt-2">Click again to confirm reset.</p>}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SecretSOS;
