# Quorum — Scheduling Scenarios

This document catalogs the scheduling scenarios Quorum is designed to handle, ordered from simplest to most complex. Each scenario uses a consistent structure so behavior, constraints, and edge cases are comparable across the full range.

---

## Scenario Template

```
## S-XX: [Name]

**Complexity:** Simple | Moderate | Complex
**Summary:** 1–2 sentence description of the real-world situation.

### Actors
- **Hosts:** count, relationship, time zones
- **Participants:** count, relationship to host(s), time zones

### Event Shape
- **Type:** Single gathering | Recurring series | Limited series
- **Duration:** fixed or range
- **Date/time options:** how many, how generated
- **Locations:** count, type (physical / virtual / hybrid)
- **Format notes:** anything unusual about the venue setup

### Participant Response
- **Selection method:** rank top N, mark all available, calendar overlay, etc.
- **Location preference:** per-slot, global filter, or N/A
- **Constraints surfaced:** calendar conflicts, commute, capacity

### Matching & Confirmation
- **Quorum:** threshold to lock in
- **Capacity:** maximum per gathering
- **Overflow:** on/off, behavior when invoked
- **Tie-breaking:** how the winning slot is chosen when multiple hit quorum

### Resolution
- **Trigger:** what causes the host to be notified (quorum reached)
- **Host lock-in:** host reviews results and confirms (or overrides)
- **Notifications:** who is told what, when (after host confirms)
- **Follow-up:** invitee acceptance, waitlist handling, overflow session creation, calendar invites

### Edge Cases & Open Questions
- Bullet list of anything unresolved or worth calling out
```

---

## S-01: Single Host, Single Gathering, Small Group

**Complexity:** Simple
**Summary:** One person organizes a one-time get-together with a small group, offering a handful of date/time and location options.

### Actors
- **Hosts:** 1 (sole organizer)
- **Participants:** 5–15 invitees, all in the same time zone as the host

### Event Shape
- **Type:** Single gathering
- **Duration:** Fixed (set by host, e.g. 90 min)
- **Date/time options:** 1–3 specific start times, each with 1–3 possible dates (producing 2–9 date/time slots total)
- **Locations:** 1–3 physical venues with known capacity
- **Format notes:** In-person only; each location has its own availability calendar

### Participant Response
- **Selection method:** Invitees see all viable date/time/location combinations and rank their top 3 in preference order
- **Location preference:** Per-slot — an invitee can accept a slot at one location but not another (e.g. too far)
- **Constraints surfaced:** Invitee's own calendar availability shown (green/amber/red) if they've connected their calendar; location availability shown per slot; commute time optionally entered per location

### Matching & Confirmation
- **Quorum:** Host-defined minimum (e.g. 5 of 12 invitees must accept)
- **Capacity:** Host-defined maximum, capped by the physical location's capacity (whichever is lower)
- **Overflow:** Optional. If enabled, once the first slot fills to capacity, a second gathering is automatically offered using the next-best slot from remaining availability
- **Tie-breaking:** If multiple slots reach quorum simultaneously, the slot with the most first-preference votes wins. If still tied, the host's own preference ranking (from Step 2: Rank) is the tiebreaker

### Resolution
- **Trigger:** When the first date/time/location combination reaches the quorum threshold, the **host is notified** and presented with the results for review
- **Host lock-in:** The host reviews the winning slot (and runner-up data) and **confirms** the gathering. The host can also override and select a different slot if they have reason to
- **Notifications:**
  - After host confirmation, invitees who ranked the winning slot are **formally invited** and must accept within a defined timeframe to secure their spot
  - Invitees who did not rank the confirmed slot are notified of the result and can still join up to capacity
  - If overflow is enabled and a second slot also reaches quorum, the host is notified again to confirm an additional gathering
- **Follow-up:**
  - Calendar invites sent to confirmed attendees (with location details)
  - Registration remains open until capacity is reached; once full, a waitlist is established
  - If overflow is enabled, waitlisted invitees are offered the next-best slot and a new quorum cycle begins

### Edge Cases & Open Questions
- **No slot reaches quorum:** What happens? Notify the host to extend the deadline, add more options, or lower the quorum?
- **Quorum reached but host's top preference didn't win:** The algorithm respects participant demand, not host preference. Host preference is only a tiebreaker. Is this the right behavior, or should host preference carry more weight?
- **Invitee ranks a slot at a location that fills to capacity:** Their vote still counts toward quorum for the date/time, but they may be placed at an alternate location for the same slot if one is available
- **Late responses:** If quorum is reached before all invitees respond, does voting close immediately or stay open until a deadline? (Staying open allows the count to grow toward capacity)
- **Single location, single date/time:** Degenerates to a simple RSVP — Quorum still works, it just confirms when N people say yes

---

<!-- Future scenarios to document:

## S-02: Single Host, Single Gathering, Multi-Timezone
## S-03: Co-Hosts, Single Gathering
## S-04: Single Host, Recurring Series
## S-05: Single Host, Limited Series
## S-06: Multiple Co-Hosts, Recurring Series, Multi-Timezone
## S-07: Large-Scale Multi-Host, Multi-Series, Multi-Timezone (the 15×200+ case)

-->
