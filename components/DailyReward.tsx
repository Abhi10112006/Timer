
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Image as ImageIcon, Share2, Download, User } from 'lucide-react';
import { dbService } from '../services/db';
import { DailyReward } from '../types';
import Button from './Button';
import Input from './Input';

interface DailyRewardCardProps {
    day: number;
    startDate: number;
}

const SHORT_QUOTES = [
    "One more day.",
    "Stay hard.",
    "Defy comfort.",
    "Forged in fire.",
    "Hold the line.",
    "No surrender.",
    "Conquer yourself.",
    "Build the streak.",
    "Pain is power.",
    "Discipline equals freedom.",
    "Focus on today.",
    "Don't give in.",
    "Keep grinding.",
    "Embrace the suck.",
    "Victory awaits.",
    "Stay dangerous.",
    "Mind over matter.",
    "Strength in silence.",
    "Earn your sleep.",
    "Defeat the urge."
];

// --- Procedural Generation Logic ---

const mulberry32 = (a: number) => {
    return () => {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
};

const randRange = (rand: () => number, min: number, max: number) => min + rand() * (max - min);

const generateArt = (day: number, name: string, timeText: string, quote: string): string => {
    const size = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const rand = mulberry32(day * 837492);
    
    // --- SPECIAL STYLES ---

    // 1. LEGACY STYLE (Day 101+)
    if (day > 100) {
        // Dark Stone/Marble Texture
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, size, size);
        
        // Noise Texture
        const id = ctx.getImageData(0,0,size,size);
        for(let i=0; i<id.data.length; i+=4) {
            const n = randRange(rand, -20, 20);
            id.data[i] = 24 + n;
            id.data[i+1] = 24 + n;
            id.data[i+2] = 27 + n;
            id.data[i+3] = 255;
        }
        ctx.putImageData(id, 0, 0);

        // Chiseled Border
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 40;
        ctx.strokeRect(40, 40, size-80, size-80);
        
        // Text
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e4e4e7';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        
        ctx.font = 'bold 120px "Times New Roman", serif';
        ctx.fillText("IRON WILL", size/2, size/2 - 120);
        
        ctx.font = '60px "Helvetica Neue", sans-serif';
        ctx.fillStyle = '#a1a1aa';
        ctx.fillText(name.toUpperCase(), size/2, size/2);
        
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 80px "Helvetica Neue", sans-serif';
        ctx.fillText(`${day} DAYS`, size/2, size/2 + 120);
        
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillStyle = '#71717a';
        ctx.fillText(timeText, size/2, size/2 + 200);

        return canvas.toDataURL('image/jpeg', 0.9);
    }

    // 2. ASCENSION STYLE (Day 100)
    if (day === 100) {
        const g = ctx.createLinearGradient(0, 0, size, size);
        g.addColorStop(0, '#fcd34d'); // Amber 300
        g.addColorStop(1, '#b45309'); // Amber 700
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);

        // Rays
        ctx.translate(size/2, size/2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for(let i=0; i<20; i++) {
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.arc(0, 0, size, 0, 0.2);
            ctx.fill();
            ctx.rotate(Math.PI/10);
        }
        ctx.translate(-size/2, -size/2);

        // Wreath (Simple Circles)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(size/2, size/2, 350, 0, Math.PI*2);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;

        ctx.font = 'bold 200px sans-serif';
        ctx.fillText("100", size/2, size/2 + 70);

        ctx.font = 'bold 60px sans-serif';
        ctx.fillText(name.toUpperCase(), size/2, size/2 - 150);
        
        ctx.font = '40px sans-serif';
        ctx.letterSpacing = '10px';
        ctx.fillText("LEGENDARY STATUS", size/2, size/2 + 200);
        
        ctx.font = '24px sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText(timeText, size/2, size/2 + 260);

        return canvas.toDataURL('image/jpeg', 0.9);
    }

    // --- PROCEDURAL STYLES (Day 1-99) ---
    
    // Choose an archetype based on the day (mod 10) to ensure variety
    const archetype = day % 10; 
    
    // Base Hue
    const hue = Math.floor(rand() * 360);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,size,size);

    // Common Text Config
    let textColor = '#fff';
    let fontPrimary = 'sans-serif';
    let textShadow = 'rgba(0,0,0,0.5)';

    ctx.save();
    
    switch(archetype) {
        case 0: // Geometric Zen
            {
                const g = ctx.createLinearGradient(0,0,size,size);
                g.addColorStop(0, `hsl(${hue}, 40%, 10%)`);
                g.addColorStop(1, `hsl(${hue+40}, 40%, 20%)`);
                ctx.fillStyle = g;
                ctx.fillRect(0,0,size,size);
                
                ctx.translate(size/2, size/2);
                for(let i=0; i<20; i++) {
                    ctx.rotate(rand()*Math.PI);
                    ctx.strokeStyle = `hsla(${hue}, 80%, 70%, 0.1)`;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-randRange(rand,100,400), -randRange(rand,100,400), randRange(rand,200,800), randRange(rand,200,800));
                }
                fontPrimary = 'monospace';
            }
            break;
        case 1: // Cyber Grid
            {
                ctx.fillStyle = '#050505';
                ctx.fillRect(0,0,size,size);
                ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.lineWidth = 2;
                // Grid
                const step = 80;
                ctx.globalAlpha = 0.3;
                for(let x=0; x<=size; x+=step) {
                    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,size); ctx.stroke();
                }
                for(let y=0; y<=size; y+=step) {
                    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(size,y); ctx.stroke();
                }
                ctx.globalAlpha = 1;
                fontPrimary = 'Courier New';
                textColor = `hsl(${hue}, 100%, 70%)`;
                textShadow = `hsl(${hue}, 100%, 50%)`;
            }
            break;
        case 2: // Ink Blot / Smoke
            {
                ctx.fillStyle = '#e5e5e5';
                ctx.fillRect(0,0,size,size);
                textColor = '#111';
                textShadow = 'transparent';
                
                ctx.translate(size/2, size/2);
                for(let i=0; i<50; i++) {
                    ctx.fillStyle = `rgba(0,0,0,${rand()*0.1})`;
                    ctx.beginPath();
                    ctx.arc(randRange(rand, -400, 400), randRange(rand, -400, 400), randRange(rand, 50, 200), 0, Math.PI*2);
                    ctx.fill();
                }
                fontPrimary = 'serif';
            }
            break;
        case 3: // Neon Void
            {
                ctx.fillStyle = '#09090b';
                ctx.fillRect(0,0,size,size);
                ctx.translate(size/2, size/2);
                
                ctx.shadowBlur = 40;
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
                ctx.lineWidth = 10;
                
                ctx.beginPath();
                if (rand() > 0.5) ctx.arc(0,0, 300, 0, Math.PI*2);
                else ctx.strokeRect(-250, -250, 500, 500);
                ctx.stroke();
                
                ctx.shadowBlur = 0;
            }
            break;
        case 4: // Nature / Organic
            {
                const g = ctx.createLinearGradient(0,0,0,size);
                g.addColorStop(0, `hsl(150, 30%, 20%)`);
                g.addColorStop(1, `hsl(150, 30%, 5%)`);
                ctx.fillStyle = g;
                ctx.fillRect(0,0,size,size);
                
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                for(let i=0; i<100; i++) {
                    ctx.beginPath();
                    ctx.moveTo(rand()*size, size);
                    ctx.bezierCurveTo(rand()*size, size-300, rand()*size, size-600, rand()*size, rand()*size);
                    ctx.stroke();
                }
                textColor = '#ecfccb';
                fontPrimary = 'Georgia';
            }
            break;
        case 5: // Retro Sun
            {
                const g = ctx.createLinearGradient(0,0,0,size);
                g.addColorStop(0, '#3b0764'); // Purple
                g.addColorStop(1, '#be185d'); // Pink
                ctx.fillStyle = g;
                ctx.fillRect(0,0,size,size);
                
                // Sun
                const sunG = ctx.createLinearGradient(0, 200, 0, 800);
                sunG.addColorStop(0, '#fcd34d');
                sunG.addColorStop(1, '#f59e0b');
                ctx.fillStyle = sunG;
                ctx.beginPath();
                ctx.arc(size/2, size/2, 250, 0, Math.PI*2);
                ctx.fill();
                
                // Horizon lines
                ctx.fillStyle = '#3b0764';
                for(let y=size/2 + 50; y<size/2 + 250; y+=20) {
                   ctx.fillRect(size/2 - 250, y, 500, (y - size/2)/20);
                }
            }
            break;
        case 6: // Particles
            {
                ctx.fillStyle = '#111';
                ctx.fillRect(0,0,size,size);
                for(let i=0; i<300; i++) {
                    ctx.fillStyle = `hsla(${hue + randRange(rand, -30, 30)}, 80%, 60%, ${rand()})`;
                    ctx.beginPath();
                    ctx.arc(rand()*size, rand()*size, rand()*4, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            break;
        case 7: // Abstract Radial
            {
                ctx.fillStyle = `hsl(${hue}, 20%, 10%)`;
                ctx.fillRect(0,0,size,size);
                ctx.translate(size/2, size/2);
                for(let i=0; i<30; i++) {
                    ctx.fillStyle = `hsla(${(hue + i*10)%360}, 60%, 50%, 0.2)`;
                    ctx.beginPath();
                    ctx.arc(0,0, i*20, 0, Math.PI*2);
                    ctx.fill();
                    ctx.rotate(0.2);
                    ctx.translate(10, 0);
                }
            }
            break;
        case 8: // Minimalist
            {
                ctx.fillStyle = '#fff';
                ctx.fillRect(0,0,size,size);
                ctx.fillStyle = '#000';
                ctx.beginPath();
                const s = 400;
                ctx.rect((size-s)/2, (size-s)/2, s, s);
                ctx.fill();
                textColor = '#fff'; // Invert text color inside the box
            }
            break;
        case 9: // Grunge
            {
                ctx.fillStyle = '#78350f';
                ctx.fillRect(0,0,size,size);
                
                // Scratches
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                for(let i=0; i<100; i++) {
                    ctx.lineWidth = rand()*3;
                    ctx.beginPath();
                    const x = rand()*size;
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + randRange(rand, -50, 50), size);
                    ctx.stroke();
                }
                textColor = '#fef3c7';
                fontPrimary = 'Impact, sans-serif';
            }
            break;
    }

    ctx.restore();

    // --- OVERLAY TEXT ---
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow
    ctx.fillStyle = textColor;
    ctx.shadowColor = textShadow;
    ctx.shadowBlur = 20;
    
    // Vertical centering logic
    const centerY = size/2;

    if (archetype === 8) { // Minimalist
        // Center text in the black box
        ctx.fillText(name.toUpperCase(), size/2, centerY - 80);
        ctx.font = `60px ${fontPrimary}`;
        ctx.fillText(`DAY ${day}`, size/2, centerY);
        ctx.font = `24px ${fontPrimary}`;
        ctx.fillText(timeText, size/2, centerY + 60);
        ctx.font = `italic 20px ${fontPrimary}`;
        ctx.fillText(`"${quote}"`, size/2, centerY + 120);
    } else {
        // Name
        ctx.font = `bold 60px ${fontPrimary}`;
        ctx.fillText(name.toUpperCase(), size/2, centerY - 140);
        
        // Day Number
        ctx.font = `300 120px ${fontPrimary}`;
        ctx.fillText(`${day}`, size/2, centerY - 20);
        
        // Label
        ctx.font = `20px ${fontPrimary}`;
        ctx.letterSpacing = '10px';
        ctx.fillText("DAYS CLEAN", size/2, centerY + 50);

        // Exact Time
        ctx.font = `bold 30px ${fontPrimary}`;
        ctx.letterSpacing = '2px';
        ctx.fillText(timeText, size/2, centerY + 110);
        
        // Quote
        ctx.font = `italic 24px ${fontPrimary}`;
        ctx.letterSpacing = '1px';
        ctx.globalAlpha = 0.9;
        ctx.fillText(`"${quote}"`, size/2, centerY + 180);
    }

    // Watermark
    ctx.globalAlpha = 0.7;
    ctx.font = '20px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText("FOCUSFLOW", size/2, size - 50);

    return canvas.toDataURL('image/jpeg', 0.9);
};

