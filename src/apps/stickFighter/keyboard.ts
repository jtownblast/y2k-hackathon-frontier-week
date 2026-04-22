import { useEffect, type RefObject } from 'react';
import type { InputEvent } from './state';

type Direction = 'left' | 'right' | 'up' | 'down';

const MOVE_KEYS: Record<string, Direction> = {
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

export function useStickFighterKeys(
  rootRef: RefObject<HTMLElement>,
  onInput: (event: InputEvent) => void,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();

      if (k in MOVE_KEYS) {
        e.preventDefault();
        onInput({ type: 'move', dir: MOVE_KEYS[k], pressed: true });
        return;
      }
      if (k === ' ' || e.code === 'Space') {
        e.preventDefault();
        onInput({ type: 'jump' });
        return;
      }
      if (k === 'k') {
        e.preventDefault();
        onInput({ type: 'punch' });
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in MOVE_KEYS) {
        e.preventDefault();
        onInput({ type: 'move', dir: MOVE_KEYS[k], pressed: false });
      }
    };

    root.addEventListener('keydown', handleKeyDown);
    root.addEventListener('keyup', handleKeyUp);
    return () => {
      root.removeEventListener('keydown', handleKeyDown);
      root.removeEventListener('keyup', handleKeyUp);
    };
  }, [rootRef, onInput]);
}
