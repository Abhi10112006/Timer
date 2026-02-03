
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, ShieldAlert, ArrowLeft, AlertTriangle } from 'lucide-react';
import { dbService } from '../services/db';
import { StreakSettings } from '../types';
import { DEFAULT_STREAK_SETTINGS } from '../constants';
import Button from './Button';
import Input from './Input';

interface SecurityGateProps {
  onUnlock: () => void;
  onExit: () => void;
}

// Utility to encode/decode ArrayBuffer for storage
const bufferToBase64 = (buffer: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToBuffer = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

const SecurityGate: React.FC<SecurityGateProps> = ({ onUnlock, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StreakSettings>(DEFAULT_STREAK_SETTINGS);
  const [mode, setMode] = useState<'setup' | 'auth'>('auth');
  
  // Auth State
  const [failCount, setFailCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showBackup, setShowBackup] = useState(false);
  const [backupAnswer, setBackupAnswer] = useState('');
  const [backupError, setBackupError] = useState(false);

  // Setup State
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [setupStep, setSetupStep] = useState<'bio' | 'backup'>('bio');

  useEffect(() => {
    const init = async () => {
        try {
            const s = await dbService.getStreakSettings();
            setSettings(s);
            // If setup is incomplete (no backup question), force setup
            if (!s.securityQuestion || !s.securityAnswer) {
                setMode('setup');
                setSetupStep('bio');
            } else {
                setMode('auth');
                // Auto-trigger biometric if credential exists
                if (s.credentialId) {
                    setTimeout(() => handleFingerprintClick(s), 500);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    init();
  }, []);

  // --- WebAuthn Logic ---

  const registerBiometric = async () => {
      setIsScanning(true);
      setScanStatus('scanning');
      setErrorMessage('');

      if (!window.PublicKeyCredential) {
          setErrorMessage("Biometrics not supported on this device/browser.");
          setScanStatus('error');
          setIsScanning(false);
          // If bio fails/not supported, skip to backup setup
          setTimeout(() => setSetupStep('backup'), 1500);
          return;
      }

      try {
          // 1. Create Challenge
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);

          // 2. User Info
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);

          const publicKey: PublicKeyCredentialCreationOptions = {
              challenge,
              rp: {
                  name: "FocusFlow Secret",
                  id: window.location.hostname // Must match current domain (localhost or https)
              },
              user: {
                  id: userId,
                  name: "user@focusflow",
                  displayName: "FocusFlow User"
              },
              pubKeyCredParams: [
                  { alg: -7, type: "public-key" }, // ES256
                  { alg: -257, type: "public-key" } // RS256
              ],
              authenticatorSelection: {
                  authenticatorAttachment: "platform", // Forces TouchID/FaceID/Windows Hello
                  userVerification: "required"
              },
              timeout: 60000,
              attestation: "none"
          };

          const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
          
          // Save the Credential ID
          const rawId = bufferToBase64(credential.rawId);
          
          const newSettings = {
              ...settings,
              credentialId: rawId
          };
          await dbService.saveStreakSettings(newSettings);
          setSettings(newSettings);

          setScanStatus('success');
          setTimeout(() => {
              setSetupStep('backup'); // Proceed to setup backup question
              setIsScanning(false);
              setScanStatus('idle');
          }, 1000);

      } catch (e: any) {
          console.error("Registration failed", e);
          setScanStatus('error');
          setIsScanning(false);
          setErrorMessage("Sensor skipped or failed. Setting up backup only.");
          setTimeout(() => {
              setSetupStep('backup');
              setErrorMessage('');
              setScanStatus('idle');
          }, 2000);
      }
  };

  const handleFingerprintClick = async (currentSettings = settings) => {
      if (isScanning || scanStatus === 'success') return;
      
      setIsScanning(true);
      setScanStatus('scanning');
      setErrorMessage('');

      if (!window.PublicKeyCredential || !currentSettings.credentialId) {
          // If no credential or API support, just error out to backup
          setScanStatus('error');
          setIsScanning(false);
          handleAuthFailure();
          return;
      }

      try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);

          const publicKey: PublicKeyCredentialRequestOptions = {
              challenge,
              rpId: window.location.hostname,
              allowCredentials: [{
                  id: base64ToBuffer(currentSettings.credentialId),
                  type: 'public-key'
              }],
              userVerification: "required"
          };

          await navigator.credentials.get({ publicKey });
          
          // If get() returns successfully, authentication passed
          setScanStatus('success');
          setTimeout(() => {
              onUnlock();
          }, 500);

      } catch (e: any) {
          console.error("Auth failed", e);
          setScanStatus('error');
          setIsScanning(false);
          
          if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
              // User cancelled or failed bio
              handleAuthFailure();
          } else {
             setErrorMessage("Authentication failed.");
             handleAuthFailure();
          }
      }
  };

  const handleAuthFailure = () => {
      setFailCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
              setTimeout(() => setShowBackup(true), 500);
          }
          return newCount;
      });
      setTimeout(() => setScanStatus('idle'), 1500);
  };

  const handleBackupSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (backupAnswer.toLowerCase().trim() === settings.securityAnswer?.toLowerCase().trim()) {
          onUnlock();
      } else {
          setBackupError(true);
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => setBackupError(false), 1000);
      }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newQuestion.trim() || !newAnswer.trim()) return;

      const newSettings = {
          ...settings,
          securityQuestion: newQuestion.trim(),
          securityAnswer: newAnswer.trim()
      };

      await dbService.saveStreakSettings(newSettings);
      setSettings(newSettings);
      
      // Setup Complete -> Go to Auth
      setMode('auth');
      // Automatically try to auth to verify setup worked (or show success)
      onUnlock();
  };

  if (loading) return <div className="fixed inset-0 bg-zinc-950" />;

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-rose-500/30">
        
        {/* Setup Mode */}
        {mode === 'setup' && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative"
            >
                <button onClick={onExit} className="absolute top-6 right-6 text-zinc-600 hover:text-zinc-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {setupStep === 'bio' && (
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-amber-500">
                            <Fingerprint className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Enable Biometrics</h2>
                            <p className="text-zinc-400 text-sm">
                                Register your fingerprint or face ID to quickly access the secret mode.
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {errorMessage}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 w-full">
                            <Button 
                                onClick={registerBiometric} 
                                disabled={isScanning}
                                className="w-full bg-amber-500 text-black hover:bg-amber-400"
                            >
                                {isScanning ? 'Waiting for Sensor...' : 'Register Fingerprint'}
                            </Button>
                            <button 
                                onClick={() => setSetupStep('backup')}
                                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                            >
                                Skip Biometrics
                            </button>
                        </div>
                    </div>
                )}

                {setupStep === 'backup' && (
                    <>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-3 text-emerald-500">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-center">Backup Security</h2>
                            <p className="text-zinc-400 text-center text-xs mt-1">
                                In case biometrics fail.
                            </p>
                        </div>

                        <form onSubmit={handleSetupSubmit} className="space-y-6">
                            <Input 
                                label="Security Question"
                                placeholder="e.g., What was my first pet's name?"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                            <Input 
                                label="Security Answer"
                                type="password"
                                placeholder="Your secret answer"
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={!newQuestion || !newAnswer} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-transparent">
                                    Complete Setup
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        )}

        {/* Auth Mode */}
        {mode === 'auth' && (
            <div className="w-full max-w-sm flex flex-col items-center">
                 <div className="absolute top-6 left-6">
                    <button onClick={onExit} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm">
                        <ArrowLeft className="w-4 h-4" /> Exit
                    </button>
                 </div>

                 <AnimatePresence mode="wait">
                    {!showBackup ? (
                        <motion.div 
                            key="fingerprint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center gap-8 w-full"
                        >
                            <div className="text-center space-y-2">
                                <Lock className="w-6 h-6 mx-auto text-zinc-500 mb-2" />
                                <h2 className="text-xl font-bold tracking-widest uppercase">Locked</h2>
                                <p className="text-zinc-500 text-sm">
                                    {isScanning ? "Touch sensor to verify" : "Biometric required"}
                                </p>
                            </div>

                            {/* Fingerprint Scanner UI */}
                            <div className="relative">
                                <button 
                                    onClick={() => handleFingerprintClick()}
                                    className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                        scanStatus === 'error' ? 'border-rose-500/50 bg-rose-500/10' :
                                        scanStatus === 'scanning' ? 'border-cyan-500/50 bg-cyan-500/10' :
                                        'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                                    }`}
                                >
                                    <Fingerprint className={`w-12 h-12 transition-colors duration-300 ${
                                         scanStatus === 'error' ? 'text-rose-500' :
                                         scanStatus === 'scanning' ? 'text-cyan-500' :
                                         'text-zinc-500'
                                    }`} />
                                    
                                    {/* Scanning Beam */}
                                    {scanStatus === 'scanning' && (
                                        <motion.div 
                                            className="absolute inset-0 z-10 overflow-hidden rounded-full"
                                            initial={false}
                                        >
                                            <motion.div 
                                                className="w-full h-1 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                                initial={{ y: 0 }}
                                                animate={{ y: 96 }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            />
                                        </motion.div>
                                    )}
                                </button>
                                
                                <div className="absolute -bottom-16 left-0 right-0 text-center h-10 flex flex-col items-center justify-center">
                                    {scanStatus === 'scanning' && <span className="text-cyan-500 text-xs font-mono animate-pulse">Waiting for sensor...</span>}
                                    {scanStatus === 'error' && <span className="text-rose-500 text-xs font-bold font-mono">NOT RECOGNIZED</span>}
                                    {scanStatus === 'success' && <span className="text-emerald-500 text-xs font-bold font-mono">ACCESS GRANTED</span>}
                                </div>
                            </div>
                            
                            {/* Manual Backup Trigger (visible after fail or manual click) */}
                            {failCount > 0 && (
                                <button 
                                    onClick={() => setShowBackup(true)}
                                    className="mt-8 text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-wider underline decoration-zinc-800 underline-offset-4"
                                >
                                    Use Backup Password
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="backup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl backdrop-blur-md"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-white mb-2">Authentication Failed</h3>
                                <p className="text-zinc-400 text-sm">Please answer your security question.</p>
                            </div>

                            <form onSubmit={handleBackupSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Question</label>
                                    <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-300 text-sm italic">
                                        "{settings.securityQuestion}"
                                    </div>
                                </div>

                                <div className="space-y-2">
                                     <Input 
                                        label="Answer"
                                        autoFocus
                                        value={backupAnswer}
                                        onChange={(e) => {
                                            setBackupAnswer(e.target.value);
                                            setBackupError(false);
                                        }}
                                        className={`bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 transition-colors ${backupError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                                        placeholder="Enter your answer"
                                    />
                                    {backupError && (
                                        <p className="text-rose-500 text-xs pl-1">Incorrect answer. Try again.</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200">
                                    Verify
                                </Button>
                            </form>
                            
                            <div className="mt-4 text-center">
                                <button 
                                    onClick={() => {
                                        setShowBackup(false);
                                        setScanStatus('idle');
                                    }} 
                                    className="text-xs text-zinc-500 hover:text-zinc-300"
                                >
                                    Try Biometrics Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>
        )}
    </div>
  );
};

export default SecurityGate;
