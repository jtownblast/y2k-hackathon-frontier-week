# PartyKit Animation/Action Sync Plan (`partysyncanim.md`)

## 1. Overview

Extend the existing PartyKit sync surface so remote peers visually mirror the **current animation/action** and **facing direction** of the source player, in addition to the position they already mirror. The local player's physics, controls, input handling, RAF loop, sprite rendering, and broadcast cadence stay **byte-for-byte unchanged** — this plan only widens the wire payload and the remote-render path. PartyKit remains a dumb relay (no server-authoritative physics, no rollback, no interpolation/prediction beyond the trivial "draw what the source said it was doing").

## 2. Current state (recap)

- **Local sim** (`src/os/DesktopStickFigure.tsx`): mutable `player` ref with `x, y, vx, vy, facing, state, frameIndex, animTime, animDone, grounded, groundedOn`. RAF tick runs `updateStateFromInput → updatePhysics → tickAnimation → updateStateAfterPhysics`.
- **Animation states**: `idle | walk | jump | attack` (one sprite-sheet row each; idle/walk loop, jump/attack one-shot).
- **Input**: `KeyA`/`KeyD` move + flip facing, `Space` jump (grounded), `Enter` attack (grounded). `blur` clears keys.
- **Sync today** (`src/net/messages.ts`, `party/server.ts`):
  - `PlayerState = { id, x, y, color }` (normalized 0..1 coords).
  - Inbound `move { x, y }`. Outbound `hello | join | state | leave`.
  - Server clamps to `[0,1]`, dirty-flag broadcast at ~30 Hz.
- **Remote render**: tinted placeholder + frame `(row 0, col 0)` at the remote `(x, y)`. No facing, no animation, no action mirroring.

## 3. Wire protocol changes

### 3.1 `PlayerState` — additive fields

| Field | Type | Required | Semantics |
|---|---|---|---|
| `facing` | `'left' \| 'right'` | yes | Mirror sprite horizontally on remote render. |
| `action` | `'idle' \| 'walk' \| 'jump' \| 'attack'` | yes | Sprite-sheet row to draw. Matches local `AnimationName`. |
| `frameIndex` | `number` (int, ≥ 0) | yes | Authoritative current frame within the action's row. Server clamps to `[0, 31]` defensively. |

**Why `frameIndex` and not a timestamp**: client `performance.now()` is not shared and clock skew between tabs/peers would make `actionStartedAt` diff-based playback drift. `frameIndex` is already the unit the local animator uses (`tickAnimation` increments it), it survives dropped messages without recomputation, and a late joiner receives the *current* frame in the snapshot rather than having to extrapolate from a past timestamp. Cost: ~1 small int per player per broadcast (~30 Hz). Acceptable.

**Deferred / not on the wire (yet)**:
- `vx`, `vy`, `grounded`, `groundedOn` — only useful for prediction/dead-reckoning, which is out of scope.
- `animTime` (residual ms inside a frame) — sub-frame parity is not worth the bytes given the 30 Hz broadcast rate already aligns with the slowest animation (`idle` 200 ms/frame ≈ 6 broadcasts per frame).
- `animDone` — derivable remotely from `frameIndex >= ANIMATIONS[action].frames - 1` for non-loop actions.

### 3.2 Type snippets

**Before** — `src/net/messages.ts` & `party/server.ts` (mirrored):

```ts
export type PlayerState = {
  id: string;
  x: number;
  y: number;
  color: string;
};

export type MoveMessage = {
  type: 'move';
  x: number;
  y: number;
};
```

**After**:

```ts
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

// Renamed from MoveMessage — same channel, wider payload.
export type MoveMessage = {
  type: 'move';
  x: number;
  y: number;
  facing: Facing;
  action: ActionName;
  frameIndex: number;
};
```

`HelloMessage`, `JoinMessage`, `StateMessage`, `LeaveMessage` are unchanged structurally; they just carry the wider `PlayerState`. The `Msg` union shape stays the same.

The `isPlayerState` / `isMoveMessage` runtime guards in `messages.ts` and `server.ts` must be widened to validate the three new fields (string-literal union check for `facing`/`action`, finite non-negative int check for `frameIndex`).

## 4. Client send-side changes

**Location**: `src/os/DesktopStickFigure.tsx` — only `maybeBroadcastMove` and the `usePartySendMove` signature change.

- **Trigger events** (broadcast at most once per `BROADCAST_INTERVAL_MS = 34`):
  1. **Every tick** the existing position-changed guard already covers movement.
  2. **Action transition**: when `setState(next)` fires (state machine change). Treat this as "force-send next tick" by resetting `lastBroadcast{X,Y,Action,Facing,FrameIndex} = NaN/null` so the throttle still applies but the next allowed slot will fire even if `(x,y)` did not change.
  3. **Facing flip**: same force-send rule as action transition.
