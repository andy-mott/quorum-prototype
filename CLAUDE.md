# CLAUDE.md — Quorum Project Context

## What is Quorum?

Quorum is a smart scheduling platform for organizing group gatherings. It combines event description, collaborative scheduling, and confirmation/booking into one flow. The name comes from the core mechanic: events confirm when a minimum attendance threshold (quorum) is reached.

## Core Design Principles

1. **Locations are participants** — locations have their own availability and are matched alongside people and times. Matching is three-dimensional: people × times × places.
2. **Quorum-based confirmation** — events lock in when the minimum attendee threshold is met, not when everyone responds.
3. **Availability sets** — hosts define multiple date/time combinations. Each set pairs a group of dates with a time window (e.g., "Mon–Thu 9 AM–2 PM" + "Sat 4 PM–8 PM").
4. **Overflow gatherings** — if demand exceeds capacity, additional sessions are automatically offered from remaining slots.

## Event Types

- **Single event** — one-time gathering with availability sets (dates + time windows)
- **Recurring series** — regular cadence (e.g., "2nd and 4th Thursdays"); invitees vote once
- **Limited series** — set number of sessions over a period (e.g., "twice in 2 weeks")

## User Flow (Happy Path)

Host creates draft → sets duration → indicates locations → defines availability sets → Quorum matches viable options → publishes → invitees rank top 3 + mark unavailable times → quorum reached → host locks in → formal invitations sent (accept within timeframe) → registration until capacity → waitlist → overflow if enabled

## Key Docs

- `docs/user-journey.md` — full user journey (v2)
- `docs/elevator-pitch.md` — product pitch with differentiators
- `diagrams/detailed-flow.mermaid` — detailed Mermaid flowchart
- `diagrams/high-level-flow.mermaid` — simplified flow
- `prototypes/scheduling-form.jsx` — React prototype of the host scheduling form

## Current Scope vs. Future

**Current:** 2 managed locations with stored availability, virtual/hybrid support, availability sets, overflow gatherings, post-publish option removal

**Future:** Expanded location database (e.g., all public libraries), agentic AI for real-time availability queries & booking, post-publish option addition

## Tech Notes

- The scheduling form prototype is a React component (JSX) using inline styles
- No external UI framework yet — open to discussion
- No backend architecture decided yet
