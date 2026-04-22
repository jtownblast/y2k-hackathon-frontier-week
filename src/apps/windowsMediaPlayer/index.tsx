import { useEffect, useState } from 'react';
import { useMediaPlayer } from './state';
import { useFiles } from '../../os/useFiles';
import MenuBar from './MenuBar';
import Visualizer from './Visualizer';
import NowPlaying from './NowPlaying';
import Controls from './Controls';
import StatusBar from './StatusBar';
import FileOpenDialog from './FileOpenDialog';

export default function WindowsMediaPlayer() {
  const [openDialogVisible, setOpenDialogVisible] = useState(false);

  const isFullscreenViz = useMediaPlayer((s) => s.isFullscreenViz);
  const glitchText = useMediaPlayer((s) => s.glitchText);
  const toggleFullscreenViz = useMediaPlayer((s) => s.toggleFullscreenViz);
  const loadTrack = useMediaPlayer((s) => s.loadTrack);
  const play = useMediaPlayer((s) => s.play);

  // Respond to cross-app "please play this track" requests (e.g., from LimeWire).
  const pendingTrackId = useFiles((s) => s.pendingTrackId);
  const clearPendingTrack = useFiles((s) => s.clearPendingTrack);
  useEffect(() => {
    if (!pendingTrackId) return;
    loadTrack(pendingTrackId);
    play();
    clearPendingTrack();
  }, [pendingTrackId, loadTrack, play, clearPendingTrack]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a1a',
        color: '#e5e5e5',
        fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
        fontSize: 11,
        userSelect: 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <MenuBar onFileOpen={() => setOpenDialogVisible(true)} />

      {/* Branded inner header */}
      <div
        style={{
          height: 28,
          background:
            'linear-gradient(180deg, #2b64c7 0%, #1c4ca3 45%, #0f3580 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          borderBottom: '1px solid #0a1e4a',
          color: '#e7f0ff',
          textShadow: '1px 1px 0 rgba(0,0,0,0.35)',
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            marginRight: 8,
            background:
              'radial-gradient(circle at 30% 30%, #ffffff 0%, #66b8ff 40%, #0b3080 100%)',
            border: '1px solid #0a1e4a',
            borderRadius: 2,
          }}
        />
        <span style={{ fontSize: 12 }}>Windows Media Player</span>
        {glitchText && (
          <span
            style={{
              marginLeft: 'auto',
              color: '#9cffb0',
              fontWeight: 400,
              fontFamily: 'Consolas, monospace',
              fontSize: 10,
              opacity: 0.85,
              animation: 'wmp-glitch 0.2s infinite alternate',
            }}
          >
            {glitchText}
          </span>
        )}
      </div>

      {/* Main body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          minHeight: 0,
        }}
      >
        {isFullscreenViz ? (
          <div
            style={{ flex: 1, minWidth: 0 }}
            onDoubleClick={toggleFullscreenViz}
          >
            <Visualizer fullscreen />
          </div>
        ) : (
          <>
            <div
              style={{ flex: '0 0 70%', minWidth: 0 }}
              onDoubleClick={toggleFullscreenViz}
            >
              <Visualizer />
            </div>
            <NowPlaying />
          </>
        )}
      </div>

      <Controls />
      <StatusBar />

      {openDialogVisible && (
        <FileOpenDialog onClose={() => setOpenDialogVisible(false)} />
      )}

      <style>{`
        @keyframes wmp-glitch {
          from { transform: translateX(0); }
          to { transform: translateX(1px); }
        }
      `}</style>
    </div>
  );
}
