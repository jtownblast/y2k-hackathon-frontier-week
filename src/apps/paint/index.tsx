import { useCallback, useEffect, useRef, useState } from 'react';
import Canvas, { type CanvasHandle } from './Canvas';
import ColorPalette from './ColorPalette';
import MenuBar, { type MenuDef } from './MenuBar';
import StatusBar from './StatusBar';
import Toolbox from './Toolbox';

const DEFAULT_CANVAS_WIDTH = 600;
const DEFAULT_CANVAS_HEIGHT = 425;
const DEFAULT_HINT = 'For Help, click Help Topics on the Help Menu.';

export default function Paint() {
  const canvasRef = useRef<CanvasHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [hint, setHint] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  });

  const call = <K extends keyof CanvasHandle>(method: K) =>
    () => canvasRef.current?.[method]();

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+S / Delete)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && !root.contains(active) && active !== document.body) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) canvasRef.current?.redo();
          else canvasRef.current?.undo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          canvasRef.current?.redo();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          canvasRef.current?.saveAsPng();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only act if we have a selection to clear — deleteSelection is a no-op otherwise.
        canvasRef.current?.deleteSelection();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleHint = useCallback((h: string | null) => setHint(h), []);
  const handleCursor = useCallback((c: { x: number; y: number } | null) => setCursor(c), []);
  const handleResize = useCallback((width: number, height: number) => {
    setCanvasSize({ width, height });
  }, []);

  const menus: MenuDef[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New', shortcut: 'Ctrl+N', onClick: call('clear') },
        { label: 'Open...', shortcut: 'Ctrl+O', disabled: true },
        { label: 'Save', shortcut: 'Ctrl+S', onClick: call('saveAsPng') },
        { label: 'Save As...', onClick: call('saveAsPng') },
        { divider: true },
        { label: 'Print Preview', disabled: true },
        { label: 'Page Setup...', disabled: true },
        { label: 'Print...', shortcut: 'Ctrl+P', disabled: true },
        { divider: true },
        { label: 'Send...', disabled: true },
        { divider: true },
        { label: 'Set As Wallpaper (Tiled)', disabled: true },
        { label: 'Set As Wallpaper (Centered)', disabled: true },
        { divider: true },
        { label: 'Exit', shortcut: 'Alt+F4', disabled: true },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', onClick: call('undo') },
        { label: 'Repeat', shortcut: 'Ctrl+Y', onClick: call('redo') },
        { divider: true },
        { label: 'Cut', shortcut: 'Ctrl+X', disabled: true },
        { label: 'Copy', shortcut: 'Ctrl+C', disabled: true },
        { label: 'Paste', shortcut: 'Ctrl+V', disabled: true },
        { label: 'Clear Selection', shortcut: 'Del', onClick: call('deleteSelection') },
        { label: 'Select All', shortcut: 'Ctrl+A', disabled: true },
        { divider: true },
        { label: 'Copy To...', disabled: true },
        { label: 'Paste From...', disabled: true },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Tool Box', shortcut: 'Ctrl+T', disabled: true },
        { label: 'Color Box', shortcut: 'Ctrl+L', disabled: true },
        { label: 'Status Bar', disabled: true },
        { label: 'Text Toolbar', disabled: true },
        { divider: true },
        { label: 'Zoom', disabled: true },
        { label: 'View Bitmap', shortcut: 'Ctrl+F', disabled: true },
      ],
    },
    {
      id: 'image',
      label: 'Image',
      items: [
        { label: 'Flip/Rotate...', shortcut: 'Ctrl+R', disabled: true },
        { label: 'Stretch/Skew...', shortcut: 'Ctrl+W', disabled: true },
        { label: 'Invert Colors', shortcut: 'Ctrl+I', onClick: call('invertColors') },
        { label: 'Attributes...', shortcut: 'Ctrl+E', disabled: true },
        { label: 'Clear Image', shortcut: 'Ctrl+Shft+N', onClick: call('clear') },
        { label: 'Draw Opaque', disabled: true },
      ],
    },
    {
      id: 'colors',
      label: 'Colors',
      items: [{ label: 'Edit Colors...', disabled: true }],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Help Topics', disabled: true },
        { label: 'About Paint', disabled: true },
      ],
    },
  ];

  return (
    <div
      ref={rootRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#c0c0c0',
        userSelect: 'none',
      }}
    >
      <MenuBar menus={menus} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <Toolbox onHint={handleHint} />
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#808080',
          }}
        >
          <Canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onCursor={handleCursor}
            onHint={handleHint}
            onResize={handleResize}
          />
        </div>
      </div>

      <ColorPalette />
      <StatusBar
        message={hint ?? DEFAULT_HINT}
        cursor={cursor}
        canvasSize={canvasSize}
      />
    </div>
  );
}
