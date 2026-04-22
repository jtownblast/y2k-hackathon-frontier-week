# Stick Fighter — Frontend Scaffold Design

**Date:** 2026-04-22
**Status:** Approved (pending implementation)
**Scope:** Frontend-only app shell. Multiplayer server + sprite animations land in a separate branch and will integrate with this shell when merged.

## Context

WLHNIHTBLTAH OS (Win98-style web desktop) already ships six apps registered via `src/apps/registry.ts`. We're adding a seventh: **Stick Fighter**, a multiplayer stick-figure brawler backed by PartyKit rooms.

The animation templates (`stickfigure_*_template.svg`) and the PartyKit server (`party/server.ts`, `partykit.json`) live on a separate branch that will merge in later. This spec covers only the desktop app shell that the integration branch will plug into.

## Goals

- Register a new "Stick Fighter" app on the desktop, following existing patterns.
- Provide a **Lobby** view: create a room or join an existing one by ID.
- Provide a **Room** view: shareable room ID, empty stage, keyboard input.
- Capture WASD / Space / K inputs while the window is focused, route them through a single seam.
- Ship nothing that will conflict with the animation/PartyKit branch when it merges.

## Non-goals

- No `party/` folder, no `partykit.json`, no server code — all from the other branch.
- No `partysocket` / `partykit/client` dependency added yet — the other branch picks the client.
- No sprite rendering, animation logic, gravity, or collision detection.
- No username / color picker / identity UI — the other branch will add identity when it wires the socket.
- No persistence (rooms are ephemeral; no localStorage of IDs).

## User-facing surface

### Lobby view (entry state — `roomId === null`)

```
┌─ Stick Fighter ────────────────────── [_][□][X] ─┐
│                                                  │
│   Create a new room   [ Create ]                 │
│                                                  │
│   - or -                                         │
│                                                  │
│   Join existing:  [________]  [ Join ]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

- **Create** generates a new 6-character base36 room ID and transitions to the Room view.
- **Join** accepts a pasted ID (trimmed, case-insensitive, validated as 6 alphanumeric chars). Invalid IDs show an inline error; valid IDs transition to the Room view.

### Room view (`roomId !== null`)

```
┌─ Stick Fighter — Room: abc123 ──────── [_][□][X] ─┐
│  Room: abc123    [ Copy ID ]    [ Leave ]         │
├───────────────────────────────────────────────────┤
│                                                   │
│           (empty stage — animations               │
│            will render here after                 │
│            the other PR merges)                   │
│                                                   │
├───────────────────────────────────────────────────┤
│  Controls: W A S D · Space · K       Players: 1   │
└───────────────────────────────────────────────────┘
```

- Window title reflects the room ID (`Stick Fighter — Room: abc123`).
- **Copy ID** writes the room ID to `navigator.clipboard`; shows a transient "Copied!" indicator.
- **Leave** returns to the Lobby and clears state.
- The stage is an empty bordered `<div>` that exposes a ref for the animation layer to attach to.
- Player count defaults to `1` and is a placeholder the integration branch will drive.

## Architecture

### Component layout

```
src/apps/stickFighter/
├── index.tsx          // Default export; routes Lobby vs Room based on store
├── Lobby.tsx          // Create / Join form
├── Room.tsx           // Header + <Stage> + <StatusBar>, mounts keyboard listener
├── Stage.tsx          // Empty bordered div with forwarded ref
├── StatusBar.tsx      // Controls hint + player count
├── state.ts           // Zustand store
├── keyboard.ts        // Focus-scoped keydown/keyup → InputEvent dispatch
└── roomId.ts          // generateRoomId() + isValidRoomId()
```

Mirrors Paint's layout (`Canvas.tsx`, `MenuBar.tsx`, `StatusBar.tsx`, `state.ts`, `tools.tsx`). Each file is small, focused, and independently testable.

### State (Zustand)

```ts
// state.ts
export type InputEvent =
  | { type: 'move'; dir: 'left' | 'right' | 'up' | 'down'; pressed: boolean }
  | { type: 'jump' }
  | { type: 'punch' };