- **Throttling rule**: keep the current `BROADCAST_INTERVAL_MS = 34` (~29 Hz). Do **not** send per-frame; the existing cadence is sufficient because `frameIndex` for the slowest-changing loop (`idle`, 200 ms/frame) only ticks ~5 Hz, and the fastest (`attack`, 60 ms/frame) ticks ~16 Hz — well under our 30 Hz cap.
- **Change-detection** is widened from `(x, y)` to `(x, y, facing, action, frameIndex)`.
- **Local-feel guarantee**: the broadcast happens **after** `update(dt)` and **after** `render()`-equivalent state mutation, exactly like today. No new awaits, no new sync points, no input-loop changes. The broadcast is fire-and-forget on the existing `PartyClient.sendMove` channel.

**Hook signature change** — `src/net/useParty.ts`:

```ts
// before
export function usePartySendMove(): (x: number, y: number) => void;
// after
export function usePartySendMove(): (
  x: number,
  y: number,
  facing: Facing,
  action: ActionName,
  frameIndex: number,
) => void;
```

`PartyClient.sendMove` in `src/net/client.ts` widens identically and serializes the full payload.

## 5. Client receive-side changes

**Store** (`src/net/usePartyStore.ts`): no shape change beyond `PlayerState` widening — still `Record<string, PlayerState>` keyed by id. `setSnapshot` keeps spreading server snapshots.

**Remote render** (`DesktopStickFigure.tsx` → `drawRemotePlayer`): replace the current single-frame placeholder with the same `drawImage` path the local player uses, parameterized by the remote `PlayerState`:

```ts
const animation = ANIMATIONS[remote.action];
const sx = remote.frameIndex * FRAME_W;
const sy = animation.row * FRAME_H;
// then mirror exactly the local facing branch (translate + scale(-1,1) when facing === 'left').
```

Clamp `remote.frameIndex` to `[0, animation.frames - 1]` defensively before computing `sx` (guards against a malformed peer or a client/server frames-table mismatch).

**Explicit no-smoothing stance**:
- No interpolation between snapshots. The remote sprite snaps to whatever `(x, y, action, frameIndex, facing)` the latest snapshot contains. At ~30 Hz this is visually acceptable for the PoC and matches the "minimal sync" philosophy locked in Cycle 1/2.
- No client-side animation advancement for remote players. We do **not** run `tickAnimation` for remote peers; the source player's authoritative `frameIndex` is the only driver. This trades smoothness for correctness (a dropped/late snapshot just briefly stalls the remote sprite on its last reported frame, which is preferable to drifting into a desynced action).
- No prediction. No rollback. No reconciliation. Out of scope.

## 6. Server changes

**File**: `y2k-repo/party/server.ts`. Keep the server dumb — it stores and relays the wider payload with minimal validation.

