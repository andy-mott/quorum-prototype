# Quorum — User Journey (Draft v2)

## Overview

Quorum simplifies the process of organizing group gatherings by combining three core elements into one seamless flow: **event description**, **collaborative scheduling**, and **confirmation & booking**.

A key design principle is that **locations are treated like participants** — they have their own availability, and Quorum matches people, times, and places together automatically.

---

## Phase 1: Create a Draft Gathering (Host)

The host begins by creating a draft gathering with the following basics:

- **Event type** — single event or series
- **Title & description** — what the gathering is about
- **Host(s)** — one or more organizers
- **Format** — in-person, virtual, or hybrid
- **Attendance thresholds**
  - *Quorum* — the minimum number of attendees needed to confirm the event
  - *Capacity* — the maximum number of attendees allowed
- **Multiple gatherings toggle** — whether the host is open to spinning up additional gatherings from overflow demand

---

## Phase 2: Define Scheduling & Location Options (Host)

### Step 1 — Set the duration
The host specifies how long the gathering needs to be (e.g., 90 minutes). This anchors all scheduling and location matching.

### Step 2 — Indicate potential locations
The host selects from available locations. Each location in Quorum maintains its own availability data, so the system already knows when rooms or spaces are open.

> **Current scope:** The system maintains availability for two specific locations.
>
> **Future vision:** Expand to include public resources like library meeting rooms, with agentic AI that can query real-time availability and complete bookings on behalf of the host.

For virtual or hybrid gatherings, the host can indicate that a virtual option is available (with or without a physical location).

### Step 3 — Define the host's time preferences
The experience varies by event type:

| Type | How availability is defined |
|---|---|
| **Single event** | Host selects specific future days and time windows that can accommodate the duration |
| **Recurring series** | Host defines a cadence (e.g., "2nd and 4th Thursdays of each month") |
| **Limited series** | Host defines a frequency over a set period (e.g., "twice in the next two weeks") |

### Step 4 — Quorum generates matched options
Quorum cross-references the host's time preferences with location availability to produce a set of **viable options** — combinations of date, time, and location that actually work. The host reviews and can remove any options before publishing.

### Step 5 — Publish
The host publishes the gathering, making it available to invitees.

---

## Phase 3: Invitee Selection

- Invitees receive access via **email invitation** or **shared link**
- They are presented with all viable scheduling options (date/time/location combinations)
- **For single events:** Each invitee **ranks their top three options** in order of preference
- **For series:** Each invitee **votes once for their preferred cadence**
- Invitees can also **mark times that don't work** for them — this is important for what happens after confirmation (see Phase 4)

The interface is designed to be simple and low-friction.

---

## Phase 4: Quorum Reached — Confirmation & Booking

1. As soon as the minimum number of attendees (quorum) have responded and a viable option emerges, the **host is notified immediately**
2. The host reviews and **locks in** the date/time/location
3. The gathering now shows as **confirmed/locked**
4. **Invitee handling after lock-in:**
   - Invitees who did **not** mark the confirmed time as unavailable are **formally invited** to the gathering
   - They must **accept within a defined timeframe** to secure their spot
   - Invitees who marked the confirmed time as not working for them are not invited to this gathering (but may be candidates for overflow gatherings — see Phase 5)
5. Registration remains open until **capacity** is reached
6. Once at capacity, a **waiting list** is established

---

## Phase 5 (Optional): Overflow — Additional Gatherings

If the host indicated they are **open to multiple gatherings**:

1. Waitlisted attendees — plus invitees whose preferred times weren't selected — are invited to **select from the remaining viable slots**
2. Once a new quorum is reached on an alternative slot, the **host is notified again**
3. The host can confirm a **second gathering** (and so on)
4. This cycle repeats as long as there is demand and available slots

---

## Phase 6: Post-Confirmation Management

### Editing after publish
- Hosts can **remove scheduling options** after a gathering has been shared
- If invitees have already selected a removed option, the host is shown how many people are affected and must **confirm the removal**
- Adding new options post-publish is a potential future enhancement

### Location booking (future)
- Once a gathering is locked in, Quorum can **automatically book the confirmed location** (e.g., reserving a library meeting room via agentic AI)

---

## Happy Path Summary

```
Host creates draft gathering (title, description, format, quorum/capacity)
        ↓
Host sets duration → indicates locations → defines time preferences
        ↓
Quorum matches host times with location availability → generates viable options
        ↓
Host reviews options → publishes gathering → invitees notified
        ↓
Invitees rank top 3 (single) or vote on cadence (series) + mark unavailable times
        ↓
Quorum reached → host notified → host locks in date/time/location
        ↓
Invitees who didn't mark time as unavailable are formally invited → must accept within timeframe
        ↓
Registration open → capacity reached → waitlist created
        ↓
(If multiple gatherings enabled)
Overflow invitees select from remaining slots → new quorum → new gathering confirmed
```

---

## Key Design Principle: Locations as Participants

Locations in Quorum are not static fields — they behave like invitees with their own availability. This means:

- The system knows when a location is free before presenting it as an option
- Matching is three-dimensional: **people × times × places**
- As the location database grows (e.g., all public libraries in a city), the system can surface increasingly smart matches
- Future agentic capabilities can handle end-to-end booking with external systems

---

## Roadmap Considerations

| Feature | Status |
|---|---|
| Two managed locations with stored availability | Current scope |
| Virtual/hybrid gathering support | Current scope |
| Invitee preference ranking + unavailability marking | Current scope |
| Overflow/multiple gathering creation | Current scope |
| Post-publish option removal (with impact warning) | Current scope |
| Expanded location database (e.g., public libraries) | Future |
| Agentic AI for real-time availability queries & booking | Future |
| Post-publish option addition | Future |
