import { useEffect, useRef } from 'react';
import { registerAudioElement } from './mediaHost';
import { useFiles } from './useFiles';
import { useWindows } from './useWindows';
import { useMediaPlayer } from '../apps/windowsMediaPlayer/state';

export default function MediaPlayerHost() {
  const ref = useRef<HTMLAudioElement>(null);
  const currentTrackId = useMediaPlayer((s) => s.currentTrackId);
  const track = useFiles((s) =>
    s.musicLibrary.find((t) => t.id === currentTrackId) ?? null,
  );
  const setTrackDuration = useFiles((s) => s.setTrackDuration);
  const onEnded = useMediaPlayer((s) => s.handleTrackEnded);
  const setCurrentTime = useMediaPlayer((s) => s.setCurrentTime);
  const setDuration = useMediaPlayer((s) => s.setDuration);

  useEffect(() => {
    registerAudioElement(ref.current);
    return () => registerAudioElement(null);
  }, []);

  // Stop playback when the last WMP window is closed.
  const windows = useWindows((s) => s.windows);
  const wmpOpen = Object.values(windows).some(
    (w) => w.appId === 'windows-media-player',
  );
  useEffect(() => {
    if (!wmpOpen) {
      useMediaPlayer.getState().stop();
    }
  }, [wmpOpen]);

  // Auto-load the first library track when WMP opens with nothing loaded.
  useEffect(() => {
    if (!wmpOpen) return;
    const { currentTrackId: cid, loadTrack } = useMediaPlayer.getState();
    if (cid) return; // already has a track
    const lib = useFiles.getState().musicLibrary;
    if (lib.length > 0) loadTrack(lib[0].id);
  }, [wmpOpen]);

  // Load src when track changes.
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (!track) {
      if (a.src) a.removeAttribute('src');
      a.load();
      return;
    }
    const targetSrc = new URL(track.src, window.location.origin).href;
    if (a.src !== targetSrc) {
      a.src = track.src;
    }
  }, [track?.src]);

  const handleLoadedMetadata = () => {
    const a = ref.current;
    if (!a || !track) return;
    setDuration(a.duration);
    if (!track.duration && Number.isFinite(a.duration)) {
      setTrackDuration(track.id, a.duration);
    }
  };

  const handleTimeUpdate = () => {
    const a = ref.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
  };

  return (
    <audio
      ref={ref}
      preload="auto"
      style={{ display: 'none' }}
      onEnded={onEnded}
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
    />
  );
}
