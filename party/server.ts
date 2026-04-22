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

export type AttackMessage = {
  type: "attack";
  x: number;
  y: number;
  facing: Facing;
};

type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WindowSyncState = {
  windowId: string;
  appId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  isMinimized: boolean;
  isMaximized: boolean;
  preMaxBounds?: WindowBounds;
};

export type WindowSnapshotMessage = {
  type: "window-snapshot";
  windows: WindowSyncState[];
};

export type WindowOpenMessage = {
  type: "window-open";
  windowId: string;
  appId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  isMinimized: boolean;
  isMaximized: boolean;
  preMaxBounds?: WindowBounds;
};

export type WindowMoveMessage = {
  type: "window-move";
  windowId: string;
  x: number;
  y: number;
};

export type WindowResizeMessage = {
  type: "window-resize";
  windowId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WindowCloseMessage = {
  type: "window-close";
  windowId: string;
};

export type WindowFocusMessage = {
  type: "window-focus";
  windowId: string;
  z: number;
};

export type WindowMinimizeMessage = {
  type: "window-minimize";
  windowId: string;
};

export type WindowMaximizeMessage = {
  type: "window-maximize";
  windowId: string;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  preMaxBounds?: WindowBounds;
};

type WindowClientMessage =
  | WindowOpenMessage
  | WindowMoveMessage
  | WindowResizeMessage
  | WindowCloseMessage
  | WindowFocusMessage
  | WindowMinimizeMessage
  | WindowMaximizeMessage;

type CanonicalWindowState = Omit<WindowSyncState, "z"> & {
  ownerSessionId: string;
};

export type Msg =
  | HelloMessage
  | JoinMessage
  | StateMessage
  | LeaveMessage
  | MoveMessage
  | AttackMessage
  | WindowSnapshotMessage
  | WindowClientMessage;

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
  private readonly windows = new Map<string, CanonicalWindowState>();
  private windowOrder: string[] = [];
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

    connection.send(JSON.stringify(this.createWindowSnapshot()));

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

    const player = this.players.get(sender.id);

    if (!player) {
      return;
    }

    if (isAttackMessage(payload)) {
      this.room.broadcast(
        JSON.stringify({
          type: "attack",
          x: clamp(payload.x, NORMALIZED_WORLD_MIN, NORMALIZED_WORLD_MAX),
          y: clamp(payload.y, NORMALIZED_WORLD_MIN, NORMALIZED_WORLD_MAX),
          facing: payload.facing,
        } satisfies AttackMessage),
        [sender.id]
      );
      return;
    }

    if (isWindowOpenMessage(payload)) {
      this.windows.set(payload.windowId, {
        windowId: payload.windowId,
        appId: payload.appId,
        x: payload.x,
        y: payload.y,
        width: clampWindowDimension(payload.width),
        height: clampWindowDimension(payload.height),
        isMinimized: payload.isMinimized,
        isMaximized: payload.isMaximized,
        preMaxBounds: sanitizeWindowBounds(payload.preMaxBounds),
        ownerSessionId: sender.id,
      });
      this.moveWindowToTop(payload.windowId);
      this.broadcastWindowMessage(sender.id, this.toWindowOpenMessage(payload.windowId));
      return;
    }

    if (isWindowMoveMessage(payload)) {
      const window = this.windows.get(payload.windowId);

      if (!window) {
        return;
      }

      window.x = payload.x;
      window.y = payload.y;
      this.broadcastWindowMessage(sender.id, {
        type: "window-move",
        windowId: payload.windowId,
        x: window.x,
        y: window.y,
      });
      return;
    }

    if (isWindowResizeMessage(payload)) {
      const window = this.windows.get(payload.windowId);

      if (!window) {
        return;
      }

      window.x = payload.x;
      window.y = payload.y;
      window.width = clampWindowDimension(payload.width);
      window.height = clampWindowDimension(payload.height);
      this.broadcastWindowMessage(sender.id, {
        type: "window-resize",
        windowId: payload.windowId,
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
      });
      return;
    }

    if (isWindowCloseMessage(payload)) {
      if (!this.windows.delete(payload.windowId)) {
        return;
      }

      this.windowOrder = this.windowOrder.filter((windowId) => windowId !== payload.windowId);
      this.broadcastWindowMessage(sender.id, payload);
      return;
    }

    if (isWindowFocusMessage(payload)) {
      const window = this.windows.get(payload.windowId);

      if (!window) {
        return;
      }

      window.isMinimized = false;
      this.moveWindowToTop(payload.windowId);
      this.broadcastWindowMessage(sender.id, {
        type: "window-focus",
        windowId: payload.windowId,
        z: this.getWindowZ(payload.windowId),
      });
      return;
    }

    if (isWindowMinimizeMessage(payload)) {
      const window = this.windows.get(payload.windowId);

      if (!window) {
        return;
      }

      window.isMinimized = true;
      this.moveWindowToBottom(payload.windowId);
      this.broadcastWindowMessage(sender.id, payload);
      return;
    }

    if (isWindowMaximizeMessage(payload)) {
      const window = this.windows.get(payload.windowId);

      if (!window) {
        return;
      }

      window.isMaximized = payload.isMaximized;
      window.x = payload.x;
      window.y = payload.y;
      window.width = clampWindowDimension(payload.width);
      window.height = clampWindowDimension(payload.height);
      window.preMaxBounds = sanitizeWindowBounds(payload.preMaxBounds);
      this.broadcastWindowMessage(sender.id, {
        type: "window-maximize",
        windowId: payload.windowId,
        isMaximized: window.isMaximized,
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
        preMaxBounds: window.preMaxBounds,
      });
      return;
    }

    if (!isMoveMessage(payload)) {
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

  private createWindowSnapshot(): WindowSnapshotMessage {
    return {
      type: "window-snapshot",
      windows: this.windowOrder
        .map((windowId) => this.toWindowSyncState(windowId))
        .filter((window): window is WindowSyncState => window !== null),
    };
  }

  private toWindowOpenMessage(windowId: string): WindowOpenMessage {
    const window = this.windows.get(windowId);

    if (!window) {
      throw new Error(`Unknown window ${windowId}`);
    }

    return {
      type: "window-open",
      windowId: window.windowId,
      appId: window.appId,
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
      z: this.getWindowZ(windowId),
      isMinimized: window.isMinimized,
      isMaximized: window.isMaximized,
      preMaxBounds: window.preMaxBounds,
    };
  }

  private toWindowSyncState(windowId: string): WindowSyncState | null {
    const window = this.windows.get(windowId);

    if (!window) {
      return null;
    }

    return {
      windowId: window.windowId,
      appId: window.appId,
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
      z: this.getWindowZ(windowId),
      isMinimized: window.isMinimized,
      isMaximized: window.isMaximized,
      preMaxBounds: window.preMaxBounds,
    };
  }

  private moveWindowToTop(windowId: string): void {
    this.windowOrder = [...this.windowOrder.filter((id) => id !== windowId), windowId];
  }

  private moveWindowToBottom(windowId: string): void {
    this.windowOrder = [windowId, ...this.windowOrder.filter((id) => id !== windowId)];
  }

  private getWindowZ(windowId: string): number {
    const index = this.windowOrder.indexOf(windowId);
    return index < 0 ? 0 : index;
  }

  private broadcastWindowMessage(senderId: string, message: WindowClientMessage): void {
    this.room.broadcast(JSON.stringify(message), [senderId]);
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

function isAttackMessage(value: unknown): value is AttackMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "attack" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFacing(value.facing)
  );
}

function isWindowOpenMessage(value: unknown): value is WindowOpenMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "window-open" &&
    typeof value.windowId === "string" &&
    typeof value.appId === "string" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    isNonNegativeInteger(value.z) &&
    typeof value.isMinimized === "boolean" &&
    typeof value.isMaximized === "boolean" &&
    (value.preMaxBounds === undefined || isWindowBounds(value.preMaxBounds))
  );
}

