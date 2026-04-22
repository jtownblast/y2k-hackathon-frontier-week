import { useEffect, useRef, useState } from 'react';
import { useOS } from './useOS';
import { useWindows, TASKBAR_HEIGHT } from './useWindows';
import { APPS, DESKTOP_ORDER } from '../apps/registry';
import type { AppId } from './types';

import programsIcon from '../assets/icons/programs.png';
import documentsIcon from '../assets/icons/documents.png';
import settingsIcon from '../assets/icons/settings.png';
import findIcon from '../assets/icons/find.png';
import helpIcon from '../assets/icons/help.png';
import runIcon from '../assets/icons/run.png';
import shutDownIcon from '../assets/icons/shut-down.png';

interface MenuItemRow {
  label: string;
  icon: string;
  bold?: boolean;
  hasSubmenu?: boolean;
  onClick?: () => void;
  onHover?: () => void;
}

function Row({ label, icon, bold, hasSubmenu, hovered, onMouseEnter, onClick }: MenuItemRow & {
  hovered: boolean;
  onMouseEnter: () => void;
}) {
  return (
    <li
      role="menuitem"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 8px 4px 6px',
        background: hovered ? '#000080' : 'transparent',
        color: hovered ? '#ffffff' : '#000000',
        cursor: 'default',
        fontWeight: bold ? 'bold' : 'normal',
        fontSize: 13,
        minWidth: 170,
      }}
    >
      <img
        src={icon}
        alt=""
        width={24}
        height={24}
        draggable={false}
        style={{ flex: 'none' }}
      />
      <span style={{ flex: 1, userSelect: 'none' }}>{label}</span>
      {hasSubmenu && <span style={{ fontSize: 10 }}>▸</span>}
    </li>
  );
}

export default function StartMenu() {
  const closeStartMenu = useOS((s) => s.closeStartMenu);
  const triggerShutDown = useOS((s) => s.triggerShutDown);
  const openWindow = useWindows((s) => s.openWindow);

  const [hovered, setHovered] = useState<string | null>(null);
  const [submenuHovered, setSubmenuHovered] = useState<AppId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-start-button]')) return;
        closeStartMenu();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStartMenu();
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [closeStartMenu]);

  const handleAppClick = (appId: AppId) => {
    openWindow(appId);
    closeStartMenu();
  };

  const items: (MenuItemRow & { key: string; divider?: false })[] = [
    { key: 'programs', label: 'Programs', icon: programsIcon, hasSubmenu: true },
    { key: 'documents', label: 'Documents', icon: documentsIcon, onClick: closeStartMenu },
    { key: 'settings', label: 'Settings', icon: settingsIcon, onClick: closeStartMenu },
    { key: 'find', label: 'Find', icon: findIcon, onClick: closeStartMenu },
    { key: 'help', label: 'Help', icon: helpIcon, onClick: closeStartMenu },
    { key: 'run', label: 'Run...', icon: runIcon, onClick: closeStartMenu },
  ];

  return (
    <div
      ref={rootRef}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        left: 2,
        bottom: TASKBAR_HEIGHT + 1,
        display: 'flex',
        background: '#c0c0c0',
        border: '1px solid',
        borderColor: '#ffffff #808080 #808080 #ffffff',
        boxShadow: '1px 1px 0 #000',
        zIndex: 9500,
        fontFamily: '"Pixelated MS Sans Serif", "MS Sans Serif", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: 24,
          background: 'linear-gradient(to top, #000080 0%, #1084d0 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '8px 0',
        }}
      >
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: '"Times New Roman", Times, serif',
            fontStyle: 'italic',
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: '#ffffff' }}>WLHNIHTBLTAH</span>
          <span style={{ color: '#000000', marginLeft: 4 }}>98</span>
        </div>
      </div>

      <ul
        onMouseLeave={() => setHovered(null)}
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '2px 0',
          minWidth: 190,
        }}
      >
        {items.map(({ key, ...item }) => (
          <Row
            key={key}
            {...item}
            hovered={hovered === key}
            onMouseEnter={() => {
              setHovered(key);
              if (key !== 'programs') setSubmenuHovered(null);
            }}
          />
        ))}

        <li
          aria-hidden="true"
          style={{
            height: 2,
            margin: '2px 4px',
            borderTop: '1px solid #808080',
            borderBottom: '1px solid #ffffff',
          }}
          onMouseEnter={() => {
            setHovered('__divider');
            setSubmenuHovered(null);
          }}
        />

        <Row
          label="Shut Down..."
          icon={shutDownIcon}
          hovered={hovered === 'shut-down'}
          onMouseEnter={() => {
            setHovered('shut-down');
            setSubmenuHovered(null);
          }}
          onClick={triggerShutDown}
        />
      </ul>

      {hovered === 'programs' && (
        <ul
          onMouseLeave={() => setSubmenuHovered(null)}
          style={{
            position: 'absolute',
            left: 24 + 190 + 2,
            bottom: 0,
            listStyle: 'none',
            margin: 0,
            padding: '2px 0',
            background: '#c0c0c0',
            border: '1px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            boxShadow: '1px 1px 0 #000',
            minWidth: 200,
          }}
        >
          {DESKTOP_ORDER.map((appId) => {
            const app = APPS[appId];
            return (
              <li
                key={appId}
                role="menuitem"
                onClick={() => handleAppClick(appId)}
                onMouseEnter={() => setSubmenuHovered(appId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 8px 4px 6px',
                  background: submenuHovered === appId ? '#000080' : 'transparent',
                  color: submenuHovered === appId ? '#ffffff' : '#000000',
                  cursor: 'default',
                  fontSize: 12,
                }}
              >
                <img
                  src={app.icon}
                  alt=""
                  width={20}
                  height={20}
                  draggable={false}
                  style={{ flex: 'none' }}
                />
                <span style={{ userSelect: 'none' }}>{app.title}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
