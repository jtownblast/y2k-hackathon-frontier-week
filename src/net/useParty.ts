import { useEffect, useRef } from 'react';

import { PartyClient } from './client';
import type {
  ActionName,
  AttackMessage,
  Facing,
  WindowClientMessage,
  WindowServerMessage,
} from './messages';
import { getRoomKey } from './room';
import { usePartyStore } from './usePartyStore';

type SharedClientEntry = {
  client: PartyClient;
  refCount: number;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
};

const sharedClients = new Map<string, SharedClientEntry>();
type AttackHandler = (message: AttackMessage) => void;
type WindowHandler = (message: WindowServerMessage) => void;

export function useParty(): void {
  const roomKey = useRef(getRoomKey()).current;
  const setSnapshot = usePartyStore((state) => state.setSnapshot);

  useEffect(() => {
    const client = acquireClient(roomKey);
    const unsubscribe = client.onState(setSnapshot);

    return () => {
      unsubscribe();
      releaseClient(roomKey);
    };
  }, [roomKey, setSnapshot]);
}

export function usePartySendMove(): (
  x: number,
  y: number,
  facing: Facing,
  action: ActionName,
  frameIndex: number
) => void {
  const roomKey = useRef(getRoomKey()).current;

  return (x, y, facing, action, frameIndex) => {
    sharedClients.get(roomKey)?.client.sendMove(x, y, facing, action, frameIndex);
  };
}

export function usePartySendAttack(): (x: number, y: number, facing: Facing) => void {
  const roomKey = useRef(getRoomKey()).current;

  return (x, y, facing) => {
    sharedClients.get(roomKey)?.client.sendAttack(x, y, facing);
  };
}

export function sendPartyWindowMessage(message: WindowClientMessage): void {
  sharedClients.get(getRoomKey())?.client.sendWindowMessage(message);
}

export function usePartyOnAttack(handler: AttackHandler): void {
  const roomKey = useRef(getRoomKey()).current;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const client = acquireClient(roomKey);
    const unsubscribe = client.onAttack((message) => {
      handlerRef.current(message);
    });

    return () => {
      unsubscribe();
      releaseClient(roomKey);
    };
  }, [roomKey]);
}

export function usePartyOnWindowMessage(handler: WindowHandler): void {
  const roomKey = useRef(getRoomKey()).current;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const client = acquireClient(roomKey);
    const unsubscribe = client.onWindowMessage((message) => {
      handlerRef.current(message);
    });

    return () => {
      unsubscribe();
      releaseClient(roomKey);
    };
  }, [roomKey]);
}

function acquireClient(roomKey: string): PartyClient {
  const existingEntry = sharedClients.get(roomKey);

  if (existingEntry !== undefined) {
    existingEntry.refCount += 1;

    if (existingEntry.disconnectTimer !== null) {
      clearTimeout(existingEntry.disconnectTimer);
      existingEntry.disconnectTimer = null;
    }

    return existingEntry.client;
  }

  const client = new PartyClient(roomKey);

  sharedClients.set(roomKey, {
    client,
    refCount: 1,
    disconnectTimer: null,
  });

  return client;
}

function releaseClient(roomKey: string): void {
  const entry = sharedClients.get(roomKey);

  if (entry === undefined) {
    return;
  }

  entry.refCount = Math.max(0, entry.refCount - 1);

  if (entry.refCount > 0 || entry.disconnectTimer !== null) {
    return;
  }

  entry.disconnectTimer = setTimeout(() => {
    const currentEntry = sharedClients.get(roomKey);

    if (currentEntry === undefined || currentEntry.refCount > 0) {
      return;
    }

    currentEntry.client.disconnect();
    sharedClients.delete(roomKey);

    if (sharedClients.size === 0) {
      usePartyStore.getState().reset();
    }
  }, 0);
}