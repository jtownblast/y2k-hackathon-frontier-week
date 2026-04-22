import { create } from 'zustand';

export interface Track {
  id: string;
  src: string;
  filename: string;
  title: string;
  artist: string;
  coverArt?: string;
  duration?: number;
  addedAt: number;
}

interface FilesStore {
  musicLibrary: Track[];
  pendingTrackId: string | null;

  addTrack: (track: Omit<Track, 'id' | 'addedAt'> & { id?: string }) => Track;
  removeTrack: (id: string) => void;
  requestPlay: (id: string) => void;
  clearPendingTrack: () => void;
  setTrackDuration: (id: string, duration: number) => void;
}

let trackCounter = 0;
const makeTrackId = () =>
  `trk_${Date.now().toString(36)}_${(trackCounter++).toString(36)}`;

const SEED_TRACKS: Track[] = [
  {
    id: 'seed_brightside',
    src: '/music/mr_brightside.mp3',
    filename: 'the_killers_mr_brightside_OFFICIAL.mp3',
    title: 'Mr. Brightside',
    artist: 'The Killers',
    coverArt: '/covers/mr_brightside.svg',
    addedAt: 0,
  },
  {
    id: 'seed_toxic',
    src: '/music/toxic.mp3',
    filename: 'britney_spears_toxic_HD_OFFICIAL.mp3',
    title: 'Toxic',
    artist: 'Britney Spears',
    coverArt: '/covers/toxic.svg',
    addedAt: 0,
  },
  {
    id: 'seed_creep',
    src: '/music/creep.mp3',
    filename: 'radiohead_creep_ORIGINAL.mp3',
    title: 'Creep',
    artist: 'Radiohead',
    coverArt: '/covers/creep.svg',
    addedAt: 0,
  },
];

export const useFiles = create<FilesStore>((set) => ({
  musicLibrary: SEED_TRACKS,
  pendingTrackId: null,

  addTrack: (track) => {
    const full: Track = {
      id: track.id ?? makeTrackId(),
      src: track.src,
      filename: track.filename,
      title: track.title,
      artist: track.artist,
      coverArt: track.coverArt,
      duration: track.duration,
      addedAt: Date.now(),
    };
    set((s) => {
      if (s.musicLibrary.some((t) => t.id === full.id)) return s;
      return { musicLibrary: [...s.musicLibrary, full] };
    });
    return full;
  },

  removeTrack: (id) =>
    set((s) => ({ musicLibrary: s.musicLibrary.filter((t) => t.id !== id) })),

  requestPlay: (id) => set({ pendingTrackId: id }),
  clearPendingTrack: () => set({ pendingTrackId: null }),

  setTrackDuration: (id, duration) =>
    set((s) => ({
      musicLibrary: s.musicLibrary.map((t) =>
        t.id === id ? { ...t, duration } : t,
      ),
    })),
}));