- **Spawn defaults** in `onConnect`: `facing: 'right'`, `action: 'idle'`, `frameIndex: 0` added to the player record.
- **`onMessage` (`move` handler)**:
  - Extend `isMoveMessage` to require `facing` ∈ `{'left','right'}`, `action` ∈ `{'idle','walk','jump','attack'}`, `frameIndex` finite non-negative number.
  - Clamp `frameIndex` to `[0, 31]` (loose upper bound; tighter would couple the server to the client's `ANIMATIONS` table).
  - Existing `x`/`y` clamp to `[0, 1]` is unchanged.
  - On valid message: write all five fields onto the stored player and set `dirty = true`.
  - Invalid messages are dropped silently (current behavior).
- **Broadcast loop**: unchanged. Still 33 ms dirty-flag flush of the full `state` snapshot.
- **No new message types.** No new server-to-server logic. No alarms.

## 7. Migration / rollout steps (work plan for next cycle)

Each op is sized for one subagent invocation. Execute sequentially.

| # | Op | Agent | Description |
|---|---|---|---|
| 1 | Widen wire types + guards | GPTWorker | Update `y2k-repo/party/server.ts` (`PlayerState`, `MoveMessage`, `isMoveMessage`, `onConnect` defaults, `onMessage` clamping). Update `y2k-repo/src/net/messages.ts` to mirror, including `isPlayerState` / `isServerMsg` runtime guards. No client-render changes yet. Verify `npx tsc -b` clean and `npm run build` green. |
| 2 | Widen client send path | GPTWorker | Update `PartyClient.sendMove` in `src/net/client.ts` and `usePartySendMove` in `src/net/useParty.ts` to accept the five-field payload. Wire `DesktopStickFigure.maybeBroadcastMove` to pass `player.facing`, `player.state`, `player.frameIndex`. Add force-send-on-action-transition + force-send-on-facing-flip via `lastBroadcast*` reset. Local feel must be unchanged — verify by manual single-tab play. |
| 3 | Render remote action + facing | GPTWorker | Replace `drawRemotePlayer` placeholder body with the sprite-row + frame-index + facing-mirror path described in §5. Keep the tinted underlay only as the unloaded-sheet fallback. |
| 4 | SonnetWorker review | SonnetWorker | Verify: (a) no change to local input/physics/animation code paths; (b) wire types match exactly between `party/server.ts` and `src/net/messages.ts`; (c) runtime guards reject malformed peers; (d) remote render uses the same `ANIMATIONS` table as local; (e) `BROADCAST_INTERVAL_MS` cadence preserved; (f) build + type-check green. Produce HIGH/MEDIUM/LOW findings list. |
| 5 | Apply fixes + brief README note | GPTWorker | Apply Op 4 HIGH/MEDIUM items. Append a one-paragraph "now syncs action + facing + frame" note to the existing Multiplayer section of `y2k-repo/README.md`. |

**Routing rationale**: All implementation is GPTWorker. One SonnetWorker review pass before fixes. No GeminiWorker (no research needed; everything is internal). No OpusWorker beyond this plan.

## 8. Edge cases & known gaps

- **Late joiners**: handled for free. `hello` already snapshots `players[]`; the wider `PlayerState` carries each peer's current `action` and `frameIndex` so the new arrival renders them mid-animation immediately. No replay buffer needed.
- **Action cancellation** (e.g., attack interrupted by jump): the source player's state machine is the only authority. When local `setState` flips, the next broadcast carries the new `action` and `frameIndex = 0`. Remote sees a clean snap to the new action. No stuck-in-attack failure mode because the source's `animDone` logic continues to drive transitions locally.
- **Dropped messages**: at ~30 Hz, a single dropped snapshot causes one ~33 ms remote-stall on the last-known frame. The next snapshot fully reconciles. No accumulator state to corrupt.
- **Clock skew**: not applicable — we picked `frameIndex` over timestamps specifically to avoid this.
- **Frames-table drift**: if a future client ships a different `ANIMATIONS` table (e.g., longer `attack`), the receiver's `frameIndex >= frames` defensive clamp prevents a sprite-sheet OOB read but the remote will visually freeze on the last frame of the receiver's table. Acceptable; mitigated by shipping client + server together.
- **Malicious / buggy peer**: server clamps `frameIndex`; client clamps again on render. String-literal-union guards reject unknown `action`/`facing` values — message dropped, last good snapshot preserved.
- **Reconnect**: existing `PartyClient` reconnect path already re-sends `hello`. Local player will broadcast its current `(x,y,facing,action,frameIndex)` on the next throttled tick, restoring remote view within ~34 ms.

## 9. Out of scope (deferred)

- Input prediction / rollback netcode.
- Client-side interpolation/extrapolation between remote snapshots.
- Server-authoritative physics or action validation (e.g., "you can't attack while airborne").
- Hit detection, damage, knockback, combat outcomes.
- Velocity / grounded sync.
- Name tags, chat, emotes.
- Per-player input event log (we sync state, not inputs).
- Spectator mode, replays, recording.
- Bandwidth optimization (binary packing, delta encoding, snapshot diffing).
- Adaptive broadcast rate.

## 10. Acceptance criteria

Two-tab smoke test on the same `?room=` URL:

1. **Position parity**: walking left/right in tab A moves the silhouette in tab B at roughly the same horizontal position (visual lag ≤ ~1 frame at 30 Hz).
2. **Facing parity**: pressing `D` then `A` in tab A flips the tab B silhouette right then left, with no stuck/inverted facing.
3. **Walk animation**: holding `D` in tab A produces the walk sprite cycle (row 1) in tab B, not the idle row.
4. **Jump animation**: pressing `Space` in tab A shows the jump arc (row 2) in tab B, including the final pose hold while airborne, and resolves back to idle/walk on landing.
5. **Attack animation**: pressing `Enter` in tab A plays the full 6-frame attack (row 3) in tab B exactly once, then returns to idle/walk.
6. **No local-feel regression**: tab A's local player feels identical to pre-change (jump height, walk speed, attack lockout, surface landing) — verified by playing solo with no second tab open.
7. **Late join**: open tab A, perform an attack, then open tab B *during* the attack — tab B renders the in-progress attack at the correct frame within one snapshot tick.
8. **Disconnect**: closing tab A removes its silhouette from tab B (existing `leave` behavior, unaffected).
9. **Build green**: `npm run build` in `y2k-repo` passes; `npx tsc -b` reports no errors.
