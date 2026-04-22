import { APPS } from '../apps/registry';
import type { AppId } from '../os/types';
import { useWindows } from '../os/useWindows';
import { usePartyOnWindowMessage } from './useParty';

function isRegisteredAppId(appId: string): appId is AppId {
  return appId in APPS;
}

export function useWindowSync(): void {
  const applyWindowSnapshot = useWindows((state) => state.applyWindowSnapshot);
  const openWindow = useWindows((state) => state.openWindow);
  const closeWindow = useWindows((state) => state.closeWindow);
  const focusWindow = useWindows((state) => state.focusWindow);
  const moveWindow = useWindows((state) => state.moveWindow);
  const resizeWindow = useWindows((state) => state.resizeWindow);
  const minimizeWindow = useWindows((state) => state.minimizeWindow);
  const toggleMaximize = useWindows((state) => state.toggleMaximize);

  usePartyOnWindowMessage((message) => {
    switch (message.type) {
      case 'window-snapshot':
        applyWindowSnapshot(message.windows);
        return;
      case 'window-open':
        if (!isRegisteredAppId(message.appId)) {
          return;
        }

        openWindow(
          message.appId,
          {
            id: message.windowId,
            x: message.x,
            y: message.y,
            width: message.width,
            height: message.height,
            z: message.z,
            isMinimized: message.isMinimized,
            isMaximized: message.isMaximized,
            preMaxBounds: message.preMaxBounds,
          },
          { remote: true },
        );
        return;
      case 'window-move':
        moveWindow(message.windowId, message.x, message.y, { remote: true });
        return;
      case 'window-resize':
        resizeWindow(
          message.windowId,
          message.x,
          message.y,
          message.width,
          message.height,
          { remote: true },
        );
        return;
      case 'window-close':
        closeWindow(message.windowId, { remote: true });
        return;
      case 'window-focus':
        focusWindow(message.windowId, { remote: true });
        return;
      case 'window-minimize':
        minimizeWindow(message.windowId, { remote: true });
        return;
      case 'window-maximize':
        toggleMaximize(
          message.windowId,
          {
            isMaximized: message.isMaximized,
            x: message.x,
            y: message.y,
            width: message.width,
            height: message.height,
            preMaxBounds: message.preMaxBounds,
          },
          { remote: true },
        );
        return;
      default:
        return;
    }
  });
}