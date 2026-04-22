import { create } from 'zustand';
import type { AppId, WindowBounds, WindowState } from './types';
import { APPS } from '../apps/registry';
import type {
  WindowClientMessage,
  WindowMaximizeMessage,
  WindowOpenMessage,
  WindowSyncState,
} from '../net/messages';
import { sendPartyWindowMessage } from '../net/useParty';

type WindowActionMeta = {
  remote?: boolean;
};

type OpenWindowOptions = Partial<WindowBounds> & {
  id?: string;
  z?: number;
  isMinimized?: boolean;
  isMaximized?: boolean;
  preMaxBounds?: WindowBounds;
};

type ToggleMaximizeOptions = {
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  preMaxBounds?: WindowBounds;
};

interface WindowsStore {
  windows: Record<string, WindowState>;
  zOrder: string[];
  focusedId: string | null;

  openWindow: (appId: AppId, options?: OpenWindowOptions, meta?: WindowActionMeta) => void;
  closeWindow: (id: string, meta?: WindowActionMeta) => void;
  focusWindow: (id: string, meta?: WindowActionMeta) => void;
  moveWindow: (id: string, x: number, y: number, meta?: WindowActionMeta) => void;
  resizeWindow: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    meta?: WindowActionMeta,
  ) => void;
  minimizeWindow: (id: string, meta?: WindowActionMeta) => void;
  toggleMaximize: (id: string, options?: ToggleMaximizeOptions, meta?: WindowActionMeta) => void;
  taskbarClick: (id: string) => void;
  applyWindowSnapshot: (windows: WindowSyncState[]) => void;
}

