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

export type Msg =
  | HelloMessage
  | JoinMessage
  | StateMessage
  | LeaveMessage
  | MoveMessage;

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
    default:
      return false;
  }
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