interface StickFighterState {
  roomId: string | null;
  playerCount: number;
  createRoom: () => void;
  joinRoom: (id: string) => void;
  leaveRoom: () => void;
  emitInput: (event: InputEvent) => void;
}
```

The store lives inside the app (not in OS-level state) so closing the window disposes its state naturally on remount.

### Integration seams

Two seams for the future animation/server branch to plug into:

1. **`emitInput(event)`** — currently a no-op (or `console.debug` in dev). The integration branch replaces the body with `socket.send(JSON.stringify(event))`. No other file needs to change.
2. **`<Stage>` ref** — a forwarded ref to the stage `<div>`. The animation layer reads the ref and mounts its SVG/Canvas renderer inside. `Stage.tsx` itself stays ignorant of what goes in there.

### Keyboard handling

`keyboard.ts` exports `useStickFighterKeys(onInput: (e: InputEvent) => void)`:

- Listens on `document`, but **only dispatches if the Stick Fighter root element contains `document.activeElement`** (same pattern used in `src/apps/paint/index.tsx` for Ctrl+Z). This keeps WASD out of Paint, notes, etc.
- `keydown` repeats are suppressed (`e.repeat` guard) so a held key sends one `pressed: true`.
- `keyup` sends `pressed: false` for movement keys; jump/punch fire once on keydown.
- Key map: `W` → up, `A` → left, `S` → down, `D` → right, `Space` → jump, `K` → punch.
- Unmounts cleanly on leave/close.

### Room ID

`roomId.ts`:

- `generateRoomId()` → 6 chars from `[a-z0-9]`, using `crypto.getRandomValues`.
- `isValidRoomId(id)` → trimmed, lowercased, matches `/^[a-z0-9]{6}$/`.

6 chars × 36 = ~2 billion possibilities, plenty for hackathon traffic and short enough to dictate over voice.

## Data flow

```
User keypress
    ↓
document keydown listener (keyboard.ts, focus-gated)
    ↓
InputEvent constructed
    ↓
store.emitInput(event)   ← INTEGRATION SEAM
    ↓
(today: no-op; later: socket.send)
```

```
Lobby "Create" click
    ↓
generateRoomId() → "abc123"
    ↓
store.createRoom()  // sets roomId, resets playerCount
    ↓
<index.tsx> re-renders → shows <Room>
```

## Registry wiring

Three edits to slot the app into the existing OS:

1. **`src/os/types.ts`** — add `'stick-fighter'` to the `AppId` union.
2. **`src/apps/registry.ts`**:
   - Import `StickFighter` from `'./stickFighter'`.
   - Import icon from `'../assets/icons/msagent-3.png'`.
   - Add registry entry: `title: 'Stick Fighter'`, `defaultSize: { width: 640, height: 480 }`.
   - Append `'stick-fighter'` to `DESKTOP_ORDER`.
3. **`src/assets/icons/msagent-3.png`** — download from `https://win98icons.alexmeub.com/icons/png/msagent-3.png`.

## Testing

Manual smoke test (no test harness exists in the repo today):

- Open Stick Fighter from the desktop → Lobby appears.
- Click Create → Room view, title shows `Stick Fighter — Room: <id>`, Copy ID works.
- With the window focused, press W/A/S/D/Space/K → `emitInput` fires with the expected event (verify via `console.debug` or a temporary on-screen log).
- Focus another app (e.g., Paint) → keys no longer dispatch to Stick Fighter.
- Click Leave → back to Lobby, state cleared.
- Reopen Lobby, paste an invalid ID (`x`, `ABCDEFG`, empty) → inline error; valid ID (`abc123`) → Room view.
- Close the window → reopening starts in Lobby with fresh state.

## Integration handoff

When the animation/PartyKit branch merges:

1. Add whichever PartyKit client package it chose to `package.json`.
2. In `state.ts`, `emitInput` sends `socket.send(JSON.stringify(event))` instead of no-op; `createRoom`/`joinRoom` open the socket; `leaveRoom` closes it.
3. In `Room.tsx`, pass the `<Stage>` ref into the animation renderer the other branch exports.
4. Hook server-broadcast player count into `state.playerCount`.

No other files in this spec need to change.

## Open questions

None at design time. Identity/username, max-players cap, and the exact PartyKit client library are deferred to the integration branch.
