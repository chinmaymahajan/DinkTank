# Pickle Admin

Free, open-source pickleball session manager. Runs entirely in the browser — no server, no sign-up, no cost. Just open the app and start organizing games.

**[Launch App →](https://chinmaymahajan.github.io/PickleAdmin/)**

---

## What It Does

Pickle Admin handles the tedious parts of running pickleball sessions: assigning players to courts, rotating teams fairly, managing timers, and displaying matchups on a big screen. You bring the players — it handles the rest.

## Features

### Session Management
- Create, resume, and delete sessions
- Switch between sessions from the header bar
- Reset rounds while keeping your player and court roster
- Full session state persists across page refreshes (timer, active round, break state)
- Per-league session cache survives league switching

### Two Modes

**Manual** — Generate rounds one at a time. Optional countdown timer with buzzer.

**Auto** — Set total rounds, round duration, and break time. The app generates all rounds upfront and auto-advances through them with configurable breaks.

### Players & Courts
- Add/remove with inline inputs (type + Enter)
- Import players from Excel or CSV with auto-detection and preview
- Fair bye distribution — tracks who sat out so everyone plays equally
- In auto mode, roster changes automatically regenerate future rounds
- Limits: 100 players, 30 courts, 10 sessions

### Drag-and-Drop Player Management
- Drag players between court slots to swap positions
- Drag bench (bye) players onto court slots to assign them
- Visual feedback: drag-over highlights, dragging opacity, grab cursors
- Conflict detection highlights duplicate player assignments in red and blocks saving
- Works alongside the existing typeahead search — both produce identical state
- Disabled in read-only mode and while saving
- Save/discard workflow applies to drag changes the same as typeahead edits

### Partner Uniqueness Optimization
- Tracks partnership history across all rounds in a session
- When generating rounds, evaluates all possible team splits per court and picks the one with the fewest repeat partner pairings
- Greedy minimization: scores each split by summing historical partner counts, selects the lowest
- Graceful degradation — when all pairings are exhausted in long sessions, picks the least-repeated
- Applies identically to both auto and manual round generation
- Preserves bye fairness and backward compatibility

### TV Display
- Full-screen dark overlay for projectors and big screens
- Responsive layout scales from 1 court to 30 courts
- 4K-ready with dedicated scaling for 2560px+ displays
- Shows "Up Next" matchups during breaks
- Smooth round transition animations

### Timer & Sound
- Configurable round and break durations
- Visual countdown: normal → amber warning → red pulse → expired
- Train horn sound effect (5 seconds) when a round ends
- Hide/show toggle without stopping the timer
- Timer survives page refresh and league switching
- Background tab catch-up: fast-forwards through elapsed periods when tab regains focus

### Error Monitoring (Sentry)
- Sentry SDK integration with browser tracing, session replay, and breadcrumbs
- All frontend errors are captured via a structured logger (`log.app`, `log.round`, `log.player`, etc.)
- Logger categories: APP, API, LEAGUE, PLAYER, COURT, ROUND, DISPLAY, TV, DEV, TIMER
- Errors forward to `Sentry.captureException`; warnings become Sentry breadcrumbs
- Log level controlled via `localStorage.logLevel` (debug / info / warn / error / none)
- DSN provided at build time via `VITE_SENTRY_DSN` environment variable
- Disabled in development, enabled in production builds

### Other
- Dark mode (persisted)
- Dev tools: seed 26 players + 6 courts for quick testing

---

## Getting Started

The app is deployed and ready to use:

**[https://chinmaymahajan.github.io/PickleAdmin/](https://chinmaymahajan.github.io/PickleAdmin/)**

All data is stored in your browser's localStorage. Nothing leaves your device.

### Run Locally

```bash
cd frontend
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build

```bash
cd frontend
npm run build
```

Output goes to `frontend/dist/`.

### Tests

```bash
cd frontend
npm test
```

The test suite includes:
- Unit tests for components, services, and utilities
- Integration tests for multi-component user flows (league selection, session persistence, roster changes, auto-mode timer)
- Property-based tests for drag-and-drop invariants (using fast-check)
- Backend API integration tests using supertest

---

## Project Structure

```
pickle-admin/
├── frontend/              # React SPA (the deployed app)
│   └── src/
│       ├── api/           # localStorage-backed data layer (with partner uniqueness)
│       ├── components/    # UI components (RoundDisplay, DraggablePlayerSlot, TVDisplay, etc.)
│       ├── types/         # TypeScript interfaces
│       ├── utils/         # Logger, sound effects, helpers
│       └── sentry.ts      # Sentry SDK initialization
├── backend/               # Express API (reference implementation, not deployed)
│   └── src/
│       ├── services/      # Business logic (round generation, bye fairness, partner optimization)
│       ├── data/          # In-memory data store
│       ├── routes/        # REST endpoints
│       └── models/        # Data models
├── .kiro/specs/           # Feature specifications (requirements, design, tasks)
└── .github/workflows/     # GitHub Pages deployment (with Sentry DSN injection)
```

The backend folder contains the original Express API with the same business logic. It's kept as a reference but is not required — the frontend includes a complete localStorage-backed implementation of all the same algorithms (including partner uniqueness optimization).

## Tech Stack

- React 18, TypeScript, Vite
- Sentry (error monitoring, tracing, session replay)
- Jest + React Testing Library + fast-check (property-based testing)
- GitHub Pages (static deployment)
- Web Audio API (timer sound effects)

## License

MIT
