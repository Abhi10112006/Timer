import React, { useState, useRef } from 'react';
import { TimerMode, TimerSettings } from '../types';
import Button from './Button';
import Input from './Input';
import { Save, Upload, Music, Volume2, Trash2, Play, Square, Clock, Activity } from 'lucide-react';

interface SettingsFormProps {
  settings: TimerSettings;
  mode: TimerMode;
  onSave: (newSettings: TimerSettings) => void;
  onCancel: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ settings, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState<TimerSettings>(settings);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 3MB to prevent storage issues
    if (file.size > 3 * 1024 * 1024) {
        alert("File size too large. Please select an audio file under 3MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            setFormData(prev => ({
                ...prev,
                alarmType: 'custom',
                customAlarmData: event.target?.result as string,
                customAlarmName: file.name
            }));
        }
    };
    reader.readAsDataURL(file);
  };

  const clearCustomAudio = () => {
    setFormData(prev => ({
        ...prev,
        alarmType: 'default',
        customAlarmData: undefined,
        customAlarmName: undefined
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopPreview();
  };

  const togglePreview = () => {
      if (isPlayingPreview) {
          stopPreview();
      } else {
          // Determine source
          let src = '';
          if (formData.alarmType === 'custom' && formData.customAlarmData) {
              src = formData.customAlarmData;
          } 
          
          if (src) {
            const audio = new Audio(src);
            audio.onended = () => setIsPlayingPreview(false);
            audio.play().catch(e => console.error("Preview failed", e));
            audioPreviewRef.current = audio;
            setIsPlayingPreview(true);
          } else if (formData.alarmType === 'default') {
              // Simple beep for default preview
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.5, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
              
              setIsPlayingPreview(true);
              setTimeout(() => setIsPlayingPreview(false), 500);
          }
      }
  };

  const stopPreview = () => {
      if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
          audioPreviewRef.current = null;
      }
      setIsPlayingPreview(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopPreview();
    onSave(formData);
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          Timer Settings
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="space-y-4">
            
            {/* Alarm Settings Section - Only visible in POMODORO mode */}
            {mode === TimerMode.POMODORO ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-1">Alarm Sound</label>
                    </div>
                    
                    <div className="space-y-3">
                        {/* Default Option */}
                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.alarmType === 'default' ? 'bg-amber-50 border-amber-500/50 dark:bg-amber-500/10' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    name="alarmType" 
                                    value="default" 
                                    checked={formData.alarmType === 'default'} 
                                    onChange={() => setFormData(prev => ({ ...prev, alarmType: 'default' }))}
                                    className="mr-3 w-4 h-4 accent-amber-500"
                                />
                                <div className="flex items-center gap-2">
                                    <Volume2 className={`w-4 h-4 ${formData.alarmType === 'default' ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500'}`} />
                                    <span className={formData.alarmType === 'default' ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500'}>
                                        Pulse (Default)
                                    </span>
                                </div>
                            </div>
                            {formData.alarmType === 'default' && (
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); togglePreview(); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                >
                                    {isPlayingPreview && formData.alarmType === 'default' ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                                </button>
                            )}
                        </label>

                        {/* Custom Option */}
                        <label className={`flex flex-col gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.alarmType === 'custom' ? 'bg-amber-50 border-amber-500/50 dark:bg-amber-500/10' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    name="alarmType" 
                                    value="custom" 
                                    checked={formData.alarmType === 'custom'} 
                                    onChange={() => setFormData(prev => ({ ...prev, alarmType: 'custom' }))}
                                    className="mr-3 w-4 h-4 accent-amber-500 shrink-0"
                                />
                                <div className="flex items-center gap-2">
                                    <Music className={`w-4 h-4 ${formData.alarmType === 'custom' ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500'}`} />
                                    <span className={formData.alarmType === 'custom' ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500'}>
                                        Custom Sound
                                    </span>
                                </div>
                            </div>

                            {/* Upload Controls - Only show if Custom is selected */}
                            {formData.alarmType === 'custom' && (
                                <div className="pl-7 w-full">
                                    {formData.customAlarmData ? (
                                        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.preventDefault(); togglePreview(); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 shrink-0"
                                                >
                                                    {isPlayingPreview ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                                                </button>
                                                <span className="text-sm truncate max-w-[150px] text-zinc-700 dark:text-zinc-300">{formData.customAlarmName || 'Custom Audio'}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.preventDefault(); clearCustomAudio(); }}
                                                className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input 
                                                ref={fileInputRef}
                                                type="file" 
                                                accept="audio/*" 
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-500 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-500 transition-colors bg-white/50 dark:bg-transparent">
                                                <Upload className="w-4 h-4" />
                                                <span className="text-sm">Upload MP3/M4A (Max 3MB)</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Alarm Duration Slider */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Alarm Duration
                            </label>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                                {formData.alarmDuration || 10}s
                            </span>
                        </div>
                        <input 
                            type="range"
                            name="alarmDuration"
                            min="5"
                            max="60"
                            step="5"
                            value={formData.alarmDuration || 10}
                            onChange={(e) => setFormData(prev => ({ ...prev, alarmDuration: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 mt-1 px-1">
                            <span>5s</span>
                            <span>30s</span>
                            <span>60s</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-1">Stopwatch Settings</label>
                    </div>
                    
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${formData.stopwatchTicking ? 'bg-amber-50 border-amber-500/50 dark:bg-amber-500/10' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${formData.stopwatchTicking ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
                                <Activity className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-medium text-sm ${formData.stopwatchTicking ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
                                    Ticking Sound
                                </span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                    Play a sound every second
                                </span>
                            </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formData.stopwatchTicking} 
                                onChange={(e) => setFormData(prev => ({ ...prev, stopwatchTicking: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                        </div>
                    </label>
                </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
      <p className="text-xs text-center text-zinc-500 mt-6">
        Changes will apply to the next timer session.
      </p>
    </div>
  );
};

export default SettingsForm;