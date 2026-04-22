import { type ReactNode, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useWindows, TASKBAR_HEIGHT } from './useWindows';
import type { WindowState } from './types';
import { APPS } from '../apps/registry';

interface Props {
  window: WindowState;
  zIndex: number;
  focused: boolean;
  children: ReactNode;
}

const MIN_WIDTH = 240;
const MIN_HEIGHT = 140;
const WINDOW_SYNC_INTERVAL_MS = 33;

export default function Window({ window: win, zIndex, focused, children }: Props) {
  const { focusWindow, closeWindow, moveWindow, resizeWindow, minimizeWindow, toggleMaximize } =
    useWindows();
  const app = APPS[win.appId];
  const windowOptions = app.window;
  const minWidth = windowOptions?.minWidth ?? MIN_WIDTH;
  const minHeight = windowOptions?.minHeight ?? MIN_HEIGHT;
  const resizable = windowOptions?.resizable ?? true;
  const showMinimize = windowOptions?.showMinimize ?? true;
  const showMaximize = windowOptions?.showMaximize ?? true;
  const showBody = windowOptions?.showBody ?? true;

  const moveThrottleRef = useRef(0);
  const resizeThrottleRef = useRef(0);

  if (win.isMinimized) return null;

  const stopDrag = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  const handleTitleBarDoubleClick = (e: React.MouseEvent) => {
    if (!showMaximize) {
      return;
    }

    if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
    toggleMaximize(win.id);
  };

  const clampPosition = (x: number, y: number) => {
    const maxY = (globalThis.window.innerHeight ?? 0) - TASKBAR_HEIGHT - 24;

    return {
      x: Math.max(0, x),
      y: Math.min(Math.max(0, y), Math.max(0, maxY)),
    };
  };

  const shouldSync = (lastSentAtRef: React.MutableRefObject<number>) => {
    const now = performance.now();

    if (now - lastSentAtRef.current < WINDOW_SYNC_INTERVAL_MS) {
      return false;
    }

    lastSentAtRef.current = now;
    return true;
  };

  const syncMove = (x: number, y: number, force = false) => {
    if (!force && !shouldSync(moveThrottleRef)) {
      return;
    }

    const nextPosition = clampPosition(x, y);
    moveWindow(win.id, nextPosition.x, nextPosition.y);
  };

  const syncResize = (x: number, y: number, width: number, height: number, force = false) => {
    if (!force && !shouldSync(resizeThrottleRef)) {
      return;
    }

    resizeWindow(win.id, x, y, width, height);
  };

  return (
    <Rnd
      position={{ x: win.x, y: win.y }}
      size={{ width: win.width, height: win.height }}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds="parent"
      dragHandleClassName="title-bar"
      disableDragging={win.isMaximized}
      enableResizing={!win.isMaximized && resizable}
      onDragStart={() => {
        moveThrottleRef.current = 0;
        focusWindow(win.id);
      }}
      onDrag={(_e, d) => {
        syncMove(d.x, d.y);
      }}
      onDragStop={(_e, d) => {
        syncMove(d.x, d.y, true);
      }}
      onResizeStart={() => {
        resizeThrottleRef.current = 0;
        focusWindow(win.id);
      }}
      onResize={(_e, _dir, ref, _delta, position) => {
        syncResize(position.x, position.y, ref.offsetWidth, ref.offsetHeight);
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        syncResize(position.x, position.y, ref.offsetWidth, ref.offsetHeight, true);
      }}
      style={{ zIndex, display: 'flex', flexDirection: 'column' }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div
        className="window"
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <div
          className={`title-bar${focused ? '' : ' inactive'}`}
          onDoubleClick={handleTitleBarDoubleClick}
          style={{ cursor: win.isMaximized ? 'default' : 'move' }}
        >
          <div className="title-bar-text" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <img
              src={win.icon}
              alt=""
              width={16}
              height={16}
              style={{ display: 'block' }}
              draggable={false}
            />
            <span>{win.title}</span>
          </div>
          <div className="title-bar-controls">
            {showMinimize && (
              <button
                aria-label="Minimize"
                onMouseDown={stopDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeWindow(win.id);
                }}
              />
            )}
            {showMaximize && (
              <button
                aria-label={win.isMaximized ? 'Restore' : 'Maximize'}
                onMouseDown={stopDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximize(win.id);
                }}
              />
            )}
            <button
              aria-label="Close"
              onMouseDown={stopDrag}
              onClick={(e) => {
                e.stopPropagation();
                closeWindow(win.id);
              }}
            />
          </div>
        </div>
        {showBody && (
          <div
            className="window-body"
            style={{ flex: 1, overflow: 'auto', margin: 0, padding: 0 }}
          >
            {children}
          </div>
        )}
      </div>
    </Rnd>
  );
}