let counter = 0;
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `win_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export const TASKBAR_HEIGHT = 30;

function isRegisteredAppId(appId: string): appId is AppId {
  return appId in APPS;
}

function getTopVisibleId(windows: Record<string, WindowState>, zOrder: string[]): string | null {
  for (let index = zOrder.length - 1; index >= 0; index -= 1) {
    const id = zOrder[index];
    const window = windows[id];

    if (window && !window.isMinimized) {
      return id;
    }
  }

  return null;
}

function insertWindowId(zOrder: string[], id: string, z?: number): string[] {
  const nextOrder = zOrder.filter((entry) => entry !== id);

  if (z === undefined) {
    nextOrder.push(id);
    return nextOrder;
  }

  const index = Math.min(Math.max(0, z), nextOrder.length);
  nextOrder.splice(index, 0, id);
  return nextOrder;
}

function toWindowOpenMessage(window: WindowState, z: number): WindowOpenMessage {
  return {
    type: 'window-open',
    windowId: window.id,
    appId: window.appId,
    x: window.x,
    y: window.y,
    width: window.width,
    height: window.height,
    z,
    isMinimized: window.isMinimized,
    isMaximized: window.isMaximized,
    preMaxBounds: window.preMaxBounds,
  };
}

function toWindowMaximizeMessage(window: WindowState): WindowMaximizeMessage {
  return {
    type: 'window-maximize',
    windowId: window.id,
    isMaximized: window.isMaximized,
    x: window.x,
    y: window.y,
    width: window.width,
    height: window.height,
    preMaxBounds: window.preMaxBounds,
  };
}

function maybeSendWindowMessage(message: WindowClientMessage | null, meta?: WindowActionMeta): void {
  if (meta?.remote || message === null) {
    return;
  }

  sendPartyWindowMessage(message);
}

export const useWindows = create<WindowsStore>((set, get) => ({
  windows: {},
  zOrder: [],
  focusedId: null,

  openWindow: (appId, options, meta) => {
    const app = APPS[appId];
    const currentState = get();
    const id = options?.id ?? makeId();
    const n = currentState.zOrder.length;
    const width = options?.width ?? app.defaultSize.width;
    const height = options?.height ?? app.defaultSize.height;
    const appWindowCount = Object.values(currentState.windows).filter((win) => win.appId === appId).length;
    const spawnPosition = app.getSpawnPosition?.({
      appWindowCount,
      totalWindowCount: n,
      viewportWidth: globalThis.window?.innerWidth ?? width,
      viewportHeight: (globalThis.window?.innerHeight ?? height) - TASKBAR_HEIGHT,
    });
    const state: WindowState = {
      id,
      appId,
      title: app.title,
      icon: app.icon,
      x: options?.x ?? spawnPosition?.x ?? 60 + (n % 8) * 28,
      y: options?.y ?? spawnPosition?.y ?? 40 + (n % 8) * 28,
      width,
      height,
      isMinimized: options?.isMinimized ?? false,
      isMaximized: options?.isMaximized ?? false,
      preMaxBounds: options?.preMaxBounds,
    };

    const nextOrder = insertWindowId(currentState.zOrder, id, options?.z);
    const nextWindows = { ...currentState.windows, [id]: state };

    set({
      windows: nextWindows,
      zOrder: nextOrder,
      focusedId: getTopVisibleId(nextWindows, nextOrder),
    });

    maybeSendWindowMessage(toWindowOpenMessage(state, nextOrder.indexOf(id)), meta);
  },

  closeWindow: (id, meta) => {
    const currentState = get();

    if (!currentState.windows[id]) {
      return;
    }

    set((s) => {
      const { [id]: _removed, ...rest } = s.windows;
      const nextOrder = s.zOrder.filter((entry) => entry !== id);
      return {
        windows: rest,
        zOrder: nextOrder,
        focusedId: getTopVisibleId(rest, nextOrder),
      };
    });

    maybeSendWindowMessage({ type: 'window-close', windowId: id }, meta);
  },

  focusWindow: (id, meta) => {
    const currentState = get();
    const currentWindow = currentState.windows[id];

    if (!currentWindow) {
      return;
    }

    if (
      currentState.focusedId === id &&
      currentState.zOrder[currentState.zOrder.length - 1] === id &&
      !currentWindow.isMinimized
    ) {
      return;
    }

    const nextOrder = [...currentState.zOrder.filter((entry) => entry !== id), id];
    const nextWindows = currentWindow.isMinimized
      ? { ...currentState.windows, [id]: { ...currentWindow, isMinimized: false } }
      : currentState.windows;

    set({ zOrder: nextOrder, focusedId: id, windows: nextWindows });

    maybeSendWindowMessage(
      { type: 'window-focus', windowId: id, z: nextOrder.indexOf(id) },
      meta,
    );
  },

  moveWindow: (id, x, y, meta) => {
    const currentState = get();
    const currentWindow = currentState.windows[id];

    if (!currentWindow || (currentWindow.x === x && currentWindow.y === y)) {
      return;
    }

    set({
      windows: {
        ...currentState.windows,
        [id]: { ...currentWindow, x, y },
      },
    });

    maybeSendWindowMessage({ type: 'window-move', windowId: id, x, y }, meta);
  },

  resizeWindow: (id, x, y, width, height, meta) => {
    const currentState = get();
    const currentWindow = currentState.windows[id];

    if (
      !currentWindow ||
      (currentWindow.x === x &&
        currentWindow.y === y &&
        currentWindow.width === width &&
        currentWindow.height === height)
    ) {
      return;
    }

    set({
      windows: {
        ...currentState.windows,
        [id]: { ...currentWindow, x, y, width, height },
      },
    });

    maybeSendWindowMessage(
      { type: 'window-resize', windowId: id, x, y, width, height },
      meta,
    );
  },

  minimizeWindow: (id, meta) => {
    const currentState = get();
    const currentWindow = currentState.windows[id];

    if (!currentWindow || currentWindow.isMinimized) {
      return;
    }

    const nextOrder = [id, ...currentState.zOrder.filter((entry) => entry !== id)];
    const nextWindows = {
      ...currentState.windows,
      [id]: { ...currentWindow, isMinimized: true },
    };

    set({
      windows: nextWindows,
      zOrder: nextOrder,
      focusedId: getTopVisibleId(nextWindows, nextOrder),
    });

    maybeSendWindowMessage({ type: 'window-minimize', windowId: id }, meta);
  },

  toggleMaximize: (id, options, meta) => {
    const currentState = get();
    const currentWindow = currentState.windows[id];

    if (!currentWindow) {
      return;
    }

    let nextWindow: WindowState;

    if (options !== undefined) {
      nextWindow = {
        ...currentWindow,
        isMaximized: options.isMaximized,
        preMaxBounds: options.preMaxBounds,
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
      };
    } else if (currentWindow.isMaximized && currentWindow.preMaxBounds) {
      const { x, y, width, height } = currentWindow.preMaxBounds;
      nextWindow = {
        ...currentWindow,
        isMaximized: false,
        preMaxBounds: undefined,
        x,
        y,
        width,
        height,
      };
    } else {
      const vw = window.innerWidth;
      const vh = window.innerHeight - TASKBAR_HEIGHT;
      nextWindow = {
        ...currentWindow,
        isMaximized: true,
        preMaxBounds: {
          x: currentWindow.x,
          y: currentWindow.y,
          width: currentWindow.width,
          height: currentWindow.height,
        },
        x: 0,
        y: 0,
        width: vw,
        height: vh,
      };
    }

    set({
      windows: {
        ...currentState.windows,
        [id]: nextWindow,
      },
    });

    maybeSendWindowMessage(toWindowMaximizeMessage(nextWindow), meta);
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

  applyWindowSnapshot: (windows) => {
    const nextWindows: Record<string, WindowState> = {};
    const nextOrder: string[] = [];

    for (const syncedWindow of [...windows].sort((left, right) => left.z - right.z)) {
      if (!isRegisteredAppId(syncedWindow.appId)) {
        continue;
      }

      const app = APPS[syncedWindow.appId];

      nextWindows[syncedWindow.windowId] = {
        id: syncedWindow.windowId,
        appId: syncedWindow.appId,
        title: app.title,
        icon: app.icon,
        x: syncedWindow.x,
        y: syncedWindow.y,
        width: syncedWindow.width,
        height: syncedWindow.height,
        isMinimized: syncedWindow.isMinimized,
        isMaximized: syncedWindow.isMaximized,
        preMaxBounds: syncedWindow.preMaxBounds,
      };
      nextOrder.push(syncedWindow.windowId);
    }

    set({
      windows: nextWindows,
      zOrder: nextOrder,
      focusedId: getTopVisibleId(nextWindows, nextOrder),
    });
  },
}));
