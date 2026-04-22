import { useMediaPlayer } from './state';
import { useFiles } from '../../os/useFiles';

export default function StatusBar() {
  const isPlaying = useMediaPlayer((s) => s.isPlaying);
  const currentTrackId = useMediaPlayer((s) => s.currentTrackId);
  const currentTime = useMediaPlayer((s) => s.currentTime);
  const track = useFiles((s) =>
    s.musicLibrary.find((t) => t.id === currentTrackId) ?? null,
  );

  const status = !track
    ? 'Stopped'
    : isPlaying
      ? 'Playing'
      : currentTime > 0
        ? 'Paused'
        : 'Stopped';

  return (
    <div
      style={{
        height: 20,
        background: '#ece9d8',
        borderTop: '1px solid #404040',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        fontSize: 11,
        color: '#000',
      }}
    >
      <div
        style={{
          flex: '0 0 90px',
          borderRight: '1px solid #a0a0a0',
          padding: '0 4px',
        }}
      >
        {status}
      </div>
      <div style={{ flex: 1, padding: '0 8px', opacity: 0.8 }}>
        128 kbps, MP3, 44.1 kHz
      </div>
    </div>
  );
}