// --- Component ---

const DailyRewardCard: React.FC<DailyRewardCardProps> = ({ day, startDate }) => {
    const [reward, setReward] = useState<DailyReward | null>(null);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [checkingName, setCheckingName] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                // Check for existing reward first
                const savedReward = await dbService.getDailyReward(day);
                if (savedReward) setReward(savedReward);

                // Check for username
                const settings = await dbService.getStreakSettings();
                if (settings.username) {
                    setUsername(settings.username);
                }
            } catch (e) {
                console.error("Init failed", e);
            } finally {
                setCheckingName(false);
            }
        };
        init();
    }, [day]);

    const handleSaveName = async () => {
        if (!nameInput.trim()) return;
        try {
            const settings = await dbService.getStreakSettings();
            const newSettings = { ...settings, username: nameInput.trim() };
            await dbService.saveStreakSettings(newSettings);
            setUsername(nameInput.trim());
        } catch (e) {
            console.error("Failed to save name", e);
        }
    };

    const handleGenerate = async () => {
        if (!username) return;
        setLoading(true);
        
        // Calculate exact time string
        const diff = Date.now() - startDate;
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        const timeText = `${d}d ${h}h ${m}m ${s}s`;

        // Pick Quote
        const quote = SHORT_QUOTES[day % SHORT_QUOTES.length];
        
        // Simulate async work for UI feedback
        setTimeout(async () => {
            try {
                const base64Image = generateArt(day, username, timeText, quote);
                const newReward: DailyReward = {
                    day: day,
                    imageUrl: base64Image,
                    generatedAt: Date.now()
                };

                await dbService.saveDailyReward(newReward);
                setReward(newReward);
            } catch (e) {
                console.error("Generation failed", e);
            } finally {
                setLoading(false);
            }
        }, 800);
    };

    const handleShare = async () => {
        if (!reward) return;
        
        try {
            const res = await fetch(reward.imageUrl);
            const blob = await res.blob();
            const file = new File([blob], `focusflow-day-${day}.jpg`, { type: 'image/jpeg' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Iron Will - Day ${day}`,
                    text: `I have forged my will for ${day} days.`,
                    files: [file]
                });
            } else {
                handleDownload();
            }
        } catch (e) {
            console.error("Share failed, falling back to download", e);
            handleDownload();
        }
    };

    const handleDownload = () => {
        if (!reward) return;
        const a = document.createElement('a');
        a.href = reward.imageUrl;
        a.download = `focusflow-day-${day}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (checkingName) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mt-6 shadow-2xl shadow-black/50"
        >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-2 text-amber-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Daily Vision • Day {day}</span>
                </div>
                {reward && (
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownload}
                            className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="aspect-square w-full relative bg-zinc-950 flex items-center justify-center group">
                {reward ? (
                    <>
                        <motion.img 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={reward.imageUrl} 
                            alt={`Day ${day} Reward`}
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay with Share Button */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <Button 
                                onClick={handleShare}
                                className="bg-white text-black hover:bg-zinc-200 font-bold gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share Vision
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-6 p-8 text-center w-full max-w-xs">
                        {/* USERNAME INPUT STEP */}
                        {!username ? (
                             <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col gap-4 w-full"
                             >
                                <div className="flex justify-center">
                                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                                        <User className="w-6 h-6" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">Identify Yourself</h3>
                                    <p className="text-zinc-500 text-xs">Enter your name to imprint it upon your daily art.</p>
                                </div>
                                <Input 
                                    placeholder="Your Name / Alias"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="text-center"
                                />
                                <Button onClick={handleSaveName} disabled={!nameInput.trim()}>
                                    Confirm Identity
                                </Button>
                             </motion.div>
                        ) : (
                            // GENERATE STEP
                            <>
                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    {loading ? (
                                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                                    )}
                                </div>
                                
                                {!loading ? (
                                    <>
                                        <p className="text-zinc-500 text-sm">
                                            Reveal the unique art for <br/>
                                            <span className="text-white font-bold">{username}</span>'s Day {day}.
                                        </p>
                                        <Button 
                                            onClick={handleGenerate}
                                            className="bg-amber-600 hover:bg-amber-500 text-white border-transparent"
                                        >
                                            Reveal Vision
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-zinc-500 text-xs animate-pulse">Forging vision...</p>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DailyRewardCard;
