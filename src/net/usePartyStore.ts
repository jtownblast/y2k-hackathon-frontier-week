import { create } from 'zustand';

import type { PartyStateSnapshot } from './client';
import type { PlayerState } from './messages';

type PartyPlayers = Record<string, PlayerState>;

type PartyStore = {
  players: PartyPlayers;
  selfId: string | null;
  setSnapshot: (snapshot: PartyStateSnapshot) => void;
  reset: () => void;
};

function createInitialState(): Pick<PartyStore, 'players' | 'selfId'> {
  return {
    players: {},
    selfId: null,
  };
}

export const usePartyStore = create<PartyStore>((set) => ({
  ...createInitialState(),

  setSnapshot: (snapshot) =>
    set({
      players: { ...snapshot.players },
      selfId: snapshot.selfId,
    }),
  reset: () => set(createInitialState()),
}));