# CLAUDE.md — Platopia Project Context

## What is Platopia?

Platopia is a **platform** that hosts multiple apps for organizing group experiences. Each app is a self-contained product with its own identity and prototype experiences.

### Apps

| App | Description | Status |
|---|---|---|
| **Quorum** | Smart group scheduling — organize gatherings with quorum-based confirmation, location matching, and overflow support | Active |
| **Trellis** | Content discovery — surface and share interesting content with your community | Coming Soon |

## Architecture: Platform → App → Experience

The project uses a **manifest-driven experience catalog** with two-level navigation:

```
/                              → Platform catalog (app cards)
/app/:appId                    → App page (experience list)
/app/:appId/:expId             → Experience (lazy-loaded)
```

### Key files

| File | Purpose |
|---|---|
| `src/main.jsx` | Entry point — BrowserRouter with three routes |
| `src/catalog/Catalog.jsx` | Platform landing — app cards (Quorum, Trellis, etc.) |
| `src/catalog/AppPage.jsx` | App page — lists experiences for a given app |
| `src/catalog/ExperienceShell.jsx` | Route wrapper — floating back bar + Suspense + lazy load |
| `src/experiences/manifest.js` | Central registry — `APPS` array + `EXPERIENCES` array with lazy `import()` functions |
| `src/shared/styles.js` | Brand constants (COLORS, GRADIENTS, FONTS) |
| `src/shared/icons.jsx` | SVG icon components used in manifest/catalog |

### Folder structure

```
src/
  main.jsx
  shared/
    styles.js
    icons.jsx
  catalog/
    Catalog.jsx
    AppPage.jsx
    ExperienceShell.jsx
  experiences/
    manifest.js
    shared/styles.js          ← proxy re-export for moved experience files
    scheduling/
      HostSchedulingForm.jsx
      InviteeExperience.jsx
      InviteeCalendarExperience.jsx
      HostCombinedForm.jsx
    messaging/                 ← empty scaffold
    social/                    ← empty scaffold
```

### Adding a new experience

1. Create a JSX file in the appropriate app folder (e.g., `src/experiences/scheduling/`)
2. Export a default component that accepts `{ onBack }` prop
3. Add an entry to `src/experiences/manifest.js` with `app: "quorum"` and `load: () => import("./scheduling/File.jsx")`
4. The catalog and routing pick it up automatically

### Adding a new app

1. Add an entry to the `APPS` array in `src/experiences/manifest.js`
2. Create a subfolder under `src/experiences/` for the app's experiences
3. Add experiences referencing the new app ID

### Conventions

- **Inline styles only** — no CSS files, no UI framework
- **Self-contained experiences** — each experience file owns its own state and styles
- **`onBack` prop contract** — every experience receives `onBack` for navigation back to its app page
- **Lazy loading** — experiences are code-split via `React.lazy()` + dynamic `import()`

## Quorum: Core Design Principles

1. **Locations are participants** — locations have their own availability and are matched alongside people and times. Matching is three-dimensional: people × times × places.
2. **Quorum-based confirmation** — events lock in when the minimum attendee threshold is met, not when everyone responds.
3. **Availability sets** — hosts define multiple date/time combinations. Each set pairs a group of dates with a time window.
4. **Overflow gatherings** — if demand exceeds capacity, additional sessions are automatically offered from remaining slots.

## Quorum: Event Types

- **Single event** — one-time gathering with availability sets (dates + time windows)
- **Recurring series** — regular cadence (e.g., "2nd and 4th Thursdays"); invitees vote once
- **Limited series** — set number of sessions over a period (e.g., "twice in 2 weeks")

## Key Docs

- `docs/user-journey.md` — Quorum user journey (v2)
- `docs/elevator-pitch.md` — Quorum product pitch with differentiators
- `diagrams/detailed-flow.mermaid` — detailed Mermaid flowchart
- `diagrams/high-level-flow.mermaid` — simplified flow

## Tech Stack

- React 18 + Vite 6
- React Router v7 (react-router-dom)
- Inline styles only — no CSS framework
- No backend architecture decided yet
