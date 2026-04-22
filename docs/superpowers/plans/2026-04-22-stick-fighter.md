# Stick Fighter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Stick Fighter" app to the Win98-style desktop: a multiplayer lobby/room scaffold with keyboard input capture, ready to plug into a forthcoming PartyKit server + SVG animation branch.

**Architecture:** New app under `src/apps/stickFighter/` registered via `src/apps/registry.ts`. Two views — a Lobby (create / join) and a Room (shareable ID, empty stage, WASD/Space/K input listener). A local Zustand store owns room state and exposes an `emitInput()` seam that the integration branch will swap for a socket send. No PartyKit client, no sprites, no server code in this plan.

**Tech Stack:** React 18 + TypeScript, Zustand, 98.css, existing app-registration pattern. No test framework exists in this repo; verification is via `npm run build` (strict TS) and manual smoke tests in `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-04-22-stick-fighter-design.md`

---

## File map

**Create:**
- `src/apps/stickFighter/index.tsx` — router: Lobby if `roomId === null`, else Room
- `src/apps/stickFighter/Lobby.tsx` — Create / Join form
- `src/apps/stickFighter/Room.tsx` — header, Stage, StatusBar; mounts keyboard listener
- `src/apps/stickFighter/Stage.tsx` — `forwardRef` bordered div (integration seam for renderer)
- `src/apps/stickFighter/StatusBar.tsx` — controls hint + player count
- `src/apps/stickFighter/state.ts` — Zustand store, `InputEvent` type, `emitInput()` seam
- `src/apps/stickFighter/keyboard.ts` — `useStickFighterKeys(rootRef, onInput)` hook
- `src/apps/stickFighter/roomId.ts` — `generateRoomId()` + `isValidRoomId()`
- `src/assets/icons/msagent-3.png` — downloaded from win98icons.alexmeub.com

**Modify:**
- `src/os/types.ts` — add `'stick-fighter'` to `AppId` union
- `src/apps/registry.ts` — import component + icon, register, append to `DESKTOP_ORDER`

---

## Conventions used below

- **File paths** are repo-relative from `/Users/sting/Desktop/repos/y2k-hackathon-frontier-week/`.
- **Verification step** after every code change: `npm run build` (runs `tsc -b && vite build`; this is the nearest thing to a type-checked test suite this repo has).
- **Commit after each task.** Use conventional prefixes: `feat:`, `chore:`, `refactor:`. Every commit message ends with the `Co-Authored-By` line like existing commits in `git log`.

---

## Task 1: Scaffold app registration with a placeholder component

**Goal:** Get the app visible on the desktop before writing any logic, so later tasks can iterate with the OS actually launching it. Ends with: icon on desktop, double-click opens a window that says "Stick Fighter".

**Files:**
- Create: `src/apps/stickFighter/index.tsx`
- Create: `src/assets/icons/msagent-3.png` (download)
- Modify: `src/os/types.ts` (add AppId)
- Modify: `src/apps/registry.ts` (add entry + DESKTOP_ORDER)

- [ ] **Step 1: Download the icon**

```bash
curl -fsSL -o src/assets/icons/msagent-3.png https://win98icons.alexmeub.com/icons/png/msagent-3.png
file src/assets/icons/msagent-3.png
```

Expected output from `file`: `src/assets/icons/msagent-3.png: PNG image data, 32 x 32, ...` (dimensions may vary slightly; key is `PNG image data`).

- [ ] **Step 2: Create the placeholder component**

Create `src/apps/stickFighter/index.tsx`:

```tsx
export default function StickFighter() {
  return (
    <div className="p-4">
      Stick Fighter (scaffold)
    </div>
  );
}
```

- [ ] **Step 3: Add `'stick-fighter'` to the AppId union**

Edit `src/os/types.ts`. Replace:

```ts
export type AppId =
  | 'my-computer'
  | 'recycle-bin'
  | 'paint'
  | 'limewire'
  | 'internet-explorer'
  | 'windows-media-player';
```

With:

```ts
export type AppId =
  | 'my-computer'
  | 'recycle-bin'
  | 'paint'
  | 'limewire'
  | 'internet-explorer'
  | 'windows-media-player'
  | 'stick-fighter';
```

- [ ] **Step 4: Register the app in `src/apps/registry.ts`**

Edit `src/apps/registry.ts`. Add two imports near the existing ones:

```ts
import StickFighter from './stickFighter';
import stickFighterIcon from '../assets/icons/msagent-3.png';
```

