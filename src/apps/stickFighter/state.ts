import { create } from 'zustand';
import { generateRoomId, isValidRoomId, normalizeRoomId } from './roomId';

export type InputEvent =
  | { type: 'move'; dir: 'left' | 'right' | 'up' | 'down'; pressed: boolean }
  | { type: 'jump' }
  | { type: 'punch' };

interface StickFighterStore {
  roomId: string | null;
  playerCount: number;

  createRoom: () => void;
  joinRoom: (id: string) => boolean;
  leaveRoom: () => void;
  emitInput: (event: InputEvent) => void;
}

export const useStickFighter = create<StickFighterStore>((set) => ({
  roomId: null,
  playerCount: 1,

  createRoom: () => {
    set({ roomId: generateRoomId(), playerCount: 1 });
  },

  joinRoom: (id) => {
    if (!isValidRoomId(id)) return false;
    set({ roomId: normalizeRoomId(id), playerCount: 1 });
    return true;
  },

  leaveRoom: () => {
    set({ roomId: null, playerCount: 1 });
  },

  emitInput: (event) => {
    // Integration seam: the PartyKit branch replaces this body with
    //   socket.send(JSON.stringify(event))
    // Keeping a log in dev makes manual smoke tests verifiable.
    if (import.meta.env.DEV) {
      console.debug('[stick-fighter] input', event);
    }
  },
}));
