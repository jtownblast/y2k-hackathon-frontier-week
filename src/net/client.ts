import PartySocket from 'partysocket';

import {
  type AttackMessage,
  isServerMsg,
  type ActionName,
  type Facing,
  type MoveMessage,
  type PlayerState,
  type ServerMsg,
  type WindowClientMessage,
  type WindowServerMessage,
  type WindowSnapshotMessage,
} from './messages';
import { getRoomKey, isValidRoomKey } from './room';

const LOCAL_PARTYKIT_HOST = '127.0.0.1:1999';

export type PartyStateSnapshot = {
  players: Record<string, PlayerState>;
  selfId: string | null;
};

type StateListener = (snapshot: PartyStateSnapshot) => void;
type AttackListener = (message: AttackMessage) => void;
type WindowListener = (message: WindowServerMessage) => void;

export class PartyClient {
  readonly roomKey: string;

  private readonly socket: PartySocket;
  private readonly listeners = new Set<StateListener>();
  private readonly attackListeners = new Set<AttackListener>();
  private readonly windowListeners = new Set<WindowListener>();
  private snapshot: PartyStateSnapshot = {
    players: {},
    selfId: null,
  };
  private latestWindowSnapshot: WindowSnapshotMessage | null = null;

  constructor(roomKey = getRoomKey()) {
    this.roomKey = isValidRoomKey(roomKey) ? roomKey : getRoomKey();
    this.socket = new PartySocket({
      host: resolvePartyHost(),
      room: this.roomKey,
      party: 'main',
    });

    this.socket.addEventListener('message', this.handleMessage);
  }

  onState(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);

    return () => {
      this.listeners.delete(listener);
    };
  }

  onAttack(listener: AttackListener): () => void {
    this.attackListeners.add(listener);

    return () => {
      this.attackListeners.delete(listener);
    };
  }

  onWindowMessage(listener: WindowListener): () => void {
    this.windowListeners.add(listener);

    if (this.latestWindowSnapshot !== null) {
      listener(this.latestWindowSnapshot);
    }

    return () => {
      this.windowListeners.delete(listener);
    };
  }

  sendMove(
    x: number,
    y: number,
    facing: Facing,
    action: ActionName,
    frameIndex: number
  ): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: MoveMessage = {
      type: 'move',
      x,
      y,
      facing,
      action,
      frameIndex,
    };

    this.socket.send(JSON.stringify(message));
  }

  sendAttack(x: number, y: number, facing: Facing): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: AttackMessage = {
      type: 'attack',
      x,
      y,
      facing,
    };

    this.socket.send(JSON.stringify(message));
  }

  sendWindowMessage(message: WindowClientMessage): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  disconnect(): void {
    this.socket.removeEventListener('message', this.handleMessage);
    this.socket.close();
    this.listeners.clear();
    this.attackListeners.clear();
    this.windowListeners.clear();
    this.snapshot = {
      players: {},
      selfId: null,
    };
    this.latestWindowSnapshot = null;
  }

  private readonly handleMessage = (event: MessageEvent): void => {
    if (typeof event.data !== 'string') {
      return;
    }

    let payload: unknown;

    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    if (!isServerMsg(payload)) {
      return;
    }

    if (this.applyMessage(payload)) {
      this.emitState();
    }
  };

  private applyMessage(message: ServerMsg): boolean {
    switch (message.type) {
      case 'hello':
        this.snapshot = {
          selfId: message.self.id,
          players: toPlayerRecord(message.players),
        };
        return true;
      case 'join':
        this.snapshot = {
          ...this.snapshot,
          players: {
            ...this.snapshot.players,
            [message.player.id]: message.player,
          },
        };
        return true;
      case 'state':
        this.snapshot = {
          ...this.snapshot,
          players: toPlayerRecord(message.players),
        };
        return true;
      case 'leave': {
        const nextPlayers = { ...this.snapshot.players };
        delete nextPlayers[message.id];

        this.snapshot = {
          // The server never sends our own leave back to us, but keep the guard as a safe fallback.
          selfId: this.snapshot.selfId === message.id ? null : this.snapshot.selfId,
          players: nextPlayers,
        };
        return true;
      }
      case 'attack':
        this.emitAttack(message);
        return false;
      case 'window-snapshot':
        this.latestWindowSnapshot = message;
        this.emitWindowMessage(message);
        return false;
      case 'window-open':
      case 'window-move':
      case 'window-resize':
      case 'window-close':
      case 'window-focus':
      case 'window-minimize':
      case 'window-maximize':
        this.emitWindowMessage(message);
        return false;
      default:
        return false;
    }
  }

  private emitAttack(message: AttackMessage): void {
    for (const listener of this.attackListeners) {
      listener(message);
    }
  }

  private emitWindowMessage(message: WindowServerMessage): void {
    for (const listener of this.windowListeners) {
      listener(message);
    }
  }

  private emitState(): void {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}

function resolvePartyHost(): string {
  const configuredHost = import.meta.env.VITE_PARTYKIT_HOST?.trim();

  if (configuredHost) {
    return configuredHost;
  }

  if (import.meta.env.DEV) {
    return LOCAL_PARTYKIT_HOST;
  }

  return window.location.host;
}

function toPlayerRecord(players: PlayerState[]): Record<string, PlayerState> {
  return players.reduce<Record<string, PlayerState>>((record, player) => {
    record[player.id] = player;
    return record;
  }, {});
}