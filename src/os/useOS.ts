import { create } from 'zustand';

interface OSStore {
  booted: boolean;
  shutDown: boolean;
  startMenuOpen: boolean;

  finishBoot: () => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  triggerShutDown: () => void;
}

export const useOS = create<OSStore>((set) => ({
  booted: false,
  shutDown: false,
  startMenuOpen: false,

  finishBoot: () => set({ booted: true }),
  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),
  triggerShutDown: () => set({ shutDown: true, startMenuOpen: false }),
}));
