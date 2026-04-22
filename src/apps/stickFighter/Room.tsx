import { useCallback, useEffect, useRef, useState } from 'react';
import Stage from './Stage';
import StatusBar from './StatusBar';
import { useStickFighter } from './state';
import { useStickFighterKeys } from './keyboard';

export default function Room() {
  const rootRef = useRef<HTMLDivElement>(null);
  // Forwarded to <Stage>; the animation renderer (upcoming PR) will read this imperatively.
  const stageRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  const roomId = useStickFighter((s) => s.roomId);
  const playerCount = useStickFighter((s) => s.playerCount);
  const leaveRoom = useStickFighter((s) => s.leaveRoom);
  const emitInput = useStickFighter((s) => s.emitInput);

  const [copied, setCopied] = useState(false);

  // Auto-focus the root on mount so keyboard input works immediately.
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Re-focus the Room root after any mousedown inside the enclosing OS window
  // (titlebar drag, chrome buttons, header buttons). Without this, dragging the
  // window by its titlebar deflects focus and WASD stops reaching the listener
  // until the user clicks back inside the stage.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const win = root.closest('.window');
    if (!win) return;
    const refocus = () => {
      requestAnimationFrame(() => rootRef.current?.focus());
    };
    win.addEventListener('mousedown', refocus);
    return () => win.removeEventListener('mousedown', refocus);
  }, []);

  useStickFighterKeys(rootRef, emitInput);

  const flashCopied = useCallback(() => {
    setCopied(true);
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, 1500);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      flashCopied();
    } catch {
      // Clipboard can fail in insecure contexts; fall back to a selection.
      const ta = document.createElement('textarea');
      ta.value = roomId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flashCopied();
    }
  }, [roomId, flashCopied]);

  if (!roomId) return null; // Parent should not render Room without a roomId.

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#c0c0c0',
        outline: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          borderBottom: '1px solid #808080',
        }}
      >
        <strong>Room:</strong>
        <code
          style={{
            padding: '2px 6px',
            border: '1px inset #c0c0c0',
            background: '#fff',
          }}
        >
          {roomId}
        </code>
        <button type="button" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={leaveRoom}>
          Leave
        </button>
      </div>

      <Stage ref={stageRef} />
      <StatusBar playerCount={playerCount} />
    </div>
  );
}
