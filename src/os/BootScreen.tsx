import { useEffect } from 'react';
import { useOS } from './useOS';
import startupSoundUrl from '../assets/sounds/startup.wav';

const BOOT_DURATION_MS = 2000;

export default function BootScreen() {
  const finishBoot = useOS((s) => s.finishBoot);

  useEffect(() => {
    try {
      const audio = new Audio(startupSoundUrl);
      audio.volume = 0.4;
      void audio.play().catch(() => {
        /* autoplay blocked — fine */
      });
    } catch {
      /* noop */
    }
    const t = setTimeout(finishBoot, BOOT_DURATION_MS);
    return () => clearTimeout(t);
  }, [finishBoot]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        zIndex: 20000,
      }}
    >
      <div
        style={{
          fontFamily: '"Times New Roman", Times, serif',
          fontStyle: 'italic',
          fontWeight: 'bold',
          fontSize: 72,
          letterSpacing: 2,
          textShadow: '2px 2px 0 #555',
        }}
      >
        Windows 98
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#cccccc',
        }}
      >
        <span style={{ animation: 'boot-pulse 1s infinite', animationDelay: '0s' }}>▪</span>
        <span style={{ animation: 'boot-pulse 1s infinite', animationDelay: '0.15s' }}>▪</span>
        <span style={{ animation: 'boot-pulse 1s infinite', animationDelay: '0.3s' }}>▪</span>
        <span style={{ animation: 'boot-pulse 1s infinite', animationDelay: '0.45s' }}>▪</span>
        <span style={{ animation: 'boot-pulse 1s infinite', animationDelay: '0.6s' }}>▪</span>
      </div>
      <style>
        {`
          @keyframes boot-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
