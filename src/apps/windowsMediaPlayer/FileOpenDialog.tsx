import { useState } from 'react';
import { useFiles } from '../../os/useFiles';
import { useMediaPlayer } from './state';

interface Props {
  onClose: () => void;
}

export default function FileOpenDialog({ onClose }: Props) {
  const library = useFiles((s) => s.musicLibrary);
  const loadTrack = useMediaPlayer((s) => s.loadTrack);
  const play = useMediaPlayer((s) => s.play);
  const [selected, setSelected] = useState<string | null>(library[0]?.id ?? null);

  const open = () => {
    if (!selected) return;
    loadTrack(selected);
    play();
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="window"
        style={{
          width: 380,
          maxWidth: 'calc(100% - 20px)',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: 11,
          color: '#000',
        }}
      >
        <div className="title-bar">
          <div className="title-bar-text">Open</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body" style={{ padding: 10 }}>
          <div
            style={{
              fontSize: 11,
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Look in:</span>
            <div
              style={{
                flex: 1,
                border: '1px inset #808080',
                padding: '1px 6px',
                background: '#fff',
              }}
            >
              🎵 My Music
            </div>
          </div>
          <div
            style={{
              background: '#fff',
              border: '1px inset #808080',
              height: 180,
              overflowY: 'auto',
            }}
          >
            {library.length === 0 && (
              <div style={{ padding: 10, color: '#808080' }}>
                (empty — try downloading something from LimeWire)
              </div>
            )}
            {library.map((t) => (
              <div
                key={t.id}
                onMouseDown={() => setSelected(t.id)}
                onDoubleClick={() => {
                  setSelected(t.id);
                  loadTrack(t.id);
                  play();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 6px',
                  background: selected === t.id ? '#0a246a' : 'transparent',
                  color: selected === t.id ? '#fff' : '#000',
                  cursor: 'default',
                }}
              >
                <span style={{ fontSize: 13 }}>🎵</span>
                <span
                  style={{
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={t.filename}
                >
                  {t.filename}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 6,
              marginTop: 10,
            }}
          >
            <button onClick={open} disabled={!selected} style={{ minWidth: 70 }}>
              Open
            </button>
            <button onClick={onClose} style={{ minWidth: 70 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
