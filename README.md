# Platopia

A platform for organizing group experiences, built as a manifest-driven app catalog with lazy-loaded prototype experiences.

## Apps

- **Quorum** — Smart group scheduling with quorum-based confirmation, location matching, and overflow support
- **Trellis** — Content discovery *(coming soon)*

## Project Structure

```
platopia-prototype/
├── CLAUDE.md                          # Context file for Claude Code sessions
├── README.md                          # This file
├── docs/
│   ├── user-journey.md                # Quorum user journey (v2)
│   └── elevator-pitch.md             # Quorum product pitch
├── diagrams/
│   ├── detailed-flow.mermaid          # Detailed Mermaid flowchart (LR)
│   └── high-level-flow.mermaid        # Simplified high-level flow (LR)
└── src/
    ├── main.jsx                       # Entry point (BrowserRouter + Routes)
    ├── shared/
    │   ├── styles.js                  # Brand constants (COLORS, GRADIENTS, FONTS)
    │   └── icons.jsx                  # SVG icon components
    ├── catalog/
    │   ├── Catalog.jsx                # Platform landing (app cards)
    │   ├── AppPage.jsx                # App page (experience list)
    │   └── ExperienceShell.jsx        # Route wrapper (back bar + Suspense)
    └── experiences/
        ├── manifest.js                # Central registry (APPS + EXPERIENCES)
        └── scheduling/
            ├── HostSchedulingForm.jsx
            ├── InviteeExperience.jsx
            ├── InviteeCalendarExperience.jsx
            └── HostCombinedForm.jsx
```

## Getting Started

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`

## Navigation

```
/                          → Platform catalog (app cards)
/app/quorum                → Quorum app (scheduling experiences)
/app/quorum/host-combined  → Individual experience
```

## Key Concepts (Quorum)

- **Quorum** — minimum attendees needed to confirm a gathering
- **Availability sets** — groups of dates paired with time windows
- **Locations as participants** — locations have availability and are matched alongside people
- **Overflow** — excess demand spawns new gatherings from remaining slots