function isWindowMoveMessage(value: unknown): value is WindowMoveMessage {
  return (
    isRecord(value) &&
    value.type === "window-move" &&
    typeof value.windowId === "string" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y)
  );
}

function isWindowResizeMessage(value: unknown): value is WindowResizeMessage {
  return (
    isRecord(value) &&
    value.type === "window-resize" &&
    typeof value.windowId === "string" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height)
  );
}

function isWindowCloseMessage(value: unknown): value is WindowCloseMessage {
  return isRecord(value) && value.type === "window-close" && typeof value.windowId === "string";
}

function isWindowFocusMessage(value: unknown): value is WindowFocusMessage {
  return (
    isRecord(value) &&
    value.type === "window-focus" &&
    typeof value.windowId === "string" &&
    isNonNegativeInteger(value.z)
  );
}

function isWindowMinimizeMessage(value: unknown): value is WindowMinimizeMessage {
  return (
    isRecord(value) &&
    value.type === "window-minimize" &&
    typeof value.windowId === "string"
  );
}

function isWindowMaximizeMessage(value: unknown): value is WindowMaximizeMessage {
  return (
    isRecord(value) &&
    value.type === "window-maximize" &&
    typeof value.windowId === "string" &&
    typeof value.isMaximized === "boolean" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    (value.preMaxBounds === undefined || isWindowBounds(value.preMaxBounds))
  );
}

function isWindowBounds(value: unknown): value is WindowBounds {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height)
  );
}

function sanitizeWindowBounds(value: WindowBounds | undefined): WindowBounds | undefined {
  if (!value) {
    return undefined;
  }

  return {
    x: value.x,
    y: value.y,
    width: clampWindowDimension(value.width),
    height: clampWindowDimension(value.height),
  };
}

function clampWindowDimension(value: number): number {
  return Math.max(1, value);
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