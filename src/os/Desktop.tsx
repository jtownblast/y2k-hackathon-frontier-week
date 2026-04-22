import { useState } from 'react';
import DesktopIcon from './DesktopIcon';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import WindowManager from './WindowManager';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import { useWindows, TASKBAR_HEIGHT } from './useWindows';
import { useOS } from './useOS';
import { APPS, DESKTOP_ORDER } from '../apps/registry';
import type { AppId } from './types';

type MenuAnchor =
  | { kind: 'desktop'; x: number; y: number }
  | { kind: 'icon'; x: number; y: number; appId: AppId };

export default function Desktop() {
  const [selected, setSelected] = useState<AppId | null>(null);
  const [menu, setMenu] = useState<MenuAnchor | null>(null);
  const openWindow = useWindows((s) => s.openWindow);
  const closeStartMenu = useOS((s) => s.closeStartMenu);
  const startMenuOpen = useOS((s) => s.startMenuOpen);

  const clearAll = () => {
    setSelected(null);
    setMenu(null);
    if (startMenuOpen) closeStartMenu();
  };

  const desktopMenuItems: ContextMenuItem[] = [
    { label: 'Arrange Icons' },
    { label: 'Line Up Icons' },
    { divider: true },
    { label: 'Refresh' },
    { divider: true },
    { label: 'Paste', disabled: true },
    { label: 'Paste Shortcut', disabled: true },
    { divider: true },
    { label: 'New Folder' },
    { divider: true },
    { label: 'Properties' },
  ];

  const iconMenuItems = (appId: AppId): ContextMenuItem[] => [
    { label: 'Open', bold: true, onClick: () => openWindow(appId) },
    { divider: true },
    { label: 'Cut', disabled: true },
    { label: 'Copy', disabled: true },
    { divider: true },
    { label: 'Create Shortcut' },
    { label: 'Delete' },
    { label: 'Rename' },
    { divider: true },
    { label: 'Properties' },
  ];

  return (
    <div
      className="desktop"
      onMouseDown={clearAll}
      onContextMenu={(e) => {
        e.preventDefault();
        setSelected(null);
        setMenu({ kind: 'desktop', x: e.clientX, y: e.clientY });
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#008080',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 8,
          bottom: TASKBAR_HEIGHT + 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1,
        }}
      >
        {DESKTOP_ORDER.map((appId) => {
          const app = APPS[appId];
          return (
            <DesktopIcon
              key={appId}
              icon={app.icon}
              label={app.title}
              selected={selected === appId}
              onSelect={() => setSelected(appId)}
              onOpen={() => openWindow(appId)}
              onContextMenu={(e) =>
                setMenu({ kind: 'icon', x: e.clientX, y: e.clientY, appId })
              }
            />
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: `0 0 ${TASKBAR_HEIGHT}px 0`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
          <WindowManager />
        </div>
      </div>

      <Taskbar />
      {startMenuOpen && <StartMenu />}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.kind === 'desktop' ? desktopMenuItems : iconMenuItems(menu.appId)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
