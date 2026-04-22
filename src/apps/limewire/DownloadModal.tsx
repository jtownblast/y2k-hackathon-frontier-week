import { useEffect } from 'react';
import { useLimewire } from './state';
import type { Download } from './state';

interface Props {
  download: Download;
  onClose: () => void;
}

export default function DownloadModal({ download, onClose }: Props) {
  const updateProgress = useLimewire((s) => s.updateProgress);

  useEffect(() => {
    if (download.status !== 'downloading') return;
    let current = download.progress;
    const totalMs = 2000 + Math.random() * 2000;
    const interval = 120;
    const steps = totalMs / interval;
    const increment = 100 / steps;

    const t = setInterval(() => {
      current = Math.min(100, current + increment + Math.random() * increment * 0.5);
      updateProgress(download.id, Math.min(99, current));
      if (current >= 99) clearInterval(t);
    }, interval);

    return () => clearInterval(t);
  }, [download.id, download.status, updateProgress, download.progress]);

  const pct = Math.floor(download.progress);
  const filename = download.result.filename;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        fontFamily: 'Tahoma, sans-serif',
      }}
    >
      <div className="window" style={{ width: 340, color: '#000' }}>
        <div className="title-bar">
          <div className="title-bar-text">Downloading...</div>
          <div className="title-bar-controls">
            <button
              aria-label="Close"
              onClick={() => {
                onClose();
              }}
            />
          </div>
        </div>
        <div className="window-body" style={{ padding: 12 }}>
          <div
            style={{
              fontSize: 11,
              marginBottom: 8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={filename}
          >
            <strong>{filename}</strong>
          </div>

          {/* Win98-style progress bar */}
          <div
            style={{
              height: 14,
              border: '1px inset #808080',
              background: '#c0c0c0',
              marginBottom: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background:
                  'repeating-linear-gradient(90deg, #0a246a 0px, #0a246a 8px, #3a5fbc 8px, #3a5fbc 16px)',
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          <div style={{ fontSize: 11, marginBottom: 10 }}>
            {pct}% complete &nbsp;•&nbsp; {download.result.size} &nbsp;•&nbsp;{' '}
            {download.result.speed}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              onClick={onClose}
              style={{ minWidth: 70 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
