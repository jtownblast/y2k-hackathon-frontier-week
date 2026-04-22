import { create } from 'zustand';
import {
  ensureAudioGraph,
  getAudioElement,
  resumeAudioContext,
} from '../../os/mediaHost';
import { useFiles } from '../../os/useFiles';

export type Visualization = 'bars' | 'battery' | 'ocean-mist' | 'plenoptic';
export type RepeatMode = 'off' | 'all' | 'one';

interface MediaPlayerStore {
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number;        // 0..1
  currentTime: number;   // seconds
  duration: number;      // seconds
  shuffle: boolean;
  repeat: RepeatMode;
  visualization: Visualization;
  isFullscreenViz: boolean;
  glitchText: string | null;

  loadTrack: (id: string) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVisualization: (v: Visualization) => void;
  toggleFullscreenViz: () => void;
  handleTrackEnded: () => void;

  // Host-driven (MediaPlayerHost writes these).
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;

  clearGlitchText: () => void;
}

const GLITCH_TEXT = 'NOW PLAYING: all_star_FINAL_v2.mp3';

function maybeGlitch(): string | null {
  return Math.random() < 0.05 ? GLITCH_TEXT : null;
}

function pickNextId(current: string | null, shuffle: boolean, repeat: RepeatMode): string | null {
  const lib = useFiles.getState().musicLibrary;
  if (lib.length === 0) return null;
  if (repeat === 'one' && current) return current;
  if (shuffle) {
    if (lib.length === 1) return lib[0].id;
    const others = lib.filter((t) => t.id !== current);
    return others[Math.floor(Math.random() * others.length)].id;
  }
  const idx = lib.findIndex((t) => t.id === current);
  if (idx === -1) return lib[0].id;
  if (idx === lib.length - 1) {
    return repeat === 'all' ? lib[0].id : null;
  }
  return lib[idx + 1].id;
}

function pickPrevId(current: string | null): string | null {
  const lib = useFiles.getState().musicLibrary;
  if (lib.length === 0) return null;
  const idx = lib.findIndex((t) => t.id === current);
  if (idx <= 0) return lib[lib.length - 1].id;
  return lib[idx - 1].id;
}

export const useMediaPlayer = create<MediaPlayerStore>((set, get) => ({
  currentTrackId: null,
  isPlaying: false,
  volume: 0.6,
  currentTime: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off',
  visualization: 'bars',
  isFullscreenViz: false,
  glitchText: null,

  loadTrack: (id) => {
    const prev = get().currentTrackId;
    set({
      currentTrackId: id,
      currentTime: 0,
      duration: 0,
      glitchText: id !== prev ? maybeGlitch() : get().glitchText,
    });
  },

  play: () => {
    const { currentTrackId } = get();
    const lib = useFiles.getState().musicLibrary;
    let id = currentTrackId;
    if (!id && lib.length > 0) {
      id = lib[0].id;
      set({ currentTrackId: id, glitchText: maybeGlitch() });
    }
    if (!id) return;
    const audio = getAudioElement();
    if (!audio) return;
    ensureAudioGraph();
    void resumeAudioContext().then(() => {
      audio.play().catch(() => {
        set({ isPlaying: false });
      });
    });
    set({ isPlaying: true });
  },

  pause: () => {
    getAudioElement()?.pause();
    set({ isPlaying: false });
  },

  togglePlay: () => {
    get().isPlaying ? get().pause() : get().play();
  },

  stop: () => {
    const audio = getAudioElement();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    set({ isPlaying: false, currentTime: 0 });
  },

  seek: (time) => {
    const audio = getAudioElement();
    if (audio) audio.currentTime = Math.max(0, Math.min(time, audio.duration || time));
    set({ currentTime: time });
  },

  setVolume: (v) => {
    const clamped = Math.max(0, Math.min(1, v));
    const audio = getAudioElement();
    if (audio) audio.volume = clamped;
    set({ volume: clamped });
  },

  next: () => {
    const id = pickNextId(get().currentTrackId, get().shuffle, get().repeat);
    if (!id) {
      get().stop();
      return;
    }
    get().loadTrack(id);
    get().play();
  },

  prev: () => {
    const audio = getAudioElement();
    // Standard media-player behavior: if > 3s in, restart the song instead.
    if (audio && audio.currentTime > 3) {
      get().seek(0);
      return;
    }
    const id = pickPrevId(get().currentTrackId);
    if (!id) return;
    get().loadTrack(id);
    get().play();
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
    })),

  setVisualization: (v) => set({ visualization: v }),

  toggleFullscreenViz: () =>
    set((s) => ({ isFullscreenViz: !s.isFullscreenViz })),

  handleTrackEnded: () => {
    const { repeat } = get();
    if (repeat === 'one') {
      const audio = getAudioElement();
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }
    const nextId = pickNextId(get().currentTrackId, get().shuffle, repeat);
    if (!nextId) {
      set({ isPlaying: false, currentTime: 0 });
      return;
    }
    get().loadTrack(nextId);
    get().play();
  },

  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),

  clearGlitchText: () => set({ glitchText: null }),
}));

// Auto-clear glitch text after 4s whenever it changes.
if (typeof window !== 'undefined') {
  let glitchTimer: ReturnType<typeof setTimeout> | null = null;
  useMediaPlayer.subscribe((s, prev) => {
    if (s.glitchText && s.glitchText !== prev.glitchText) {
      if (glitchTimer) clearTimeout(glitchTimer);
      glitchTimer = setTimeout(() => {
        useMediaPlayer.getState().clearGlitchText();
        glitchTimer = null;
      }, 4000);
    }
  });
}
