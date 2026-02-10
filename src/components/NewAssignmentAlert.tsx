import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewAssignmentAlertProps {
  show: boolean;
  emergencyType?: string;
  onDismiss: () => void;
}

// Generate alert beep using Web Audio API
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playBeep = (startTime: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    };
    // Three ascending beeps
    playBeep(ctx.currentTime, 880);
    playBeep(ctx.currentTime + 0.35, 1100);
    playBeep(ctx.currentTime + 0.7, 1320);

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  } catch (e) {
    console.warn('Could not play alert sound:', e);
  }
}

export default function NewAssignmentAlert({ show, emergencyType, onDismiss }: NewAssignmentAlertProps) {
  const hasPlayed = useRef(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (show && !hasPlayed.current && !muted) {
      playAlertSound();
      hasPlayed.current = true;
    }
    if (!show) {
      hasPlayed.current = false;
    }
  }, [show, muted]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] animate-slide-down">
      <div className="mx-auto max-w-4xl px-4 pt-20">
        <div className="bg-destructive text-destructive-foreground rounded-lg shadow-2xl p-4 flex items-center gap-4 border-2 border-destructive/50 animate-pulse">
          <div className="p-2 bg-destructive-foreground/20 rounded-full">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">🚨 New Emergency Assignment!</p>
            {emergencyType && (
              <p className="text-sm opacity-90">Type: {emergencyType}</p>
            )}
            <p className="text-xs opacity-75 mt-1">Scroll down to view details and respond</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive-foreground hover:bg-destructive-foreground/20"
              onClick={() => {
                setMuted(!muted);
                if (muted) playAlertSound();
              }}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
