import { useEffect, useRef } from 'react';
import { registerAudioElement } from './mediaHost';
import { useFiles } from './useFiles';
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

  // Load src when track changes.
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (!track) {
      if (a.src) a.removeAttribute('src');
      a.load();
      return;
    }
    // Resolve to absolute URL to match what the browser stores in `a.src`.
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
