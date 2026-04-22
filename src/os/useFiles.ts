import { create } from 'zustand';

export interface Track {
  id: string;
  src: string;
  filename: string;
  title: string;
  artist: string;
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
    id: 'seed_all_star',
    src: '/music/all_star.mp3',
    filename: 'all_star_smashmouth_FULL_album_version.mp3',
    title: 'All Star',
    artist: 'Smash Mouth',
    addedAt: 0,
  },
  {
    id: 'seed_blue',
    src: '/music/blue_da_ba_dee.mp3',
    filename: 'blue_da_ba_dee_eiffel65_RADIO_EDIT.mp3',
    title: 'Blue (Da Ba Dee)',
    artist: 'Eiffel 65',
    addedAt: 0,
  },
  {
    id: 'seed_american_pie',
    src: '/music/american_pie.mp3',
    filename: 'american_pie_madonna.mp3',
    title: 'American Pie',
    artist: 'Madonna',
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