Add one entry to the `APPS` record (after the last existing entry, before the closing `}`):

```ts
  'stick-fighter':        { title: 'Stick Fighter',        icon: stickFighterIcon, component: StickFighter,       defaultSize: { width: 640, height: 480 } },
```

Append `'stick-fighter'` to `DESKTOP_ORDER` (after `'windows-media-player'`):

```ts
export const DESKTOP_ORDER: AppId[] = [
  'my-computer',
  'recycle-bin',
  'paint',
  'limewire',
  'internet-explorer',
  'windows-media-player',
  'stick-fighter',
];
```

- [ ] **Step 5: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds with no errors. If TS complains about unused vars or missing module, revisit Steps 2–4.

- [ ] **Step 6: Smoke test in browser**

Run:

```bash
npm run dev
```

Open the printed localhost URL. Verify:
1. A "Stick Fighter" icon (Mr. Agent character) appears on the desktop after the last app.
2. Double-click it → a window opens titled "Stick Fighter" containing the text "Stick Fighter (scaffold)".
3. Close the window.

Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/apps/stickFighter/index.tsx src/assets/icons/msagent-3.png src/os/types.ts src/apps/registry.ts
git commit -m "$(cat <<'EOF'
feat(stick-fighter): register app with placeholder component

Adds the Stick Fighter entry to the AppId union, desktop registry,
and icon assets. Component is an inert placeholder; lobby/room
logic lands in follow-up commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Room ID utility

**Goal:** Small pure module for generating + validating 6-char base36 room IDs.

**Files:**
- Create: `src/apps/stickFighter/roomId.ts`

- [ ] **Step 1: Create the module**

Create `src/apps/stickFighter/roomId.ts`:

```ts
const ID_LENGTH = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'; // 36 chars
const ID_PATTERN = /^[a-z0-9]{6}$/;

export function generateRoomId(): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function normalizeRoomId(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidRoomId(input: string): boolean {
  return ID_PATTERN.test(normalizeRoomId(input));
}
```

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Sanity-check generation in the browser console (optional but recommended)**

Run `npm run dev`, open the app's devtools console, and run:

```js
// Paste the function body or import it — quickest: just eyeball behavior via the Lobby later.
```

Skip if pressed for time; Task 4 exercises it end-to-end.

- [ ] **Step 4: Commit**

```bash
git add src/apps/stickFighter/roomId.ts
git commit -m "$(cat <<'EOF'
feat(stick-fighter): add room ID generator and validator

6-char base36 IDs via crypto.getRandomValues; normalizer trims and
lowercases; validator enforces exactly [a-z0-9]{6}.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Zustand store + InputEvent type

**Goal:** Define the app's state machine and the `emitInput()` seam. No UI yet — consumers arrive in later tasks.

**Files:**
- Create: `src/apps/stickFighter/state.ts`

- [ ] **Step 1: Create the store**

Create `src/apps/stickFighter/state.ts`:

```ts
import { create } from 'zustand';
import { generateRoomId, isValidRoomId, normalizeRoomId } from './roomId';

export type InputEvent =
  | { type: 'move'; dir: 'left' | 'right' | 'up' | 'down'; pressed: boolean }
  | { type: 'jump' }
  | { type: 'punch' };

interface StickFighterStore {
  roomId: string | null;
  playerCount: number;

  createRoom: () => void;
  joinRoom: (id: string) => boolean;
  leaveRoom: () => void;
  emitInput: (event: InputEvent) => void;
}

export const useStickFighter = create<StickFighterStore>((set) => ({
  roomId: null,
  playerCount: 1,

  createRoom: () => {
    set({ roomId: generateRoomId(), playerCount: 1 });
  },

  joinRoom: (id) => {
    if (!isValidRoomId(id)) return false;
    set({ roomId: normalizeRoomId(id), playerCount: 1 });
    return true;
  },

  leaveRoom: () => {
    set({ roomId: null, playerCount: 1 });
  },

  emitInput: (event) => {
    // Integration seam: the PartyKit branch replaces this body with
    //   socket.send(JSON.stringify(event))
    // Keeping a log in dev makes manual smoke tests verifiable.
    if (import.meta.env.DEV) {
      console.debug('[stick-fighter] input', event);
    }
  },
}));
```

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds. If `import.meta.env.DEV` errors on type, the vite/client types should cover it — no fix needed in typical Vite setups; if it does, replace with `process.env.NODE_ENV !== 'production'` (but the build should pass as-is since `vite/client` types are pulled in by the app).

- [ ] **Step 3: Commit**

```bash
git add src/apps/stickFighter/state.ts
git commit -m "$(cat <<'EOF'
feat(stick-fighter): add Zustand store with input event seam

