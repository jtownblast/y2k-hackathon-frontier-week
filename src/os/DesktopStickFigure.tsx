import { useEffect, useRef } from 'react';

import sprite from '../assets/sprites/stickfigure_filled.svg';
import type { PlayerState } from '../net/messages';
import { usePartySendMove } from '../net/useParty';
import { usePartyStore } from '../net/usePartyStore';

type AnimationName = 'idle' | 'walk' | 'jump' | 'attack';
type Facing = 'left' | 'right';

interface Props {
  floorOffset?: number;
}

interface AnimationDefinition {
  row: number;
  frames: number;
  frameMs: number;
  loop: boolean;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  state: AnimationName;
  frameIndex: number;
  animTime: number;
  animDone: boolean;
  grounded: boolean;
  groundedOn: string | null;
}

type SurfaceKind = 'floor' | 'icon' | 'taskbar' | 'window';
type SurfaceFace = 'top' | 'bottom';

interface Surface {
  id: string;
  kind: SurfaceKind;
  face: SurfaceFace;
  x: number;
  y: number;
  width: number;
  vx: number;
  vy: number;
  passThrough: boolean;
}

const FRAME_W = 64;
const FRAME_H = 64;
const DRAW_SCALE = 2;
const PLAYER_DRAW_W = FRAME_W * DRAW_SCALE;
const PLAYER_DRAW_H = FRAME_H * DRAW_SCALE;

const GRAVITY = 0.0018;
const JUMP_VELOCITY = -0.6 * Math.SQRT2;
const WALK_SPEED = 0.12;
const AIR_SPEED = WALK_SPEED * 0.6;
const MAX_FALL_SPEED = 1.15;
const BROADCAST_INTERVAL_MS = 34;
const SURFACE_FLOOR_ID = 'fallback-floor';
const SURFACE_SNAP_TOLERANCE = 1;
const STICK_FIGURE_Z_INDEX = 2147483000;

const ANIMATIONS: Record<AnimationName, AnimationDefinition> = {
  idle: { row: 0, frames: 4, frameMs: 200, loop: true },
  walk: { row: 1, frames: 8, frameMs: 80, loop: true },
  jump: { row: 2, frames: 6, frameMs: 90, loop: false },
  attack: { row: 3, frames: 6, frameMs: 60, loop: false },
};

function clampNormalizedPosition(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function normalizePosition(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }

  return clampNormalizedPosition(value / maxValue);
}

function denormalizePosition(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }

  return clampNormalizedPosition(value) * maxValue;
}

function shouldIgnoreKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export default function DesktopStickFigure({ floorOffset = 0 }: Props) {
  const selfId = usePartyStore((state) => state.selfId);
  const players = usePartyStore((state) => state.players);
  const sendMove = usePartySendMove();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const sendMoveRef = useRef(sendMove);
  const selfIdRef = useRef<string | null>(selfId);
  const remotePlayersRef = useRef<PlayerState[]>([]);

  useEffect(() => {
    sendMoveRef.current = sendMove;
  }, [sendMove]);

  useEffect(() => {
    selfIdRef.current = selfId;
    remotePlayersRef.current = Object.values(players).filter((player) => player.id !== selfId);
  }, [players, selfId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const keys: Record<string, boolean> = Object.create(null);
    const pressed = new Set<string>();
    const player: Player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      facing: 'right',
      state: 'jump',
      frameIndex: 0,
      animTime: 0,
      animDone: false,
      grounded: false,
      groundedOn: null,
    };

    let hasSpawned = false;
    let sheetReady = false;
    let last = performance.now();
    let lastBroadcastAt = 0;
    let lastBroadcastX = Number.NaN;
    let lastBroadcastY = Number.NaN;
    let lastBroadcastFacing: Facing | null = null;
    let lastBroadcastAction: AnimationName | null = null;
    let lastBroadcastFrameIndex = Number.NaN;
    let lastBroadcastSelfId: string | null = null;
    let surfaceIdCount = 0;
    let lastSurfaceSnapshot = new Map<string, Surface>();
    const ignoredSurfaceIds = new Set<string>();

    const surfaceIds = new WeakMap<Element, Map<string, string>>();

    const sheet = new Image();

    const resetBroadcastSnapshot = () => {
      lastBroadcastX = Number.NaN;
      lastBroadcastY = Number.NaN;
      lastBroadcastFacing = null;
      lastBroadcastAction = null;
      lastBroadcastFrameIndex = Number.NaN;
    };

    const setState = (next: AnimationName) => {
      if (player.state === next) {
        return;
      }

      player.state = next;
      player.frameIndex = 0;
      player.animTime = 0;
      player.animDone = false;
      resetBroadcastSnapshot();
    };

    const setFacing = (next: Facing) => {
      if (player.facing === next) {
        return;
      }

      player.facing = next;
      resetBroadcastSnapshot();
    };

    const getMaxX = () => Math.max(0, canvas.width - PLAYER_DRAW_W);
    const getFloorSurfaceY = () => Math.max(0, canvas.height - floorOffset);
    const getFloorY = () => Math.max(0, getFloorSurfaceY() - PLAYER_DRAW_H);
    const getPlayerLeft = () => player.x;
    const getPlayerHeadY = () => player.y;
    const getPlayerRight = () => player.x + PLAYER_DRAW_W;
    const getPlayerFootY = () => player.y + PLAYER_DRAW_H;

    const isWalkHeld = () => Boolean(keys.KeyA || keys.KeyD);

    const clearPressed = () => {
      pressed.clear();
    };

    const clearKeys = () => {
      for (const code of Object.keys(keys)) {
        keys[code] = false;
      }
      clearPressed();
    };

    const clearGrounded = () => {
      player.grounded = false;
      player.groundedOn = null;
    };

    const getSurfaceSnapY = (surface: Surface) =>
      surface.face === 'bottom' ? surface.y : surface.y - PLAYER_DRAW_H;

    const isPlayerStillSupportedBySurface = (surface: Surface) => {
      if (!rangesOverlap(getPlayerLeft(), getPlayerRight(), surface.x, surface.x + surface.width)) {
        return false;
      }

      const playerAnchorY = surface.face === 'bottom' ? getPlayerHeadY() : getPlayerFootY();
      return Math.abs(playerAnchorY - surface.y) <= SURFACE_SNAP_TOLERANCE;
    };

    const detachFromSurface = () => {
      if (!player.grounded) {
        return;
      }

      clearGrounded();

      if (player.state !== 'jump') {
        setState('jump');
      }
    };

    const getHighestHeadYDuringStep = (prevHeadY: number, prevVy: number, dtMs: number) => {
      if (prevVy >= 0) {
        return prevHeadY;
      }

      const upwardDt = Math.min(dtMs, -prevVy / GRAVITY);
      return prevHeadY + prevVy * upwardDt + 0.5 * GRAVITY * upwardDt * upwardDt;
    };

    const landOnSurface = (surface: Surface) => {
      player.y = getSurfaceSnapY(surface);
      player.vy = 0;
      player.grounded = true;
      player.groundedOn = surface.id;
    };

    const getStoredGroundedSurface = () =>
      player.groundedOn === null ? null : lastSurfaceSnapshot.get(player.groundedOn) ?? null;

    const dropFromSurface = (surface: Surface) => {
      ignoredSurfaceIds.add(surface.id);
      detachFromSurface();
      player.vy = Math.max(player.vy, 0.08);
    };

    const getElementSurfaceId = (element: Element, key: string) => {
      const keyedIds = surfaceIds.get(element);
      const existingId = keyedIds?.get(key);

      if (existingId !== undefined) {
        return existingId;
      }

      const nextId = `${key}-${surfaceIdCount}`;
      surfaceIdCount += 1;

      if (keyedIds === undefined) {
        surfaceIds.set(element, new Map([[key, nextId]]));
      } else {
        keyedIds.set(key, nextId);
      }

      return nextId;
    };

    const sampleSurfaces = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const surfaces: Surface[] = [];
      let hasTaskbarSurface = false;

      const pushSurface = (kind: SurfaceKind, element: Element, face: SurfaceFace = 'top') => {
        if (!(element instanceof HTMLElement)) {
          return;
        }

        const rect = element.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
          return;
        }

        const id = getElementSurfaceId(element, `${kind}:${face}`);
        const x = rect.left - canvasRect.left;
        const y = (face === 'top' ? rect.top : rect.bottom) - canvasRect.top;
        const previousSurface = lastSurfaceSnapshot.get(id);

        surfaces.push({
          id,
          kind,
          face,
          x,
          y,
          width: rect.width,
          vx: previousSurface === undefined ? 0 : x - previousSurface.x,
          vy: previousSurface === undefined ? 0 : y - previousSurface.y,
          passThrough: true,
        });
      };

      for (const element of document.querySelectorAll<HTMLElement>('.taskbar')) {
        hasTaskbarSurface = true;
        pushSurface('taskbar', element);
      }

      for (const element of document.querySelectorAll<HTMLElement>('.window')) {
        // Both window ledges use viewport rects, so the fixed canvas can sample them directly.
        pushSurface('window', element, 'top');
        pushSurface('window', element, 'bottom');
      }

      for (const element of document.querySelectorAll<HTMLElement>('.desktop-icon')) {
        pushSurface('icon', element);
      }

      if (!hasTaskbarSurface) {
        surfaces.push({
          id: SURFACE_FLOOR_ID,
          kind: 'floor',
          face: 'top',
          x: 0,
          y: getFloorSurfaceY(),
          width: canvas.width,
          vx: 0,
          vy: 0,
          passThrough: true,
        });
      }

      lastSurfaceSnapshot = new Map(surfaces.map((surface) => [surface.id, surface] as const));
      return surfaces;
    };

    const updateIgnoredSurfaces = (surfaces: Surface[]) => {
      const playerLeft = getPlayerLeft();
      const playerRight = getPlayerRight();
      const playerHeadY = getPlayerHeadY();
      const playerFootY = getPlayerFootY();

      for (const surfaceId of Array.from(ignoredSurfaceIds)) {
        const surface = surfaces.find((candidate) => candidate.id === surfaceId) ?? null;

        if (surface === null) {
          ignoredSurfaceIds.delete(surfaceId);
          continue;
        }

        if (!rangesOverlap(playerLeft, playerRight, surface.x, surface.x + surface.width)) {
          ignoredSurfaceIds.delete(surfaceId);
          continue;
        }

        const hasClearedSurface =
          surface.face === 'top' ? playerFootY > surface.y : playerHeadY > surface.y;

        if (hasClearedSurface) {
          ignoredSurfaceIds.delete(surfaceId);
        }
      }
    };

    const findTopLandingSurface = (surfaces: Surface[], prevFootY: number, footY: number) => {
      let landingSurface: Surface | null = null;
      const playerLeft = getPlayerLeft();
      const playerRight = getPlayerRight();

      for (const surface of surfaces) {
        if (!surface.passThrough || surface.face !== 'top' || ignoredSurfaceIds.has(surface.id)) {
          continue;
        }

        if (!rangesOverlap(playerLeft, playerRight, surface.x, surface.x + surface.width)) {
          continue;
        }

        if (prevFootY > surface.y || footY < surface.y) {
          continue;
        }

        if (landingSurface === null || surface.y < landingSurface.y) {
          landingSurface = surface;
        }
      }

      return landingSurface;
    };

    const findBottomLandingSurface = (
      surfaces: Surface[],
      prevHeadY: number,
      highestHeadY: number,
    ) => {
      let landingSurface: Surface | null = null;
      const playerLeft = getPlayerLeft();
      const playerRight = getPlayerRight();

      for (const surface of surfaces) {
        if (!surface.passThrough || surface.face !== 'bottom' || ignoredSurfaceIds.has(surface.id)) {
          continue;
        }

        if (!rangesOverlap(playerLeft, playerRight, surface.x, surface.x + surface.width)) {
          continue;
        }

        if (prevHeadY < surface.y || highestHeadY > surface.y) {
          continue;
        }

        if (landingSurface === null || surface.y > landingSurface.y) {
          landingSurface = surface;
        }
      }

      return landingSurface;
    };

    const spawnPlayer = () => {
      player.x = getMaxX() * 0.5;
      player.y = 0;
      player.vx = 0;
      player.vy = 0;
      player.facing = 'right';
      clearGrounded();
      setState('jump');
      hasSpawned = true;
    };

    const resizeCanvas = () => {
      const width = Math.max(1, Math.floor(canvas.clientWidth));
      const height = Math.max(1, Math.floor(canvas.clientHeight));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.imageSmoothingEnabled = false;

      if (!hasSpawned) {
        spawnPlayer();
        return;
      }

      const floorY = getFloorY();
      const surfaces = sampleSurfaces();
      player.x = Math.max(0, Math.min(getMaxX(), player.x));

      const groundedSurface =
        player.groundedOn === null
          ? null
          : surfaces.find((surface) => surface.id === player.groundedOn) ?? null;

      if (groundedSurface !== null && isPlayerStillSupportedBySurface(groundedSurface)) {
        landOnSurface(groundedSurface);

        if (player.state === 'jump') {
          setState(isWalkHeld() ? 'walk' : 'idle');
        }

        return;
      }

      if (groundedSurface !== null) {
        detachFromSurface();
      }

      if (player.y > floorY) {
        const floorSurface = surfaces.reduce<Surface | null>((lowestSurface, surface) => {
          if (surface.face !== 'top') {
            return lowestSurface;
          }

          if (lowestSurface === null || surface.y > lowestSurface.y) {
            return surface;
          }

          return lowestSurface;
        }, null);

        if (floorSurface !== null) {
          landOnSurface(floorSurface);

          if (player.state === 'jump') {
            setState(isWalkHeld() ? 'walk' : 'idle');
          }
        }
      } else if (player.grounded) {
        detachFromSurface();
      }
    };

    const updateFacingAndVelocity = () => {
      const movingLeft = Boolean(keys.KeyA);
      const movingRight = Boolean(keys.KeyD);

      if (movingLeft && !movingRight) {
        setFacing('left');
      } else if (movingRight && !movingLeft) {
        setFacing('right');
      }

      if (player.state === 'attack') {
        player.vx = 0;
        return;
      }

      if (player.state === 'jump') {
        if (movingLeft && !movingRight) {
          player.vx = -AIR_SPEED;
        } else if (movingRight && !movingLeft) {
          player.vx = AIR_SPEED;
        } else {
          player.vx = 0;
        }
        return;
      }

      if (movingLeft && !movingRight) {
        player.vx = -WALK_SPEED;
      } else if (movingRight && !movingLeft) {
        player.vx = WALK_SPEED;
      } else {
        player.vx = 0;
      }
    };

    const updateStateFromInput = () => {
      const jumpPressed = pressed.has('Space');
      const attackPressed = pressed.has('KeyK');
      const dropPressed = pressed.has('ArrowDown') || pressed.has('KeyS');
      const walkHeld = isWalkHeld();
      const groundedSurface = getStoredGroundedSurface();

      updateFacingAndVelocity();

      if (dropPressed && player.grounded && groundedSurface !== null) {
        dropFromSurface(groundedSurface);
        return;
      }

      if ((player.state === 'idle' || player.state === 'walk') && jumpPressed && player.grounded) {
        setState('jump');
        player.vy = groundedSurface?.face === 'bottom' ? Math.abs(JUMP_VELOCITY) : JUMP_VELOCITY;
        clearGrounded();
        return;
      }

      if ((player.state === 'idle' || player.state === 'walk') && attackPressed && player.grounded) {
        setState('attack');
        player.vx = 0;
        return;
      }

      if (player.state === 'attack' || player.state === 'jump') {
        return;
      }

      if (walkHeld) {
        setState('walk');
      } else {
        setState('idle');
      }
    };

    const updatePhysics = (dt: number) => {
      const maxX = getMaxX();
      const surfaces = sampleSurfaces();

      updateIgnoredSurfaces(surfaces);

      player.x += player.vx * dt;
      player.x = Math.max(0, Math.min(maxX, player.x));

      if (player.grounded && player.groundedOn !== null) {
        const groundedSurface = surfaces.find((surface) => surface.id === player.groundedOn) ?? null;

        if (groundedSurface !== null) {
          player.x += groundedSurface.vx;
          player.y += groundedSurface.vy;
          player.x = Math.max(0, Math.min(maxX, player.x));

          if (isPlayerStillSupportedBySurface(groundedSurface)) {
            landOnSurface(groundedSurface);
          } else {
            detachFromSurface();
          }
        } else {
          detachFromSurface();
        }
      }

      if (!player.grounded) {
        const prevHeadY = getPlayerHeadY();
        const prevFootY = getPlayerFootY();
        const prevVy = player.vy;

        player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL_SPEED);
        player.y += player.vy * dt;

        if (prevVy < 0) {
          const highestHeadY = Math.min(
            getPlayerHeadY(),
            getHighestHeadYDuringStep(prevHeadY, prevVy, dt),
          );
          const landingSurface = findBottomLandingSurface(surfaces, prevHeadY, highestHeadY);

          if (landingSurface !== null) {
            landOnSurface(landingSurface);
            return;
          }
        }

        if (player.vy >= 0) {
          const landingSurface = findTopLandingSurface(surfaces, prevFootY, getPlayerFootY());

          if (landingSurface !== null) {
            landOnSurface(landingSurface);
          }
        }
      }
    };

    const updateStateAfterPhysics = () => {
      if (player.state === 'jump' && player.grounded) {
        setState(isWalkHeld() ? 'walk' : 'idle');
        updateFacingAndVelocity();
        return;
      }

      if (player.state === 'attack' && player.animDone) {
        setState(isWalkHeld() ? 'walk' : 'idle');
        updateFacingAndVelocity();
      }
    };

    const tickAnimation = (dt: number) => {
      const animation = ANIMATIONS[player.state];

      player.animTime += dt;
      while (player.animTime >= animation.frameMs) {
        player.animTime -= animation.frameMs;
        player.frameIndex += 1;

        if (player.frameIndex >= animation.frames) {
          if (animation.loop) {
            player.frameIndex = 0;
          } else {
            player.frameIndex = animation.frames - 1;
            player.animDone = true;
            break;
          }
        }
      }
    };

    const update = (dt: number) => {
      updateStateFromInput();
      updatePhysics(dt);
      tickAnimation(dt);
      updateStateAfterPhysics();
      clearPressed();
    };

    const maybeBroadcastMove = (now: number) => {
      const currentSelfId = selfIdRef.current;

      if (currentSelfId !== lastBroadcastSelfId) {
        lastBroadcastSelfId = currentSelfId;
        resetBroadcastSnapshot();
      }

      if (currentSelfId === null || now - lastBroadcastAt < BROADCAST_INTERVAL_MS) {
        return;
      }

      if (
        player.x === lastBroadcastX &&
        player.y === lastBroadcastY &&
        player.facing === lastBroadcastFacing &&
        player.state === lastBroadcastAction &&
        player.frameIndex === lastBroadcastFrameIndex
      ) {
        return;
      }

      sendMoveRef.current(
        normalizePosition(player.x, getMaxX()),
        normalizePosition(getPlayerFootY(), getFloorSurfaceY()),
        player.facing,
        player.state,
        player.frameIndex
      );
      lastBroadcastAt = now;
      lastBroadcastX = player.x;
      lastBroadcastY = player.y;
      lastBroadcastFacing = player.facing;
      lastBroadcastAction = player.state;
      lastBroadcastFrameIndex = player.frameIndex;
    };

    const toRemoteCanvasPosition = (remotePlayer: PlayerState) => ({
      x: denormalizePosition(remotePlayer.x, getMaxX()),
      y: denormalizePosition(remotePlayer.y, getFloorSurfaceY()) - PLAYER_DRAW_H,
    });

    const drawLocalPlaceholder = (dx: number, dy: number) => {
      context.save();
      context.fillStyle = 'rgba(15, 23, 42, 0.25)';
      context.fillRect(dx, dy, PLAYER_DRAW_W, PLAYER_DRAW_H);
      context.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      context.lineWidth = 2;
      context.strokeRect(dx, dy, PLAYER_DRAW_W, PLAYER_DRAW_H);
      context.restore();
    };

    const drawRemotePlaceholder = (remotePlayer: PlayerState) => {
      const { x, y } = toRemoteCanvasPosition(remotePlayer);

      context.save();
      context.globalAlpha = 0.7;
      context.fillStyle = remotePlayer.color;
      context.fillRect(x, y, PLAYER_DRAW_W, PLAYER_DRAW_H);
      context.strokeStyle = 'rgba(15, 23, 42, 0.85)';
      context.lineWidth = 2;
      context.strokeRect(x, y, PLAYER_DRAW_W, PLAYER_DRAW_H);
      context.restore();
    };

    const drawSpriteFrame = (
      action: AnimationName,
      frameIndex: number,
      facing: Facing,
      dx: number,
      dy: number,
    ) => {
      const animation = ANIMATIONS[action];
      const clampedFrameIndex = Math.min(Math.max(frameIndex, 0), animation.frames - 1);
      const sx = clampedFrameIndex * FRAME_W;
      const sy = animation.row * FRAME_H;

      if (!sheetReady || sheet.naturalWidth < sx + FRAME_W || sheet.naturalHeight < sy + FRAME_H) {
        return false;
      }

      if (facing === 'left') {
        context.save();
        context.translate(dx + PLAYER_DRAW_W, dy);
        context.scale(-1, 1);
        context.drawImage(sheet, sx, sy, FRAME_W, FRAME_H, 0, 0, PLAYER_DRAW_W, PLAYER_DRAW_H);
        context.restore();
        return true;
      }

      context.drawImage(sheet, sx, sy, FRAME_W, FRAME_H, dx, dy, PLAYER_DRAW_W, PLAYER_DRAW_H);
      return true;
    };

    const drawPlayer = () => {
      const dx = player.x;
      const dy = player.y;

      if (!drawSpriteFrame(player.state, player.frameIndex, player.facing, dx, dy)) {
        drawLocalPlaceholder(dx, dy);
      }
    };

    const drawRemotePlayer = (remotePlayer: PlayerState) => {
      const { x, y } = toRemoteCanvasPosition(remotePlayer);

      if (!drawSpriteFrame(remotePlayer.action, remotePlayer.frameIndex, remotePlayer.facing, x, y)) {
        drawRemotePlaceholder(remotePlayer);
      }
    };

    const drawRemotePlayers = () => {
      for (const remotePlayer of remotePlayersRef.current) {
        drawRemotePlayer(remotePlayer);
      }
    };

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawRemotePlayers();
      drawPlayer();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardTarget(document.activeElement)) {
        return;
      }

      if (event.code === 'Space' || event.code === 'KeyK' || event.code === 'ArrowDown') {
        event.preventDefault();
      }

      if (!keys[event.code]) {
        pressed.add(event.code);
      }

      keys[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'KeyK' || event.code === 'ArrowDown') {
        event.preventDefault();
      }

      keys[event.code] = false;
    };

    const handleWindowBlur = () => {
      clearKeys();
    };

    const handleSheetLoad = () => {
      sheetReady = true;
    };

    const handleSheetError = () => {
      sheetReady = false;
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      render();
    });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    sheet.addEventListener('load', handleSheetLoad);
    sheet.addEventListener('error', handleSheetError);
    sheet.src = sprite;

    resizeObserver.observe(canvas);
    resizeCanvas();
    render();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;

      update(dt);
      maybeBroadcastMove(now);
      render();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      sheet.removeEventListener('load', handleSheetLoad);
      sheet.removeEventListener('error', handleSheetError);
      clearKeys();
    };
  }, [floorOffset]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: STICK_FIGURE_Z_INDEX,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}