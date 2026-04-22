import type * as Party from "partykit/server";

export type Facing = "left" | "right";
export type ActionName = "idle" | "walk" | "jump" | "attack";

export type PlayerState = {
  id: string;
  x: number;
  y: number;
  color: string;
  facing: Facing;
  action: ActionName;
  frameIndex: number;
};

type HelloMessage = {
  type: "hello";
  self: PlayerState;
  players: PlayerState[];
};

type JoinMessage = {
  type: "join";
  player: PlayerState;
};

type StateMessage = {
  type: "state";
  players: PlayerState[];
};

type LeaveMessage = {
  type: "leave";
  id: string;
};

export type MoveMessage = {
  type: "move";
  x: number;
  y: number;
  facing: Facing;
  action: ActionName;
  frameIndex: number;
};

export type Msg =
  | HelloMessage
  | JoinMessage
  | StateMessage
  | LeaveMessage
  | MoveMessage;

const BROADCAST_INTERVAL_MS = 33;
const MAX_INBOUND_MESSAGE_CHARACTERS = 512;
const MAX_FRAME_INDEX = 31;
const NORMALIZED_WORLD_MIN = 0;
const NORMALIZED_WORLD_MAX = 1;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function colorFromId(id: string): string {
  return `hsl(${hashString(id) % 360} 75% 55%)`;
}

function createSpawnPosition(): Pick<PlayerState, "x" | "y"> {
  return {
    x: Math.random(),
    y: Math.random(),
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export default class Server implements Party.Server {
  private readonly players = new Map<string, PlayerState>();
  private dirty = false;
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {}

  async onConnect(connection: Party.Connection): Promise<void> {
    const player: PlayerState = {
      id: connection.id,
      color: colorFromId(connection.id),
      ...createSpawnPosition(),
      facing: "right",
      action: "idle",
      frameIndex: 0,
    };

    this.players.set(connection.id, player);
    this.ensureBroadcastInterval();

    connection.send(
      JSON.stringify({
        type: "hello",
        self: player,
        players: [...this.players.values()],
      } satisfies HelloMessage)
    );

    this.room.broadcast(
      JSON.stringify({ type: "join", player } satisfies JoinMessage),
      [connection.id]
    );
  }

  async onMessage(
    message: string | ArrayBuffer,
    sender: Party.Connection
  ): Promise<void> {
    if (typeof message !== "string") {
      return;
    }

    if (message.length > MAX_INBOUND_MESSAGE_CHARACTERS) {
      return;
    }

    let payload: unknown;

    try {
      payload = JSON.parse(message);
    } catch {
      return;
    }

    if (!isMoveMessage(payload)) {
      return;
    }

    const player = this.players.get(sender.id);

    if (!player) {
      return;
    }

    player.x = clamp(payload.x, NORMALIZED_WORLD_MIN, NORMALIZED_WORLD_MAX);
    player.y = clamp(payload.y, NORMALIZED_WORLD_MIN, NORMALIZED_WORLD_MAX);
    player.facing = payload.facing;
    player.action = payload.action;
    player.frameIndex = clamp(payload.frameIndex, 0, MAX_FRAME_INDEX);
    this.dirty = true;
  }

  async onClose(connection: Party.Connection): Promise<void> {
    const removed = this.players.delete(connection.id);

    if (removed) {
      this.room.broadcast(
        JSON.stringify({ type: "leave", id: connection.id } satisfies LeaveMessage)
      );
    }

    if (this.players.size === 0) {
      this.stopBroadcastInterval();
    }
  }

  private ensureBroadcastInterval(): void {
    if (this.broadcastInterval !== null) {
      return;
    }

    this.broadcastInterval = setInterval(() => {
      if (!this.dirty) {
        return;
      }

      this.room.broadcast(
        JSON.stringify({
          type: "state",
          players: [...this.players.values()],
        } satisfies StateMessage)
      );
      this.dirty = false;
    }, BROADCAST_INTERVAL_MS);
  }

  private stopBroadcastInterval(): void {
    if (this.broadcastInterval === null) {
      return;
    }

    clearInterval(this.broadcastInterval);
    this.broadcastInterval = null;
    this.dirty = false;
  }
}

function isMoveMessage(value: unknown): value is MoveMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "move" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFacing(value.facing) &&
    isActionName(value.action) &&
    isNonNegativeInteger(value.frameIndex)
  );
}

function isFacing(value: unknown): value is Facing {
  return value === "left" || value === "right";
}

function isActionName(value: unknown): value is ActionName {
  return value === "idle" || value === "walk" || value === "jump" || value === "attack";
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}