Store owns roomId, playerCount, and lifecycle actions. emitInput() is
a dev-log no-op today; the forthcoming PartyKit branch will swap its
body for socket.send without touching consumers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Lobby view

**Goal:** Build the "Create / Join" screen. After this task, the store wires up end-to-end: clicking Create advances to a roomId state (verified via the router in Task 9; for now the placeholder `index.tsx` doesn't render Lobby — we'll temporarily mount it for smoke testing below).

**Files:**
- Create: `src/apps/stickFighter/Lobby.tsx`

- [ ] **Step 1: Create the component**

Create `src/apps/stickFighter/Lobby.tsx`:

```tsx
import { useState } from 'react';
import { useStickFighter } from './state';

export default function Lobby() {
  const createRoom = useStickFighter((s) => s.createRoom);
  const joinRoom = useStickFighter((s) => s.joinRoom);

  const [joinInput, setJoinInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = () => {
    const ok = joinRoom(joinInput);
    if (!ok) {
      setError('Room IDs are 6 letters or digits (e.g. abc123).');
      return;
    }
    setError(null);
    setJoinInput('');
  };

  return (
    <div
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#c0c0c0',
        height: '100%',
      }}
    >
      <fieldset>
        <legend>Create a new room</legend>
        <button type="button" onClick={createRoom}>
          Create
        </button>
      </fieldset>

      <div style={{ textAlign: 'center', opacity: 0.75 }}>— or —</div>

      <fieldset>
        <legend>Join existing</legend>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={joinInput}
            onChange={(e) => {
              setJoinInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
            placeholder="abc123"
            maxLength={6}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={handleJoin} disabled={!joinInput.trim()}>
            Join
          </button>
        </div>
        {error && (
          <div style={{ color: '#a00', marginTop: 8, fontSize: 12 }}>{error}</div>
        )}
      </fieldset>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Temporary smoke test — mount Lobby in the placeholder**

Edit `src/apps/stickFighter/index.tsx` to temporarily render Lobby directly:

```tsx
import Lobby from './Lobby';

export default function StickFighter() {
  return <Lobby />;
}
```

Run `npm run dev`, open Stick Fighter, and verify:
1. Two fieldsets appear: "Create a new room" and "Join existing".
2. Click **Create** → open devtools console, check the store (or re-open devtools and inspect via `useStickFighter.getState()` in console) — `roomId` should now be a 6-char string.
3. Reload the page (resets state). Type `xx` in the join input, click **Join** → inline error appears.
4. Type `abc123`, click **Join** → no error, input clears.
5. Pressing Enter in the input also triggers Join.

Stop the dev server. Leave `index.tsx` as-is for now; Task 9 replaces it with the proper router.

- [ ] **Step 4: Commit**

```bash
git add src/apps/stickFighter/Lobby.tsx src/apps/stickFighter/index.tsx
git commit -m "$(cat <<'EOF'
feat(stick-fighter): add Lobby view with create/join flow

Uses 98.css fieldset styling. Join validates via the store; invalid
IDs surface an inline error and pressing Enter in the input submits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Stage component (integration seam)

**Goal:** A dumb bordered div that forwards its ref. The animation branch will render into it.

**Files:**
- Create: `src/apps/stickFighter/Stage.tsx`

- [ ] **Step 1: Create the component**

Create `src/apps/stickFighter/Stage.tsx`:

```tsx
import { forwardRef } from 'react';

const Stage = forwardRef<HTMLDivElement>(function Stage(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minHeight: 0,
        margin: 8,
        border: '2px inset #c0c0c0',
        background: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontStyle: 'italic',
        userSelect: 'none',
      }}
    >
      (empty stage — animations will render here after the other PR merges)
    </div>
  );
});

export default Stage;
```

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/stickFighter/Stage.tsx
git commit -m "$(cat <<'EOF'
feat(stick-fighter): add Stage placeholder with forwarded ref

Exposes a ref so the forthcoming animation layer can mount its renderer
into the stage without touching parent components.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Status bar

**Goal:** Small footer showing controls hint + player count.

**Files:**
- Create: `src/apps/stickFighter/StatusBar.tsx`

- [ ] **Step 1: Create the component**

Create `src/apps/stickFighter/StatusBar.tsx`:

