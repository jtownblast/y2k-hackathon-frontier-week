import PartySocket from 'partysocket';

import {
  isServerMsg,
  type ActionName,
  type Facing,
  type MoveMessage,
  type PlayerState,
  type ServerMsg,
} from './messages';
import { getRoomKey, isValidRoomKey } from './room';

export type PartyStateSnapshot = {
  players: Record<string, PlayerState>;
  selfId: string | null;
};

type StateListener = (snapshot: PartyStateSnapshot) => void;

export class PartyClient {
  readonly roomKey: string;

  private readonly socket: PartySocket;
  private readonly listeners = new Set<StateListener>();
  private snapshot: PartyStateSnapshot = {
    players: {},
    selfId: null,
  };

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

  disconnect(): void {
    this.socket.removeEventListener('message', this.handleMessage);
    this.socket.close();
    this.listeners.clear();
    this.snapshot = {
      players: {},
      selfId: null,
    };
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

    this.applyMessage(payload);
    this.emitState();
  };

  private applyMessage(message: ServerMsg): void {
    switch (message.type) {
      case 'hello':
        this.snapshot = {
          selfId: message.self.id,
          players: toPlayerRecord(message.players),
        };
        break;
      case 'join':
        this.snapshot = {
          ...this.snapshot,
          players: {
            ...this.snapshot.players,
            [message.player.id]: message.player,
          },
        };
        break;
      case 'state':
        this.snapshot = {
          ...this.snapshot,
          players: toPlayerRecord(message.players),
        };
        break;
      case 'leave': {
        const nextPlayers = { ...this.snapshot.players };
        delete nextPlayers[message.id];

        this.snapshot = {
          // The server never sends our own leave back to us, but keep the guard as a safe fallback.
          selfId: this.snapshot.selfId === message.id ? null : this.snapshot.selfId,
          players: nextPlayers,
        };
        break;
      }
      default:
        break;
    }
  }

  private emitState(): void {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}

function resolvePartyHost(): string {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '127.0.0.1:1999';
  }

  return window.location.host;
}

function toPlayerRecord(players: PlayerState[]): Record<string, PlayerState> {
  return players.reduce<Record<string, PlayerState>>((record, player) => {
    record[player.id] = player;
    return record;
  }, {});
}