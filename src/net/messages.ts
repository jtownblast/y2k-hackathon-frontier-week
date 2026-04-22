import type { WindowBounds } from '../os/types';

// Keep these wire shapes in sync with ../../party/server.ts.
export type Facing = 'left' | 'right';
export type ActionName = 'idle' | 'walk' | 'jump' | 'attack';

export type PlayerState = {
  id: string;
  x: number;
  y: number;
  color: string;
  facing: Facing;
  action: ActionName;
  frameIndex: number;
};

export type HelloMessage = {
  type: 'hello';
  self: PlayerState;
  players: PlayerState[];
};

export type JoinMessage = {
  type: 'join';
  player: PlayerState;
};

export type StateMessage = {
  type: 'state';
  players: PlayerState[];
};

export type LeaveMessage = {
  type: 'leave';
  id: string;
};

export type MoveMessage = {
  type: 'move';
  x: number;
  y: number;
  facing: Facing;
  action: ActionName;
  frameIndex: number;
};

export type AttackMessage = {
  type: 'attack';
  x: number;
  y: number;
  facing: Facing;
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
  type: 'window-snapshot';
  windows: WindowSyncState[];
};

export type WindowOpenMessage = {
  type: 'window-open';
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
  type: 'window-move';
  windowId: string;
  x: number;
  y: number;
};

export type WindowResizeMessage = {
  type: 'window-resize';
  windowId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WindowCloseMessage = {
  type: 'window-close';
  windowId: string;
};

export type WindowFocusMessage = {
  type: 'window-focus';
  windowId: string;
  z: number;
};

export type WindowMinimizeMessage = {
  type: 'window-minimize';
  windowId: string;
};

export type WindowMaximizeMessage = {
  type: 'window-maximize';
  windowId: string;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  preMaxBounds?: WindowBounds;
};

export type WindowClientMessage =
  | WindowOpenMessage
  | WindowMoveMessage
  | WindowResizeMessage
  | WindowCloseMessage
  | WindowFocusMessage
  | WindowMinimizeMessage
  | WindowMaximizeMessage;

export type WindowServerMessage = WindowSnapshotMessage | WindowClientMessage;

export type Msg =
  | HelloMessage
  | JoinMessage
  | StateMessage
  | LeaveMessage
  | MoveMessage
  | AttackMessage
  | WindowServerMessage;

export type ServerMsg = Exclude<Msg, MoveMessage>;

export function isServerMsg(value: unknown): value is ServerMsg {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'hello':
      return isPlayerState(value.self) && isPlayerStateArray(value.players);
    case 'join':
      return isPlayerState(value.player);
    case 'state':
      return isPlayerStateArray(value.players);
    case 'leave':
      return typeof value.id === 'string';
    case 'attack':
      return isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFacing(value.facing);
    case 'window-snapshot':
      return Array.isArray(value.windows) && value.windows.every(isWindowSyncState);
    case 'window-open':
      return isWindowOpenMessage(value);
    case 'window-move':
      return (
        typeof value.windowId === 'string' &&
        isFiniteNumber(value.x) &&
        isFiniteNumber(value.y)
      );
    case 'window-resize':
      return (
        typeof value.windowId === 'string' &&
        isFiniteNumber(value.x) &&
        isFiniteNumber(value.y) &&
        isFiniteNumber(value.width) &&
        isFiniteNumber(value.height)
      );
    case 'window-close':
    case 'window-minimize':
      return typeof value.windowId === 'string';
    case 'window-focus':
      return typeof value.windowId === 'string' && isNonNegativeInteger(value.z);
    case 'window-maximize':
      return (
        typeof value.windowId === 'string' &&
        typeof value.isMaximized === 'boolean' &&
        isFiniteNumber(value.x) &&
        isFiniteNumber(value.y) &&
        isFiniteNumber(value.width) &&
        isFiniteNumber(value.height) &&
        (value.preMaxBounds === undefined || isWindowBounds(value.preMaxBounds))
      );
    default:
      return false;
  }
}

function isWindowOpenMessage(value: Record<string, unknown>): value is WindowOpenMessage {
  return (
    typeof value.windowId === 'string' &&
    typeof value.appId === 'string' &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    isNonNegativeInteger(value.z) &&
    typeof value.isMinimized === 'boolean' &&
    typeof value.isMaximized === 'boolean' &&
    (value.preMaxBounds === undefined || isWindowBounds(value.preMaxBounds))
  );
}

function isWindowSyncState(value: unknown): value is WindowSyncState {
  return isRecord(value) && isWindowOpenMessage(value);
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

function isPlayerStateArray(value: unknown): value is PlayerState[] {
  return Array.isArray(value) && value.every(isPlayerState);
}

function isPlayerState(value: unknown): value is PlayerState {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    typeof value.color === 'string' &&
    isFacing(value.facing) &&
    isActionName(value.action) &&
    isNonNegativeInteger(value.frameIndex)
  );
}

function isFacing(value: unknown): value is Facing {
  return value === 'left' || value === 'right';
}

function isActionName(value: unknown): value is ActionName {
  return value === 'idle' || value === 'walk' || value === 'jump' || value === 'attack';
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}