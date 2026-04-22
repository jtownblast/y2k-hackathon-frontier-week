import { create } from 'zustand';
import type { SearchResult } from './data';

export type TabId = 'search' | 'monitor' | 'library' | 'tools';

export interface Download {
  id: string;
  result: SearchResult;
  progress: number; // 0..100
  status: 'downloading' | 'complete' | 'cancelled';
  trackId?: string; // id of the Track added to musicLibrary on complete
}

interface LimewireStore {
  activeTab: TabId;
  searchQuery: string;
  searchType: string;
  results: SearchResult[];
  downloads: Download[];
  activeDownloadId: string | null; // the one showing in the modal

  setActiveTab: (tab: TabId) => void;
  setSearchQuery: (q: string) => void;
  setSearchType: (t: string) => void;
  setResults: (r: SearchResult[]) => void;

  startDownload: (result: SearchResult) => string; // returns download id
  updateProgress: (id: string, progress: number) => void;
  completeDownload: (id: string, trackId?: string) => void;
  cancelDownload: (id: string) => void;
  setActiveDownload: (id: string | null) => void;
}

export const useLimewire = create<LimewireStore>((set) => ({
  activeTab: 'search',
  searchQuery: '',
  searchType: 'All Types',
  results: [],
  downloads: [],
  activeDownloadId: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchType: (t) => set({ searchType: t }),
  setResults: (r) => set({ results: r }),

  startDownload: (result) => {
    const id = `dl_${Date.now().toString(36)}`;
    const dl: Download = { id, result, progress: 0, status: 'downloading' };
    set((s) => ({
      downloads: [...s.downloads, dl],
      activeDownloadId: id,
    }));
    return id;
  },

  updateProgress: (id, progress) =>
    set((s) => ({
      downloads: s.downloads.map((d) =>
        d.id === id ? { ...d, progress } : d,
      ),
    })),

  completeDownload: (id, trackId) =>
    set((s) => ({
      downloads: s.downloads.map((d) =>
        d.id === id ? { ...d, status: 'complete', progress: 100, trackId } : d,
      ),
      activeDownloadId: s.activeDownloadId === id ? null : s.activeDownloadId,
    })),

  cancelDownload: (id) =>
    set((s) => ({
      downloads: s.downloads.map((d) =>
        d.id === id ? { ...d, status: 'cancelled' } : d,
      ),
      activeDownloadId: s.activeDownloadId === id ? null : s.activeDownloadId,
    })),

  setActiveDownload: (id) => set({ activeDownloadId: id }),
}));
