# Quorum

A smart scheduling platform for organizing group gatherings.

## Project Structure

```
quorum-project/
├── CLAUDE.md                          # Context file for Claude Code sessions
├── README.md                          # This file
├── docs/
│   ├── user-journey.md                # Full user journey (v2)
│   └── elevator-pitch.md             # Product pitch with differentiators
├── diagrams/
│   ├── detailed-flow.mermaid          # Detailed Mermaid flowchart (LR)
│   └── high-level-flow.mermaid        # Simplified high-level flow (LR)
└── prototypes/
    └── scheduling-form.jsx            # React prototype — host scheduling form
```

## Getting Started with Claude Code

1. Install Claude Code: `curl -fsSL https://code.claude.com/install | sh`
2. `cd` into this project directory
3. Run `claude` to start a session
4. Claude will automatically read `CLAUDE.md` for project context

## Key Concepts

- **Quorum** — minimum attendees needed to confirm a gathering
- **Availability sets** — groups of dates paired with time windows
- **Locations as participants** — locations have availability and are matched alongside people
- **Overflow** — excess demand spawns new gatherings from remaining slots
