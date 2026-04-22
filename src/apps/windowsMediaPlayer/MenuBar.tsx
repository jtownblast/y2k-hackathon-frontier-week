import { useState, useRef, useEffect } from 'react';
import { useWindows } from '../../os/useWindows';
import { useMediaPlayer } from './state';

interface MenuDef {
  label: string;
  items: { label: string; onClick?: () => void; divider?: boolean }[];
}

interface Props {
  onFileOpen: () => void;
}

export default function MenuBar({ onFileOpen }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const play = useMediaPlayer((s) => s.play);
  const pause = useMediaPlayer((s) => s.pause);
  const next = useMediaPlayer((s) => s.next);
  const prev = useMediaPlayer((s) => s.prev);
  const stop = useMediaPlayer((s) => s.stop);
  const toggleFull = useMediaPlayer((s) => s.toggleFullscreenViz);

  // Close the WMP window by closing whichever window has this app focused.
  const closeMe = () => {
    const { windows, focusedId } = useWindows.getState();
    const id = focusedId && windows[focusedId]?.appId === 'windows-media-player'
      ? focusedId
      : Object.values(windows).find((w) => w.appId === 'windows-media-player')?.id;
    if (id) useWindows.getState().closeWindow(id);
  };

  const menus: MenuDef[] = [
    {
      label: 'File',
      items: [
        { label: 'Open...', onClick: onFileOpen },
        { label: '-', divider: true },
        { label: 'Exit', onClick: closeMe },
      ],
    },
    {
      label: 'View',
      items: [{ label: 'Full Mode Visualizer', onClick: toggleFull }],
    },
    {
      label: 'Play',
      items: [
        { label: 'Play/Pause', onClick: () => useMediaPlayer.getState().togglePlay() },
        { label: 'Stop', onClick: stop },
        { label: '-', divider: true },
        { label: 'Previous', onClick: prev },
        { label: 'Next', onClick: next },
      ],
    },
    {
      label: 'Tools',
      items: [{ label: 'Options...' }],
    },
    {
      label: 'Help',
      items: [{ label: 'About Windows Media Player' }],
    },
  ];

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  // Silence unused-param lint if any handler is optional.
  void play;
  void pause;

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        background: '#ece9d8',
        color: '#000',
        fontSize: 11,
        padding: '2px 2px',
        borderBottom: '1px solid #808080',
        position: 'relative',
        zIndex: 5,
      }}
    >
      {menus.map((m) => {
        const isOpen = openMenu === m.label;
        return (
          <div key={m.label} style={{ position: 'relative' }}>
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setOpenMenu(isOpen ? null : m.label);
              }}
              onMouseEnter={() => {
                if (openMenu) setOpenMenu(m.label);
              }}
              style={{
                padding: '2px 8px',
                cursor: 'default',
                background: isOpen ? '#0a246a' : 'transparent',
                color: isOpen ? '#fff' : '#000',
              }}
            >
              {m.label}
            </div>
            {isOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  minWidth: 180,
                  background: '#ece9d8',
                  border: '1px solid #404040',
                  boxShadow: '2px 2px 6px rgba(0,0,0,0.35)',
                  padding: '2px 0',
                  zIndex: 20,
                }}
              >
                {m.items.map((item, i) =>
                  item.divider ? (
                    <div
                      key={i}
                      style={{
                        height: 1,
                        background: '#808080',
                        margin: '3px 4px',
                      }}
                    />
                  ) : (
                    <div
                      key={i}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        item.onClick?.();
                        setOpenMenu(null);
                      }}
                      style={{
                        padding: '3px 22px',
                        color: item.onClick ? '#000' : '#808080',
                      }}
                      onMouseEnter={(e) => {
                        if (item.onClick) {
                          (e.currentTarget as HTMLDivElement).style.background =
                            '#0a246a';
                          (e.currentTarget as HTMLDivElement).style.color =
                            '#fff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          'transparent';
                        (e.currentTarget as HTMLDivElement).style.color =
                          item.onClick ? '#000' : '#808080';
                      }}
                    >
                      {item.label}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
