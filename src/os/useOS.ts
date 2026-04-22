import { create } from 'zustand';

export type WallpaperMode = 'fit' | 'centered' | 'tiled';

export interface Wallpaper {
  src: string;
  mode: WallpaperMode;
}

interface OSStore {
  booted: boolean;
  shutDown: boolean;
  startMenuOpen: boolean;
  wallpaper: Wallpaper | null;

  finishBoot: () => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  triggerShutDown: () => void;
  setWallpaper: (src: string, mode?: WallpaperMode) => void;
  clearWallpaper: () => void;
}

export const useOS = create<OSStore>((set) => ({
  booted: false,
  shutDown: false,
  startMenuOpen: false,
  wallpaper: null,

  finishBoot: () => set({ booted: true }),
  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),
  triggerShutDown: () => set({ shutDown: true, startMenuOpen: false }),
  setWallpaper: (src, mode = 'fit') => set({ wallpaper: { src, mode } }),
  clearWallpaper: () => set({ wallpaper: null }),
}));
