import { useMediaPlayer } from './state';

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const ControlButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 28,
      height: 22,
      padding: 0,
      fontFamily: 'Tahoma, sans-serif',
      fontSize: 12,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: active
        ? 'linear-gradient(180deg, #ffc43d 0%, #c98400 100%)'
        : 'linear-gradient(180deg, #6692d9 0%, #294a9a 100%)',
      color: active ? '#2a1a00' : '#fff',
      border: '1px solid #0a1e4a',
      borderRadius: 2,
      cursor: 'pointer',
      textShadow: '0 1px 0 rgba(0,0,0,0.25)',
    }}
  >
    {children}
  </button>
);

export default function Controls() {
  const isPlaying = useMediaPlayer((s) => s.isPlaying);
  const shuffle = useMediaPlayer((s) => s.shuffle);
  const repeat = useMediaPlayer((s) => s.repeat);
  const volume = useMediaPlayer((s) => s.volume);
  const currentTime = useMediaPlayer((s) => s.currentTime);
  const duration = useMediaPlayer((s) => s.duration);

  const togglePlay = useMediaPlayer((s) => s.togglePlay);
  const stop = useMediaPlayer((s) => s.stop);
  const next = useMediaPlayer((s) => s.next);
  const prev = useMediaPlayer((s) => s.prev);
  const toggleShuffle = useMediaPlayer((s) => s.toggleShuffle);
  const cycleRepeat = useMediaPlayer((s) => s.cycleRepeat);
  const setVolume = useMediaPlayer((s) => s.setVolume);
  const seek = useMediaPlayer((s) => s.seek);

  return (
    <div
      style={{
        padding: '6px 10px',
        background: 'linear-gradient(180deg, #dbe8ff 0%, #8fa9da 100%)',
        borderTop: '1px solid #0a1e4a',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#0a1e4a',
      }}
    >
      <ControlButton title="Play/Pause" onClick={togglePlay}>
        {isPlaying ? '❙❙' : '▶'}
      </ControlButton>
      <ControlButton title="Stop" onClick={stop}>
        ■
      </ControlButton>
      <ControlButton title="Previous" onClick={prev}>
        ⏮
      </ControlButton>
      <ControlButton title="Next" onClick={next}>
        ⏭
      </ControlButton>
      <ControlButton title="Shuffle" onClick={toggleShuffle} active={shuffle}>
        ⇄
      </ControlButton>
      <ControlButton
        title={`Repeat: ${repeat}`}
        onClick={cycleRepeat}
        active={repeat !== 'off'}
      >
        {repeat === 'one' ? '①' : '↻'}
      </ControlButton>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontFamily: 'Consolas, monospace',
            fontSize: 10,
            minWidth: 30,
            textAlign: 'right',
          }}
        >
          {fmt(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#1c4ca3' }}
          disabled={!duration}
        />
        <span
          style={{
            fontFamily: 'Consolas, monospace',
            fontSize: 10,
            minWidth: 30,
          }}
        >
          {fmt(duration)}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minWidth: 90,
        }}
      >
        <span style={{ fontSize: 12 }}>🔊</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: 60, accentColor: '#1c4ca3' }}
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
      </div>
    </div>
  );
}
