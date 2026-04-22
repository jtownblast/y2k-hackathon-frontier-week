import { useEffect, useState } from 'react';
import { useWindows, TASKBAR_HEIGHT } from './useWindows';
import { useOS } from './useOS';

function WindowsFlag() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" style={{ display: 'block' }}>
      <path d="M1 2 L6 1.3 L6 6.6 L1 6.6 Z" fill="#ff0000" />
      <path d="M6.5 1.2 L13 0 L13 6.6 L6.5 6.6 Z" fill="#00a800" />
      <path d="M1 7 L6 7 L6 12.4 L1 11.7 Z" fill="#0000a8" />
      <path d="M6.5 7 L13 7 L13 13.5 L6.5 12.3 Z" fill="#ffff00" />
    </svg>
  );
}

function formatTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function Taskbar() {
  const zOrder = useWindows((s) => s.zOrder);
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const taskbarClick = useWindows((s) => s.taskbarClick);
  const toggleStartMenu = useOS((s) => s.toggleStartMenu);
  const startMenuOpen = useOS((s) => s.startMenuOpen);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  const buttonOrder = [...zOrder].sort();

  return (
    <div
      className="taskbar"
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: TASKBAR_HEIGHT,
        background: '#c0c0c0',
        borderTop: '1px solid #ffffff',
        boxShadow: 'inset 0 1px 0 #dfdfdf',
        display: 'flex',
        alignItems: 'center',
        padding: '2px 2px 2px 2px',
        gap: 4,
        zIndex: 9000,
        fontFamily: '"Pixelated MS Sans Serif", "MS Sans Serif", Arial, sans-serif',
        fontSize: 11,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleStartMenu();
        }}
        className={startMenuOpen ? 'active' : ''}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontWeight: 'bold',
          padding: '2px 6px',
          minWidth: 54,
          height: 22,
        }}
      >
        <WindowsFlag />
        <span>Start</span>
      </button>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          minWidth: 0,
          height: 22,
          overflow: 'hidden',
        }}
      >
        {buttonOrder.map((id) => {
          const win = windows[id];
          if (!win) return null;
          const active = focusedId === id && !win.isMinimized;
          return (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                taskbarClick(id);
              }}
              className={active ? 'active' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                minWidth: 120,
                maxWidth: 160,
                height: 22,
                padding: '0 6px',
                textAlign: 'left',
                overflow: 'hidden',
              }}
            >
              <img
                src={win.icon}
                alt=""
                width={16}
                height={16}
                draggable={false}
                style={{ flex: 'none' }}
              />
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {win.title}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="tray"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          height: 22,
          border: '1px solid',
          borderColor: '#808080 #ffffff #ffffff #808080',
          minWidth: 70,
          justifyContent: 'center',
        }}
      >
        <span>{formatTime(now)}</span>
      </div>
    </div>
  );
}
