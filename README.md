# WLHNIHTBLTAH OS

A Windows 98-style web OS built for a Y2K hackathon. Runs entirely in the browser and hosts a growing set of dApps inside authentic Win98 windows.

## Stack

- **Vite + React 18 + TypeScript** — dev server and bundler
- **Tailwind CSS** (v3, preflight disabled) — layout utilities only
- **[98.css](https://jdan.github.io/98.css/)** — window chrome, buttons, controls
- **Zustand** — window manager + OS state
- **react-rnd** — drag + resize for windows

## Prerequisites

- **Node.js 18+** (any modern LTS works)
- **npm** (ships with Node)

## Setup

```bash
git clone git@github.com:jtownblast/y2k-hackathon-frontier-week.git
cd y2k-hackathon-frontier-week
npm install
```

## Run the dev server

```bash
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`, or the next free port). You should see the boot splash for ~2 seconds, then the desktop.

### Other scripts

```bash
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
```

## Multiplayer (PartyKit)

`npm run dev` starts Vite and `partykit dev` together for the current PoC.

On the first load without a `?room=` query param, the app generates an 8-character room key and updates the URL in place. For a quick smoke test, open that URL in a second tab and move the stick figure in one tab to confirm the remote player appears in the other.

The current sync payload now carries each player's action, facing, and animation frame as well as position, so a remote peer mirrors idle, walk, jump, and attack poses from the latest snapshot without adding interpolation, prediction, or changes to the local physics/control loop.

An explicit "Start a Room" button is deferred for now; the current flow relies on auto-generated room URLs.

## Project structure

```
src/
  main.tsx                     mounts <App/>, imports tailwind + 98.css
  App.tsx                      boot gate → BootScreen / Desktop / ShutDownScreen
  index.css                    tailwind directives + global OS styles
  os/
    types.ts                   AppId + WindowState
    useWindows.ts              zustand store: windows, z-order, focus
    useOS.ts                   zustand store: booted / shutDown / startMenuOpen
    Window.tsx                 react-rnd + 98.css chrome + title bar controls
    WindowManager.tsx          renders all open windows from the store
    ContextMenu.tsx            generic right-click menu (reused)
    Desktop.tsx                teal bg, icon column, routes to WindowManager
    DesktopIcon.tsx            single desktop icon (click/double-click/right-click)
    Taskbar.tsx                Start button + window buttons + clock tray
    StartMenu.tsx              gradient sidebar + items + Programs flyout
    BootScreen.tsx             black "Windows 98" splash + startup sound
    ShutDownScreen.tsx         "It's now safe to turn off your computer"
  apps/
    registry.ts                AppId → { title, icon, component, defaultSize }
    myComputer/  recycleBin/  paint/  limewire/
    internetExplorer/  windowsMediaPlayer/
  assets/
    icons/                     Win98 icons (source: win98icons.alexmeub.com)
    sounds/startup.wav         placeholder silent WAV — swap with a real chime
```

## Adding a new app

1. Create `src/apps/<appName>/index.tsx` exporting a default React component.
2. Drop a 32×32 icon into `src/assets/icons/<app-id>.png` (pull from [win98icons.alexmeub.com](https://win98icons.alexmeub.com/) for consistency).
3. Add the `AppId` to `src/os/types.ts`.
4. Add one entry to `APPS` in `src/apps/registry.ts` and (if it should show on the desktop) append the id to `DESKTOP_ORDER`.

That's it — the Start menu, taskbar, and desktop all read from the registry.

## What works today

Boot splash → desktop, drag + resize windows (from any edge/corner), min/max/close, focus/z-order, cascading, Start menu (with Programs flyout and functional Shut Down), right-click context menus on the desktop and icons, live taskbar clock.

Each app is currently a placeholder (`<AppName> coming soon`). App internals land in follow-up work.