```tsx
interface StatusBarProps {
  playerCount: number;
}

export default function StatusBar({ playerCount }: StatusBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 8px',
        borderTop: '1px solid #808080',
        background: '#c0c0c0',
        fontSize: 12,
      }}
    >
      <span>Controls: W A S D · Space · K</span>
      <span>Players: {playerCount}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/stickFighter/StatusBar.tsx
git commit -m "$(cat <<'EOF'
feat(stick-fighter): add StatusBar showing controls and player count

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Keyboard hook

**Goal:** A React hook that translates keydown/keyup on a focused root element into `InputEvent`s.

**Files:**
- Create: `src/apps/stickFighter/keyboard.ts`

- [ ] **Step 1: Create the hook**

Create `src/apps/stickFighter/keyboard.ts`:

```ts
import { useEffect, type RefObject } from 'react';
import type { InputEvent } from './state';

type Direction = 'left' | 'right' | 'up' | 'down';

const MOVE_KEYS: Record<string, Direction> = {
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

export function useStickFighterKeys(
  rootRef: RefObject<HTMLElement>,
  onInput: (event: InputEvent) => void,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();

      if (k in MOVE_KEYS) {
        e.preventDefault();
        onInput({ type: 'move', dir: MOVE_KEYS[k], pressed: true });
        return;
      }
      if (k === ' ' || e.code === 'Space') {
        e.preventDefault();
        onInput({ type: 'jump' });
        return;
      }
      if (k === 'k') {
        e.preventDefault();
        onInput({ type: 'punch' });
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in MOVE_KEYS) {
        e.preventDefault();
        onInput({ type: 'move', dir: MOVE_KEYS[k], pressed: false });
      }
    };

    root.addEventListener('keydown', handleKeyDown);
    root.addEventListener('keyup', handleKeyUp);
    return () => {
      root.removeEventListener('keydown', handleKeyDown);
      root.removeEventListener('keyup', handleKeyUp);
    };
  }, [rootRef, onInput]);
}
```

Notes for the implementer:
- Listeners are attached to the root element (not `document`), so the element must have `tabIndex={0}` and be focused — Task 8's `Room.tsx` handles that.
- `e.repeat` guard ensures a held key only sends one `pressed: true` until `keyup`.
- `e.preventDefault()` on Space prevents the page from scrolling.
- `onInput` should be a stable callback (wrap in `useCallback` or read from a Zustand selector that returns the raw action reference, which is stable by default).

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/stickFighter/keyboard.ts
git commit -m "$(cat <<'EOF'
feat(stick-fighter): add keyboard hook for WASD/Space/K

Scoped to a focused root element via tabIndex (wired in Room.tsx).
Suppresses key-repeat, preventDefaults Space, and emits typed
InputEvents into the caller.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Room view

**Goal:** Compose Stage + StatusBar + keyboard hook into a focused room screen with header (ID, copy, leave).

**Files:**
- Create: `src/apps/stickFighter/Room.tsx`

- [ ] **Step 1: Create the component**

Create `src/apps/stickFighter/Room.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import Stage from './Stage';
import StatusBar from './StatusBar';
import { useStickFighter } from './state';
import { useStickFighterKeys } from './keyboard';

export default function Room() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const roomId = useStickFighter((s) => s.roomId);
  const playerCount = useStickFighter((s) => s.playerCount);
  const leaveRoom = useStickFighter((s) => s.leaveRoom);
  const emitInput = useStickFighter((s) => s.emitInput);

  const [copied, setCopied] = useState(false);

  // Auto-focus the root on mount so keyboard input works immediately.
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useStickFighterKeys(rootRef, emitInput);

  const handleCopy = useCallback(async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail in insecure contexts; fall back to a selection.
      const ta = document.createElement('textarea');
      ta.value = roomId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [roomId]);

  if (!roomId) return null; // Parent should not render Room without a roomId.

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#c0c0c0',
        outline: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          borderBottom: '1px solid #808080',
        }}
      >
        <strong>Room:</strong>
        <code
          style={{
            padding: '2px 6px',
            border: '1px inset #c0c0c0',
            background: '#fff',
          }}
        >
          {roomId}
        </code>
        <button type="button" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={leaveRoom}>
          Leave
        </button>
      </div>

      <Stage ref={stageRef} />
      <StatusBar playerCount={playerCount} />
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/stickFighter/Room.tsx
git commit -m "$(cat <<'EOF'
feat(stick-fighter): add Room view composing stage, status, and input

