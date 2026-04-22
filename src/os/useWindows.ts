import { create } from 'zustand';
import type { AppId, WindowState } from './types';
import { APPS } from '../apps/registry';

interface WindowsStore {
  windows: Record<string, WindowState>;
  zOrder: string[];
  focusedId: string | null;

  openWindow: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, x: number, y: number, width: number, height: number) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  taskbarClick: (id: string) => void;
}

let counter = 0;
const makeId = () => `win_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export const TASKBAR_HEIGHT = 30;

export const useWindows = create<WindowsStore>((set, get) => ({
  windows: {},
  zOrder: [],
  focusedId: null,

  openWindow: (appId) => {
    const app = APPS[appId];
    const id = makeId();
    const n = get().zOrder.length;
    const state: WindowState = {
      id,
      appId,
      title: app.title,
      icon: app.icon,
      x: 60 + (n % 8) * 28,
      y: 40 + (n % 8) * 28,
      width: app.defaultSize.width,
      height: app.defaultSize.height,
      isMinimized: false,
      isMaximized: false,
    };
    set((s) => ({
      windows: { ...s.windows, [id]: state },
      zOrder: [...s.zOrder, id],
      focusedId: id,
    }));
  },

  closeWindow: (id) => {
    set((s) => {
      const { [id]: _removed, ...rest } = s.windows;
      const nextOrder = s.zOrder.filter((x) => x !== id);
      const nextFocus =
        s.focusedId === id ? (nextOrder[nextOrder.length - 1] ?? null) : s.focusedId;
      return { windows: rest, zOrder: nextOrder, focusedId: nextFocus };
    });
  },

  focusWindow: (id) => {
    set((s) => {
      if (!s.windows[id]) return s;
      if (s.focusedId === id && s.zOrder[s.zOrder.length - 1] === id) return s;
      const nextOrder = [...s.zOrder.filter((x) => x !== id), id];
      const win = s.windows[id];
      const nextWindows =
        win.isMinimized
          ? { ...s.windows, [id]: { ...win, isMinimized: false } }
          : s.windows;
      return { zOrder: nextOrder, focusedId: id, windows: nextWindows };
    });
  },

  moveWindow: (id, x, y) => {
    set((s) => {
      const win = s.windows[id];
      if (!win) return s;
      return { windows: { ...s.windows, [id]: { ...win, x, y } } };
    });
  },

  resizeWindow: (id, x, y, width, height) => {
    set((s) => {
      const win = s.windows[id];
      if (!win) return s;
      return { windows: { ...s.windows, [id]: { ...win, x, y, width, height } } };
    });
  },

  minimizeWindow: (id) => {
    set((s) => {
      const win = s.windows[id];
      if (!win) return s;
      const nextOrder = s.zOrder.filter((x) => x !== id);
      const nextFocus =
        s.focusedId === id ? (nextOrder[nextOrder.length - 1] ?? null) : s.focusedId;
      return {
        windows: { ...s.windows, [id]: { ...win, isMinimized: true } },
        zOrder: [id, ...nextOrder],
        focusedId: nextFocus,
      };
    });
  },

  toggleMaximize: (id) => {
    set((s) => {
      const win = s.windows[id];
      if (!win) return s;
      if (win.isMaximized && win.preMaxBounds) {
        const { x, y, width, height } = win.preMaxBounds;
        return {
          windows: {
            ...s.windows,
            [id]: { ...win, isMaximized: false, preMaxBounds: undefined, x, y, width, height },
          },
        };
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight - TASKBAR_HEIGHT;
      return {
        windows: {
          ...s.windows,
          [id]: {
            ...win,
            isMaximized: true,
            preMaxBounds: { x: win.x, y: win.y, width: win.width, height: win.height },
            x: 0,
            y: 0,
            width: vw,
            height: vh,
          },
        },
      };
    });
  },

  taskbarClick: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    if (win.isMinimized) {
      state.focusWindow(id);
      return;
    }
    if (state.focusedId === id) {
      state.minimizeWindow(id);
      return;
    }
    state.focusWindow(id);
  },
}));