Header shows the room ID with copy-to-clipboard (with an execCommand
fallback for insecure contexts) and a leave button. Root div is
tabIndex=0 and auto-focused so the keyboard hook captures input.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Wire the router in `index.tsx`

**Goal:** Replace the temporary `index.tsx` (which currently renders Lobby directly) with the proper router that flips between Lobby and Room based on the store.

**Files:**
- Modify: `src/apps/stickFighter/index.tsx`

- [ ] **Step 1: Replace the component**

Overwrite `src/apps/stickFighter/index.tsx` with:

```tsx
import Lobby from './Lobby';
import Room from './Room';
import { useStickFighter } from './state';

export default function StickFighter() {
  const roomId = useStickFighter((s) => s.roomId);
  return roomId === null ? <Lobby /> : <Room />;
}
```

- [ ] **Step 2: Verify the build passes**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/stickFighter/index.tsx
git commit -m "$(cat <<'EOF'
feat(stick-fighter): route between Lobby and Room via store

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: End-to-end smoke test

**Goal:** Run through every user flow in a real browser. This is the acceptance gate for the whole plan.

No code changes in this task — it's pure verification.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the printed localhost URL. Open browser devtools (Console tab).

- [ ] **Step 2: Verify desktop registration**

- The Stick Fighter icon (Mr. Agent) is visible on the desktop, after Windows Media Player.
- The icon label reads "Stick Fighter".

- [ ] **Step 3: Verify Lobby view**

- Double-click the Stick Fighter icon.
- Window opens titled "Stick Fighter" (the window chrome title — not the room header).
- Inside the window: a "Create a new room" fieldset with a Create button, a "— or —" separator, and a "Join existing" fieldset with input + Join button.

- [ ] **Step 4: Verify Create flow**

- Click **Create**.
- Lobby disappears, Room view appears.
- Header shows `Room: <6-char id>` (e.g. `Room: k9x2p1`).
- Clicking **Copy ID** flashes "Copied!" and the clipboard contains the ID (paste into the URL bar to confirm; or check `await navigator.clipboard.readText()` in devtools).

- [ ] **Step 5: Verify keyboard input**

- With the Room window focused, press **W** — console logs `[stick-fighter] input {type: 'move', dir: 'up', pressed: true}`.
- Release **W** — console logs `{type: 'move', dir: 'up', pressed: false}`.
- Press and hold **D** — exactly one `pressed: true` log (repeat suppressed). Release → one `pressed: false`.
- Press **Space** — logs `{type: 'jump'}`. Page does not scroll.
- Press **K** — logs `{type: 'punch'}`.
- Verify A → left, S → down.

- [ ] **Step 6: Verify focus scoping**

- With Stick Fighter still open, double-click Paint from the desktop.
- Paint's window takes focus.
- Press **W** — no `[stick-fighter]` log appears.
- Click back onto the Stick Fighter window — **W** starts logging again.

- [ ] **Step 7: Verify Leave flow**

- Click **Leave**. Room disappears, Lobby reappears.
- Press **W** — no log (Lobby has no keyboard hook).

- [ ] **Step 8: Verify Join flow**

- Paste an invalid ID (e.g. `xy`) in the Join input → click **Join** → inline error appears.
- Paste `ABC123` (uppercase, mixed case, etc.) → click **Join** → Room opens with `Room: abc123` (normalized).
- Press **Enter** in the input after typing another valid ID — also advances.

- [ ] **Step 9: Verify fresh-state on reopen**

- Click **Leave** → close the window (X button).
- Double-click the desktop icon again → Lobby appears (not the previous Room).

- [ ] **Step 10: Final build check**

Stop the dev server. Run:

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 11: Commit (if anything changed) and done**

If the smoke test revealed no bugs, no commit is needed — the plan is complete.

If fixes were required, commit them with a descriptive message and re-run Step 10.

---

## Post-plan: integration handoff

When the animation/PartyKit branch merges:

1. Install the PartyKit client library that branch chose (`partysocket` is typical): `npm i partysocket`.
2. In `state.ts`, replace `emitInput`'s body with a socket send; open the socket inside `createRoom` / `joinRoom`; close in `leaveRoom`. Hook the socket's broadcast-player-count message into `set({ playerCount: n })`.
3. In `Room.tsx`, pass `stageRef` into whatever renderer the other branch exports. No other changes needed.

No file created in this plan needs structural changes to integrate — only `state.ts` body and a `Room.tsx` renderer mount.
