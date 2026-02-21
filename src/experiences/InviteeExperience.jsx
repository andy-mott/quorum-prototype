import { useState, useEffect, useRef } from "react";
import { COLORS, GRADIENTS, FONTS } from "../shared/styles";

// --- Mock Gathering Data (what the host published) ---
const MOCK_GATHERING = {
  title: "Q1 Community Planning Session",
  hostName: "Sarah Chen",
  description: "Quarterly planning session to align on community priorities and resource allocation.",
  duration: 120,
  format: "in-person",
  quorum: 5,
  capacity: 20,
  overflow: true,
  responsesReceived: 3,
  totalInvited: 12,
};

const ALL_LOCATIONS = [
  { name: "Community Center \u2014 Room A", address: "142 Main St" },
  { name: "Downtown Library \u2014 Meeting Room 3", address: "88 Elm Ave" },
];

const MOCK_OPTIONS = [
  { id: "opt-1", date: "2026-03-05", timeStart: "9:00 AM", timeEnd: "11:00 AM", locationName: "Community Center \u2014 Room A", locationAddr: "142 Main St" },
  { id: "opt-2", date: "2026-03-05", timeStart: "9:00 AM", timeEnd: "11:00 AM", locationName: "Downtown Library \u2014 Meeting Room 3", locationAddr: "88 Elm Ave" },
  { id: "opt-3", date: "2026-03-06", timeStart: "9:00 AM", timeEnd: "11:00 AM", locationName: "Community Center \u2014 Room A", locationAddr: "142 Main St" },
  { id: "opt-4", date: "2026-03-06", timeStart: "9:00 AM", timeEnd: "11:00 AM", locationName: "Downtown Library \u2014 Meeting Room 3", locationAddr: "88 Elm Ave" },
  { id: "opt-5", date: "2026-03-10", timeStart: "2:00 PM", timeEnd: "4:00 PM", locationName: "Community Center \u2014 Room A", locationAddr: "142 Main St" },
  { id: "opt-6", date: "2026-03-10", timeStart: "2:00 PM", timeEnd: "4:00 PM", locationName: "Downtown Library \u2014 Meeting Room 3", locationAddr: "88 Elm Ave" },
  { id: "opt-7", date: "2026-03-12", timeStart: "2:00 PM", timeEnd: "4:00 PM", locationName: "Community Center \u2014 Room A", locationAddr: "142 Main St" },
  { id: "opt-8", date: "2026-03-12", timeStart: "2:00 PM", timeEnd: "4:00 PM", locationName: "Downtown Library \u2014 Meeting Room 3", locationAddr: "88 Elm Ave" },
];

// --- Derive timeslots by grouping options on date + time ---
const TIMESLOTS = (() => {
  const map = {};
  for (const opt of MOCK_OPTIONS) {
    const key = `${opt.date}|${opt.timeStart}|${opt.timeEnd}`;
    if (!map[key]) {
      map[key] = {
        id: `ts-${Object.keys(map).length + 1}`,
        date: opt.date,
        timeStart: opt.timeStart,
        timeEnd: opt.timeEnd,
        locations: [],
      };
    }
    map[key].locations.push({ name: opt.locationName, address: opt.locationAddr });
  }
  return Object.values(map);
})();

// --- Mock per-timeslot commitment data ---
// How many existing respondents marked each timeslot as "works"
const TIMESLOT_COMMITMENTS = {
  "ts-1": 4,  // Mar 5, 9–11 AM — one more needed for quorum!
  "ts-2": 2,  // Mar 6, 9–11 AM
  "ts-3": 3,  // Mar 10, 2–4 PM
  "ts-4": 1,  // Mar 12, 2–4 PM
};

// --- Availability windows the host scheduled within ---
// The host defined earliest arrival and latest departure for each window.
// These bounds already account for the host's commute (the host dragged handles to set them).
const TIMESLOT_WINDOWS = {
  "ts-1": { windowStart: "8:00 AM", windowEnd: "2:00 PM", hostEarliestStart: 8.5, hostLatestEnd: 13.5 },   // Host can arrive 8:30 AM, must leave by 1:30 PM
  "ts-2": { windowStart: "8:00 AM", windowEnd: "2:00 PM", hostEarliestStart: 8.5, hostLatestEnd: 13.5 },
  "ts-3": { windowStart: "12:00 PM", windowEnd: "6:00 PM", hostEarliestStart: 12.33, hostLatestEnd: 17.67 },  // Host can arrive 12:20 PM, must leave by 5:40 PM
  "ts-4": { windowStart: "12:00 PM", windowEnd: "6:00 PM", hostEarliestStart: 12.33, hostLatestEnd: 17.67 },
};

// --- Invitee commute defaults (mock "remembered" from previous events) ---
const INVITEE_COMMUTE_DEFAULTS = {
  "Community Center \u2014 Room A": 25,
  "Downtown Library \u2014 Meeting Room 3": 15,
};

// --- Deterministic Mock Calendar Events Per Date ---
// Mar 5: morning conflict -> amber (9-11 AM window)
// Mar 6: fully free morning -> green (9-11 AM window)
// Mar 10: packed afternoon -> red (2-4 PM window)
// Mar 12: partial conflict -> amber (2-4 PM window)
const DETERMINISTIC_EVENTS = {
  "2026-03-05": [
    { start: 9, end: 10, title: "Team standup", color: "#4285f4" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
  ],
  "2026-03-06": [
    { start: 7.5, end: 8.5, title: "Morning workout", color: "#0b8043" },
    { start: 12, end: 13, title: "Lunch with friend", color: "#7986cb" },
    { start: 14, end: 15, title: "Design review", color: "#e67c73" },
  ],
  "2026-03-10": [
    { start: 10, end: 11, title: "All-hands meeting", color: "#4285f4" },
    { start: 13.5, end: 14.5, title: "Client call", color: "#e67c73" },
    { start: 14.5, end: 16, title: "Strategy planning", color: "#f4511e" },
    { start: 16, end: 17, title: "Errands", color: "#0b8043" },
  ],
  "2026-03-12": [
    { start: 10, end: 11, title: "Product review", color: "#e67c73" },
    { start: 14, end: 15, title: "Interview panel", color: "#4285f4" },
    { start: 16, end: 17, title: "Gym", color: "#0b8043" },
  ],
};

// --- Utility functions ---
function formatHour(h) {
  const hr = Math.floor(h);
  const min = h % 1 === 0.5 ? "30" : "00";
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${min} ${ampm}`;
}

function formatTimePrecise(h) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, "0")} ${ampm}`;
}

function parseTimeToHour(timeStr) {
  if (!timeStr) return 9;
  const [time, ampm] = timeStr.split(" ");
  let [hr, min] = time.split(":").map(Number);
  if (ampm === "PM" && hr !== 12) hr += 12;
  if (ampm === "AM" && hr === 12) hr = 0;
  return hr + min / 60;
}

function isTimeslotAdjusted(timeslot, adjustedStart, maxCommuteMins) {
  const win = TIMESLOT_WINDOWS[timeslot.id];
  if (!win || adjustedStart == null) return false;
  const effectiveStartHr = win.hostEarliestStart;
  const effectiveEndHr = win.hostLatestEnd;
  const durationHrs = MOCK_GATHERING.duration / 60;
  const commuteHrs = maxCommuteMins / 60;
  const minStart = effectiveStartHr + commuteHrs;
  const maxStart = effectiveEndHr - durationHrs - commuteHrs;
  const hostSuggestedStart = parseTimeToHour(timeslot.timeStart);
  const currentStart = Math.max(minStart, Math.min(maxStart, adjustedStart));
  return Math.abs(currentStart - hostSuggestedStart) > 0.08;
}

function getFreeGaps(events, windowStart, windowEnd) {
  const sorted = [...events].filter(e => e.end > windowStart && e.start < windowEnd).sort((a, b) => a.start - b.start);
  const gaps = [];
  let cursor = windowStart;
  for (const ev of sorted) {
    if (ev.start > cursor) gaps.push({ start: cursor, end: ev.start });
    cursor = Math.max(cursor, ev.end);
  }
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd });
  return gaps;
}

function getLocationAvailability(dateKey, timeStart, timeEnd) {
  const events = DETERMINISTIC_EVENTS[dateKey] || [];
  const startHr = parseTimeToHour(timeStart);
  const endHr = parseTimeToHour(timeEnd);
  const gaps = getFreeGaps(events, startHr, endHr);
  const durationHours = MOCK_GATHERING.duration / 60;
  const totalFreeHours = gaps.reduce((sum, g) => sum + (g.end - g.start), 0);
  const windowHours = endHr - startHr;
  const fullyFree = totalFreeHours >= windowHours - 0.01;
  const fitsOnce = gaps.some(g => (g.end - g.start) >= durationHours);

  let level;
  if (fullyFree) level = "green";
  else if (fitsOnce) level = "amber";
  else level = "red";

  const items = [];
  let cursor = startHr;
  const sorted = [...events].filter(e => e.end > startHr && e.start < endHr).sort((a, b) => a.start - b.start);
  for (const ev of sorted) {
    const evStart = Math.max(ev.start, startHr);
    const evEnd = Math.min(ev.end, endHr);
    if (evStart > cursor) {
      const gapDur = evStart - cursor;
      const fits = gapDur >= durationHours;
      items.push({ type: fits ? "green" : "amber", label: `${formatHour(cursor)}\u2013${formatHour(evStart)} \u2014 Free (${Math.round(gapDur * 60)} min)` });
    }
    items.push({ type: "red", label: `${formatHour(evStart)}\u2013${formatHour(evEnd)} \u2014 ${ev.title}` });
    cursor = Math.max(cursor, evEnd);
  }
  if (cursor < endHr) {
    const gapDur = endHr - cursor;
    const fits = gapDur >= durationHours;
    items.push({ type: fits ? "green" : "amber", label: `${formatHour(cursor)}\u2013${formatHour(endHr)} \u2014 Free (${Math.round(gapDur * 60)} min)` });
  }

  return { level, items };
}

// Timeslot availability = best level among included (non-excluded) locations
// All locations share the same date/time, so same calendar — but we use
// "best among included" to model the concept
function getTimeslotAvailability(timeslot, globalExclusions, perSlotExclusions) {
  const included = timeslot.locations.filter(loc =>
    !globalExclusions.has(loc.name) && !(perSlotExclusions[timeslot.id] || new Set()).has(loc.name)
  );
  if (included.length === 0) return { level: "red", label: "No locations" };

  const avail = getLocationAvailability(timeslot.date, timeslot.timeStart, timeslot.timeEnd);
  return avail;
}

function getIncludedLocationCount(timeslot, globalExclusions, perSlotExclusions) {
  return timeslot.locations.filter(loc =>
    !globalExclusions.has(loc.name) && !(perSlotExclusions[timeslot.id] || new Set()).has(loc.name)
  ).length;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getDefaultExpiration() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getMaxExpiration() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split("T")[0];
}

// --- Icons ---
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const QuestionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5.5 5.25C5.5 4.42 6.17 3.75 7 3.75C7.83 3.75 8.5 4.42 8.5 5.25C8.5 6.08 7.83 6.5 7 7V7.75"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="10" r="0.75" fill="currentColor"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M9 5V9L12 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <path d="M9 16C9 16 15 11.5 15 7C15 3.68629 12.3137 1 9 1C5.68629 1 3 3.68629 3 7C3 11.5 9 16 9 16Z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="9" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <circle cx="6.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 15C1 12 3.5 10 6.5 10C9.5 10 12 12 12 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="12.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M14 10.5C15.5 11 17 12.5 17 15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const ChevronDown = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIconSmall = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="6" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 6V4.5C5 3.12 6.12 2 7.5 2V2C8.88 2 10 3.12 10 4.5V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const CheckboxIcon = ({ checked, locked }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="16" height="16" rx="4" stroke={locked ? "#c0c8d0" : checked ? "#43a047" : "#b0bac5"} strokeWidth="1.5" fill={locked ? "#f0f2f5" : checked ? "#43a047" : "none"} />
    {checked && !locked && <path d="M5 9L8 12L13 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {locked && <path d="M5 9L8 12L13 6" stroke="#b0bac5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

const SparkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5L7 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="currentColor"/>
  </svg>
);

const PeopleSmallIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <circle cx="5.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 13C1 10.5 3 9 5.5 9C8 9 10 10.5 10 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="11" cy="5" r="1.5" stroke="currentColor" strokeWidth="1"/>
    <path d="M12 9C13.5 9.5 15 11 15 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const DirectionsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6.7 1.3L10.7 5.3C11.1 5.7 11.1 6.3 10.7 6.7L6.7 10.7C6.3 11.1 5.7 11.1 5.3 10.7L1.3 6.7C0.9 6.3 0.9 5.7 1.3 5.3L5.3 1.3C5.7 0.9 6.3 0.9 6.7 1.3Z" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M4.5 6.5L6 5L7.5 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 5V8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const CommuteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 9.5H11.5V7L10 4H4L2.5 7V9.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    <path d="M2.5 7H11.5" stroke="currentColor" strokeWidth="1"/>
    <circle cx="4.5" cy="8.5" r="0.6" fill="currentColor"/>
    <circle cx="9.5" cy="8.5" r="0.6" fill="currentColor"/>
    <path d="M3 9.5V11" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <path d="M11 9.5V11" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const RANK_COLORS = [
  { bg: "#fffde7", border: "#f9a825", badge: "#f9a825", label: "1st choice" },
  { bg: "#fafafa", border: "#90a4ae", badge: "#78909c", label: "2nd choice" },
  { bg: "#fef6f0", border: "#bc8f6f", badge: "#a1887f", label: "3rd choice" },
];

const BULLET_COLORS = { green: "#43a047", amber: "#f9a825", red: "#e53935" };
const AVAIL_BAR_COLORS = { green: "#43a047", amber: "#f9a825", red: "#e53935" };
const AVAIL_LABELS = { green: "Fully free", amber: "Conflict, but fits", red: "Busy during this time" };

// --- Sub-components ---

function AvailabilityPopover({ timeslot, style }) {
  const info = getLocationAvailability(timeslot.date, timeslot.timeStart, timeslot.timeEnd);
  return (
    <div style={{ ...styles.popover, ...style }} onClick={(e) => e.stopPropagation()}>
      <div style={styles.popoverHeader}>
        <span style={styles.popoverTitle}>{formatDate(timeslot.date)}</span>
        <span style={styles.popoverBadge}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginRight: 4 }}>
            <circle cx="5" cy="5" r="4" stroke="#4285f4" strokeWidth="1.2"/><path d="M5 3V5.5L6.5 6.5" stroke="#4285f4" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          Your Calendar
        </span>
      </div>
      <div style={styles.popoverWindow}>
        <span>{timeslot.timeStart} {"\u2014"} {timeslot.timeEnd}</span>
      </div>
      <ul style={styles.popoverList}>
        {info.items.map((item, i) => (
          <li key={i} style={styles.popoverListItem}>
            <div style={{ ...styles.popoverBullet, background: BULLET_COLORS[item.type] }} />
            <span style={styles.popoverItemText}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalendarConnectedIndicator() {
  return (
    <div style={styles.calConnected}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6, flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6" stroke="#4285f4" strokeWidth="1.2"/>
        <path d="M7 4V7.5L9 9" stroke="#4285f4" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      <span style={{ color: "#5a6a7a", fontSize: 12 }}>Connected as </span>
      <span style={{ color: "#3c4043", fontSize: 12, fontWeight: 600 }}>alex.johnson@gmail.com</span>
    </div>
  );
}

function GlobalLocationFilter({ locations, globalExclusions, onToggle, inviteeCommutes, onCommuteChange }) {
  return (
    <div style={styles.globalLocFilter}>
      <div style={styles.globalLocLabel}>Locations</div>
      {locations.map((loc) => {
        const included = !globalExclusions.has(loc.name);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.address)}`;
        return (
          <div key={loc.name} style={styles.globalLocCard}>
            <button
              onClick={() => onToggle(loc.name)}
              style={styles.globalLocRow}
            >
              <CheckboxIcon checked={included} locked={false} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: included ? COLORS.text : COLORS.textLight }}>{loc.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{loc.address}</span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={styles.locDirectionsLink}
                  >
                    <DirectionsIcon /> Directions
                  </a>
                </div>
              </div>
              {!included && (
                <span style={styles.excludedTag}>Excluded from all</span>
              )}
            </button>
            {included && (
              <div style={styles.globalLocCommuteWrap}>
                <InlineCommuteInput
                  locName={loc.name}
                  value={inviteeCommutes[loc.name] || 0}
                  onChange={onCommuteChange}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InlineCommuteInput({ locName, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const n = parseInt(editVal);
    onChange(locName, isNaN(n) || n < 0 ? 0 : Math.min(n, 180));
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={styles.locCommuteRow} onClick={(e) => e.stopPropagation()}>
        <CommuteIcon />
        <input
          ref={inputRef}
          type="number"
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          style={styles.locCommuteInput}
          min={0}
          max={180}
          step={5}
        />
        <span style={styles.locCommuteUnit}>min</span>
      </div>
    );
  }

  return (
    <div
      style={{ ...styles.locCommuteRow, cursor: "pointer" }}
      onClick={(e) => { e.stopPropagation(); setEditVal(value); setEditing(true); }}
    >
      <CommuteIcon />
      <span style={styles.locCommuteValue}>{value}</span>
      <span style={styles.locCommuteUnit}>min</span>
    </div>
  );
}

function ExpandedLocationPanel({ timeslot, globalExclusions, perSlotExclusions, onToggleLocation, inviteeCommutes }) {
  const slotExclusions = perSlotExclusions[timeslot.id] || new Set();

  return (
    <div style={styles.expandedPanel}>
      {timeslot.locations.map((loc) => {
        const isGloballyExcluded = globalExclusions.has(loc.name);
        const isLocallyExcluded = slotExclusions.has(loc.name);
        const isIncluded = !isGloballyExcluded && !isLocallyExcluded;
        const commuteMins = inviteeCommutes[loc.name] || 0;

        return (
          <button
            key={loc.name}
            onClick={() => !isGloballyExcluded && onToggleLocation(timeslot.id, loc.name)}
            style={{
              ...styles.locRow,
              ...(isGloballyExcluded ? styles.locRowLocked : {}),
              ...(isLocallyExcluded ? styles.locRowExcluded : {}),
              cursor: isGloballyExcluded ? "default" : "pointer",
            }}
          >
            <CheckboxIcon checked={isIncluded || isGloballyExcluded} locked={isGloballyExcluded} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: isGloballyExcluded ? "#b0bac5" : isLocallyExcluded ? COLORS.textLight : COLORS.text,
              }}>
                {loc.name}
              </div>
            </div>
            {isGloballyExcluded ? (
              <span style={styles.locLockedLabel}>
                <LockIconSmall /> Excluded
              </span>
            ) : isIncluded ? (
              <span style={styles.locCommutePill}>
                <CommuteIcon /> {commuteMins} min
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function InviteeTimeline({ timeslot, inviteeCommuteMins, adjustedStart, onPositionChange }) {
  const barRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [barWidth, setBarWidth] = useState(400);
  const dragStartRef = useRef(null);

  const win = TIMESLOT_WINDOWS[timeslot.id];
  if (!win) return null;

  // Effective window = host's earliest arrival to latest departure
  const effectiveStartHr = win.hostEarliestStart;
  const effectiveEndHr = win.hostLatestEnd;
  const effectiveHrs = effectiveEndHr - effectiveStartHr;
  const durationHrs = MOCK_GATHERING.duration / 60;
  const commuteHrs = inviteeCommuteMins / 60;
  const hostSuggestedStart = parseTimeToHour(timeslot.timeStart);

  // Invitee drag bounds: within effective window, further constrained by their commute
  const minStart = effectiveStartHr + commuteHrs;
  const maxStart = effectiveEndHr - durationHrs - commuteHrs;
  const fits = durationHrs + commuteHrs * 2 <= effectiveHrs + 0.01;

  const currentStart = adjustedStart != null
    ? Math.max(minStart, Math.min(maxStart, adjustedStart))
    : Math.max(minStart, Math.min(maxStart, hostSuggestedStart));

  const isAdjusted = isTimeslotAdjusted(timeslot, adjustedStart, inviteeCommuteMins);

  const toPercent = (h) => ((h - effectiveStartHr) / effectiveHrs) * 100;

  // Calendar events for this date (within effective window)
  const calEvents = (DETERMINISTIC_EVENTS[timeslot.date] || []).filter(
    ev => ev.end > effectiveStartHr && ev.start < effectiveEndHr
  );

  // Measure bar
  useEffect(() => {
    if (barRef.current) setBarWidth(barRef.current.offsetWidth);
    const onResize = () => { if (barRef.current) setBarWidth(barRef.current.offsetWidth); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const pxPerHour = barWidth / effectiveHrs;

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dHrs = dx / pxPerHour;
      let newStart = dragStartRef.current.startPos + dHrs;
      newStart = Math.max(minStart, Math.min(maxStart, newStart));
      newStart = Math.round(newStart * 12) / 12; // snap to 5 min
      onPositionChange(newStart);
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, pxPerHour, minStart, maxStart, onPositionChange]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragStartRef.current = { clientX: e.clientX, startPos: currentStart };
    setDragging(true);
  };

  if (!fits) {
    return (
      <div style={styles.invTimelineWrap}>
        <div style={styles.invTimelineWarning}>
          Your commute ({inviteeCommuteMins} min each way) doesn't fit within this window.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.invTimelineWrap}>
      <div style={styles.invTimelineHeader}>
        <span style={styles.invTimelineLabel}>
          {isAdjusted ? "Your adjusted time" : "Host suggested time"}
        </span>
        {isAdjusted && (
          <button
            onClick={(e) => { e.stopPropagation(); onPositionChange(null); }}
            style={styles.invTimelineReset}
          >
            Reset
          </button>
        )}
      </div>
      <div ref={barRef} style={styles.invTimelineBar}>
        {/* Host suggestion ghost (when adjusted) */}
        {isAdjusted && (
          <div style={{
            position: "absolute",
            left: `${toPercent(hostSuggestedStart)}%`,
            width: `${(durationHrs / effectiveHrs) * 100}%`,
            top: 4, bottom: 4,
            border: "2px dashed #b0bac5",
            borderRadius: 6,
            zIndex: 1,
            opacity: 0.5,
          }} />
        )}
        {/* Commute buffer before */}
        {commuteHrs > 0 && (
          <div style={{
            position: "absolute",
            left: `${toPercent(currentStart - commuteHrs)}%`,
            width: `${(commuteHrs / effectiveHrs) * 100}%`,
            top: 0, bottom: 0,
            background: COLORS.blueLight,
            opacity: 0.2,
            borderRadius: "6px 0 0 6px",
            zIndex: 2,
          }} />
        )}
        {/* Gathering block (draggable) */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            left: `${toPercent(currentStart)}%`,
            width: `${(durationHrs / effectiveHrs) * 100}%`,
            top: 3, bottom: 3,
            background: COLORS.blueLight,
            borderRadius: 6,
            cursor: dragging ? "grabbing" : "grab",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 10, fontWeight: 600,
            overflow: "hidden", whiteSpace: "nowrap",
            userSelect: "none",
            zIndex: 3,
            transition: dragging ? "none" : "left 0.15s ease",
            boxShadow: dragging ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {(durationHrs / effectiveHrs) > 0.2 && (
            <span style={{ padding: "0 4px" }}>{formatTimePrecise(currentStart)} {"\u2013"} {formatTimePrecise(currentStart + durationHrs)}</span>
          )}
        </div>
        {/* Commute buffer after */}
        {commuteHrs > 0 && (
          <div style={{
            position: "absolute",
            left: `${toPercent(currentStart + durationHrs)}%`,
            width: `${(commuteHrs / effectiveHrs) * 100}%`,
            top: 0, bottom: 0,
            background: COLORS.blueLight,
            opacity: 0.2,
            borderRadius: "0 6px 6px 0",
            zIndex: 2,
          }} />
        )}
      </div>
      {/* Busy-time indicators (below timeline bar) */}
      {calEvents.length > 0 && (
        <div style={styles.invBusyRow}>
          {calEvents.map((ev, i) => {
            const evS = Math.max(ev.start, effectiveStartHr);
            const evE = Math.min(ev.end, effectiveEndHr);
            return (
              <div key={i} title={ev.title} style={{
                position: "absolute",
                left: `${toPercent(evS)}%`,
                width: `${((evE - evS) / effectiveHrs) * 100}%`,
                top: 0,
                height: 4,
                background: "#e53935",
                borderRadius: 2,
                opacity: 0.85,
              }} />
            );
          })}
        </div>
      )}
      {/* Time labels */}
      <div style={styles.invTimelineLabels}>
        <span>{formatTimePrecise(effectiveStartHr)}</span>
        <span style={{ color: COLORS.blueLight, fontWeight: 600 }}>{formatTimePrecise(currentStart)}</span>
        <span>{formatTimePrecise(effectiveEndHr)}</span>
      </div>
    </div>
  );
}

function TimeslotRow({
  timeslot,
  selection,
  onSelect,
  isExpanded,
  onToggleExpand,
  globalExclusions,
  perSlotExclusions,
  onToggleLocation,
  commitCount,
  quorum,
  inviteeCommutes,
  maxCommuteMins,
  timelineAdjustment,
  onTimelineChange,
}) {
  const [showPopover, setShowPopover] = useState(false);
  const avail = getTimeslotAvailability(timeslot, globalExclusions, perSlotExclusions);
  const includedCount = getIncludedLocationCount(timeslot, globalExclusions, perSlotExclusions);
  const isWorks = selection === "works";
  const isProposed = selection === "proposed";
  const isDoesntWork = selection === "doesnt-work";
  const isTimelineAdjusted = isTimeslotAdjusted(timeslot, timelineAdjustment, maxCommuteMins);
  const needsOne = commitCount === quorum - 1;
  const wouldReachQuorum = isWorks && needsOne;
  const commitWithUser = isWorks ? commitCount + 1 : commitCount;

  return (
    <div style={{
      ...styles.tsCard,
      ...(isWorks ? styles.tsCardWorks : {}),
      ...(isProposed ? styles.tsCardProposed : {}),
      ...(isDoesntWork ? styles.tsCardDoesntWork : {}),
    }}>
      <div
        style={styles.tsMainRow}
        onClick={onToggleExpand}
      >
        {/* Availability color bar */}
        <div style={{ ...styles.tsAvailBar, background: AVAIL_BAR_COLORS[avail.level] }} />

        {/* Date/time info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.tsDateRow}>
            <span style={styles.tsDate}>{formatDate(timeslot.date)}</span>
            <span style={styles.tsDot}>&middot;</span>
            <span style={styles.tsTime}>{timeslot.timeStart}{"\u2013"}{timeslot.timeEnd}</span>
          </div>
          <div style={styles.tsLocCountRow}>
            <span style={styles.tsLocCount}>{includedCount} location{includedCount !== 1 ? "s" : ""}</span>
            <div style={{ position: "relative", display: "inline-flex" }}>
              <span
                style={{ ...styles.tsAvailLabel, color: BULLET_COLORS[avail.level] }}
                onMouseEnter={() => setShowPopover(true)}
                onMouseLeave={() => setShowPopover(false)}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: BULLET_COLORS[avail.level] }} />
                {AVAIL_LABELS[avail.level]}
              </span>
              {showPopover && (
                <AvailabilityPopover timeslot={timeslot} style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, zIndex: 100 }} />
              )}
            </div>
            <span style={styles.tsMetaSep}>&middot;</span>
            {wouldReachQuorum ? (
              <span style={styles.tsCommitQuorum}>
                <SparkIcon /> Quorum reached with you!
              </span>
            ) : needsOne ? (
              <span style={styles.tsCommitNear}>
                <SparkIcon /> 1 more for quorum
              </span>
            ) : (
              <span style={styles.tsCommitCount}>
                <PeopleSmallIcon /> {commitWithUser}/{quorum}
              </span>
            )}
          </div>
        </div>

        {/* Toggle buttons */}
        <div style={styles.tsToggles} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => !isTimelineAdjusted && onSelect(timeslot.id, isWorks ? null : "works")}
            style={{
              ...styles.tsToggleBtn,
              ...(isWorks ? styles.tsToggleBtnWorks : {}),
              ...(isTimelineAdjusted && !isWorks ? styles.tsToggleBtnDisabled : {}),
            }}
            title={isTimelineAdjusted ? "Reset timeline to accept host time" : "Works for me"}
            disabled={isTimelineAdjusted && !isWorks}
          >
            <CheckIcon />
          </button>
          {isTimelineAdjusted && (
            <button
              onClick={() => onSelect(timeslot.id, isProposed ? null : "proposed")}
              style={{
                ...styles.tsToggleBtn,
                ...(isProposed ? styles.tsToggleBtnProposed : {}),
              }}
              title="Propose this adjusted time"
            >
              <QuestionIcon />
            </button>
          )}
          <button
            onClick={() => onSelect(timeslot.id, isDoesntWork ? null : "doesnt-work")}
            style={{ ...styles.tsToggleBtn, ...(isDoesntWork ? styles.tsToggleBtnDoesntWork : {}) }}
            title="Doesn't work"
          >
            <XIcon />
          </button>
        </div>

        {/* Expand chevron */}
        <ChevronDown
          size={18}
          style={{
            color: COLORS.textLight,
            transition: "transform 0.2s",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
            marginLeft: 4,
          }}
        />
      </div>

      {/* Expanded location panel + timeline */}
      {isExpanded && (
        <>
          <ExpandedLocationPanel
            timeslot={timeslot}
            globalExclusions={globalExclusions}
            perSlotExclusions={perSlotExclusions}
            onToggleLocation={onToggleLocation}
            inviteeCommutes={inviteeCommutes}
          />
          <InviteeTimeline
            timeslot={timeslot}
            inviteeCommuteMins={maxCommuteMins}
            adjustedStart={timelineAdjustment}
            onPositionChange={onTimelineChange}
          />
        </>
      )}
    </div>
  );
}

// --- Main component ---
export default function InviteeExperience({ onBack }) {
  const [screen, setScreen] = useState(1);
  const [timeslotSelections, setTimeslotSelections] = useState({});
  const [globalLocationExclusions, setGlobalLocationExclusions] = useState(new Set());
  const [locationExclusions, setLocationExclusions] = useState({}); // { tsId: Set<locName> }
  const [expandedTimeslot, setExpandedTimeslot] = useState(null);
  const [rankings, setRankings] = useState([null, null, null]);
  const [expirationDate, setExpirationDate] = useState(getDefaultExpiration());
  const [notes, setNotes] = useState("");
  const [inviteeCommutes, setInviteeCommutes] = useState({ ...INVITEE_COMMUTE_DEFAULTS }); // { locName: minutes }
  const [timelineAdjustments, setTimelineAdjustments] = useState({}); // { tsId: decimalHour | null }

  const worksTimeslots = TIMESLOTS.filter(ts => timeslotSelections[ts.id] === "works");
  const proposedTimeslots = TIMESLOTS.filter(ts => timeslotSelections[ts.id] === "proposed");
  const worksCount = worksTimeslots.length;
  const proposedCount = proposedTimeslots.length;
  const doesntWorkCount = Object.values(timeslotSelections).filter(v => v === "doesnt-work").length;
  const rankableTimeslots = TIMESLOTS.filter(ts =>
    timeslotSelections[ts.id] === "works" || timeslotSelections[ts.id] === "proposed"
  );
  const rankableCount = rankableTimeslots.length;

  const maxRanks = Math.min(3, rankableCount);

  // Clear invalid rankings when rankable selections change
  useEffect(() => {
    const rankableIds = new Set(rankableTimeslots.map(ts => ts.id));
    setRankings(prev => prev.map(id => (id && !rankableIds.has(id)) ? null : id));
  }, [rankableCount]);

  const handleTimeslotSelect = (tsId, value) => {
    setTimeslotSelections(prev => ({ ...prev, [tsId]: value }));
  };

  const handleGlobalLocationToggle = (locName) => {
    setGlobalLocationExclusions(prev => {
      const next = new Set(prev);
      if (next.has(locName)) next.delete(locName);
      else next.add(locName);
      return next;
    });
  };

  const handlePerSlotLocationToggle = (tsId, locName) => {
    setLocationExclusions(prev => {
      const current = prev[tsId] || new Set();
      const next = new Set(current);
      if (next.has(locName)) next.delete(locName);
      else next.add(locName);
      return { ...prev, [tsId]: next };
    });
  };

  const handleRankToggle = (tsId) => {
    const currentIndex = rankings.indexOf(tsId);
    if (currentIndex !== -1) {
      const next = [...rankings];
      next[currentIndex] = null;
      setRankings(next);
    } else {
      const emptyIndex = rankings.findIndex((r, i) => r === null && i < maxRanks);
      if (emptyIndex !== -1) {
        const next = [...rankings];
        next[emptyIndex] = tsId;
        setRankings(next);
      }
    }
  };

  const handleTimelineChange = (tsId, position) => {
    setTimelineAdjustments(prev => ({ ...prev, [tsId]: position }));
    if (position === null) {
      // Resetting to host suggestion: clear "proposed" selection
      if (timeslotSelections[tsId] === "proposed") {
        setTimeslotSelections(prev => ({ ...prev, [tsId]: null }));
      }
    } else {
      // Adjusting: if currently "works", auto-clear (user must explicitly propose)
      if (timeslotSelections[tsId] === "works") {
        const ts = TIMESLOTS.find(t => t.id === tsId);
        if (ts && isTimeslotAdjusted(ts, position, getMaxCommuteForTimeslot(ts))) {
          setTimeslotSelections(prev => ({ ...prev, [tsId]: null }));
        }
      }
    }
  };

  const handleCommuteChange = (locName, minutes) => {
    const n = parseInt(minutes);
    setInviteeCommutes(prev => ({ ...prev, [locName]: isNaN(n) || n < 0 ? 0 : Math.min(n, 180) }));
  };

  // Max commute across included locations for a given timeslot
  const getMaxCommuteForTimeslot = (timeslot) => {
    const included = timeslot.locations.filter(loc =>
      !globalLocationExclusions.has(loc.name) && !(locationExclusions[timeslot.id] || new Set()).has(loc.name)
    );
    if (included.length === 0) return 0;
    return Math.max(...included.map(loc => inviteeCommutes[loc.name] || 0));
  };

  const handleUnassignSlot = (slotIndex) => {
    const next = [...rankings];
    next[slotIndex] = null;
    setRankings(next);
  };

  const filledRanks = rankings.filter(Boolean).length;
  const canContinue = worksCount >= 1 || proposedCount >= 1;
  const canSubmit = filledRanks >= 1;
  const quorumProgress = MOCK_GATHERING.responsesReceived / MOCK_GATHERING.quorum;

  // --- Confirmation screen ---
  if (screen === 3) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.confirmBody}>
            <div style={{ marginBottom: 20 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" fill="#E8F5E9" stroke="#43A047" strokeWidth="2"/>
                <path d="M15 25L21 31L33 17" stroke="#43A047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={styles.confirmTitle}>Response Submitted!</h2>
            <p style={styles.confirmSub}>
              {worksCount > 0 && <>You ranked <strong>{filledRanks} timeslot preference{filledRanks !== 1 ? "s" : ""}</strong> from {worksCount} available slot{worksCount !== 1 ? "s" : ""}.</>}
              {proposedCount > 0 && <>{worksCount > 0 ? " " : ""}You proposed <strong>{proposedCount} alternate time{proposedCount !== 1 ? "s" : ""}</strong> that others can vote on.</>}
              {expirationDate && <><br/>Your availability expires <strong>{new Date(expirationDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.</>}
            </p>
            <div style={styles.confirmStats}>
              {worksCount > 0 && (
                <>
                  <div style={styles.confirmStat}>
                    <span style={styles.confirmStatLabel}>Your #1 pick</span>
                    <span style={{ ...styles.confirmStatValue, fontSize: 14 }}>
                      {rankings[0] ? (() => {
                        const ts = TIMESLOTS.find(t => t.id === rankings[0]);
                        return ts ? `${formatDate(ts.date)}, ${ts.timeStart}\u2013${ts.timeEnd}` : "";
                      })() : "\u2014"}
                    </span>
                  </div>
                  <div style={styles.confirmStatDivider} />
                  <div style={styles.confirmStat}>
                    <span style={styles.confirmStatLabel}>Best quorum progress</span>
                    <span style={styles.confirmStatValue}>
                      {(() => {
                        const worksIds = worksTimeslots.map(ts => ts.id);
                        const bestCC = Math.max(...worksIds.map(id => (TIMESLOT_COMMITMENTS[id] || 0) + 1));
                        return `${bestCC} / ${MOCK_GATHERING.quorum}`;
                      })()}
                    </span>
                  </div>
                </>
              )}
              {proposedCount > 0 && (
                <>
                  {worksCount > 0 && <div style={styles.confirmStatDivider} />}
                  <div style={styles.confirmStat}>
                    <span style={styles.confirmStatLabel}>Proposed times</span>
                    <span style={{ ...styles.confirmStatValue, color: "#f9a825" }}>{proposedCount}</span>
                  </div>
                </>
              )}
            </div>
            {worksTimeslots.some(ts => (TIMESLOT_COMMITMENTS[ts.id] || 0) === MOCK_GATHERING.quorum - 1) ? (
              <div style={{ ...styles.quorumCallout, marginTop: 20, justifyContent: "center" }}>
                <SparkIcon />
                <span>Your response reaches quorum on a timeslot! The host can now confirm the gathering.</span>
              </div>
            ) : proposedCount > 0 && worksCount === 0 ? (
              <p style={{ fontSize: 14, color: "#f57f17", lineHeight: 1.6, marginTop: 16, fontWeight: 500 }}>
                Your proposed times will be added as new options for others to vote on.
              </p>
            ) : (
              <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, marginTop: 16 }}>
                The host will notify you when quorum is reached and the gathering is confirmed.
              </p>
            )}
            <button
              style={{ ...styles.primaryBtn, marginTop: 24, maxWidth: 240 }}
              onClick={() => {
                setScreen(1);
                setTimeslotSelections({});
                setGlobalLocationExclusions(new Set());
                setLocationExclusions({});
                setExpandedTimeslot(null);
                setRankings([null, null, null]);
                setTimelineAdjustments({});
                setExpirationDate(getDefaultExpiration());
                setNotes("");
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          {onBack && (
            <button onClick={onBack} style={styles.backToHub}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6 }}>
                <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All Experiences
            </button>
          )}
          <div style={styles.logoRow}>
            <div style={styles.logo}>Q</div>
            <span style={styles.logoText}>Quorum</span>
          </div>
          <p style={styles.subtitle}>Respond to your invitation</p>
        </div>

        {/* Step indicator */}
        <div style={styles.stepRow}>
          <div style={styles.stepItem}>
            <div style={{ ...styles.stepDot, ...(screen === 1 ? styles.stepDotActive : styles.stepDotDone) }}>
              {screen > 1 ? <CheckIcon /> : <span style={{ fontSize: 13, fontWeight: 700 }}>1</span>}
            </div>
            <span style={{ ...styles.stepLabel, ...(screen === 1 ? styles.stepLabelActive : styles.stepLabelDone) }}>Select</span>
          </div>
          <div style={{ ...styles.stepLine, ...(screen > 1 ? styles.stepLineDone : {}) }} />
          <div style={styles.stepItem}>
            <div style={{ ...styles.stepDot, ...(screen === 2 ? styles.stepDotActive : {}) }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>2</span>
            </div>
            <span style={{ ...styles.stepLabel, ...(screen === 2 ? styles.stepLabelActive : {}) }}>Rank</span>
          </div>
        </div>

        {/* Content */}
        <div style={styles.stepContent}>
          {/* Gathering info header (both screens) */}
          <div style={styles.gatheringInfo}>
            <div style={styles.gatheringTitle}>{MOCK_GATHERING.title}</div>
            <div style={styles.gatheringMeta}>
              <span style={styles.gatheringMetaItem}><ClockIcon /> {MOCK_GATHERING.duration} min</span>
              <span style={styles.gatheringMetaItem}><MapPinIcon /> {MOCK_GATHERING.format}</span>
              <span style={styles.gatheringMetaItem}><UsersIcon /> Hosted by {MOCK_GATHERING.hostName}</span>
            </div>
            <div style={styles.quorumRow}>
              <span style={styles.quorumLabel}>{MOCK_GATHERING.responsesReceived} of {MOCK_GATHERING.totalInvited} responded</span>
              <div style={styles.quorumBar}>
                <div style={{ ...styles.quorumBarFill, width: `${Math.min(100, (MOCK_GATHERING.responsesReceived / MOCK_GATHERING.totalInvited) * 100)}%` }} />
              </div>
            </div>

            {/* Per-slot quorum summary */}
            <div style={styles.quorumSlotSummary}>
              <div style={styles.quorumSlotLabel}>Quorum: {MOCK_GATHERING.quorum} needed per timeslot</div>
              <div style={styles.quorumSlotGrid}>
                {TIMESLOTS.map(ts => {
                  const cc = TIMESLOT_COMMITMENTS[ts.id] || 0;
                  const pct = Math.min(100, (cc / MOCK_GATHERING.quorum) * 100);
                  const isNear = cc === MOCK_GATHERING.quorum - 1;
                  return (
                    <div key={ts.id} style={styles.quorumSlotItem}>
                      <div style={styles.quorumSlotDate}>{formatDate(ts.date).split(",")[0]}</div>
                      <div style={styles.quorumSlotMiniBar}>
                        <div style={{
                          ...styles.quorumSlotMiniFill,
                          width: `${pct}%`,
                          background: isNear ? "#f9a825" : COLORS.blueLight,
                        }} />
                      </div>
                      <div style={{
                        ...styles.quorumSlotCount,
                        ...(isNear ? { color: "#f57f17", fontWeight: 700 } : {}),
                      }}>{cc}/{MOCK_GATHERING.quorum}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "Your vote could confirm" callout */}
            {TIMESLOTS.some(ts => (TIMESLOT_COMMITMENTS[ts.id] || 0) === MOCK_GATHERING.quorum - 1) && (
              <div style={styles.quorumCallout}>
                <SparkIcon />
                <span>A timeslot is 1 response away from quorum — your vote could confirm the gathering!</span>
              </div>
            )}

            {/* Global Location Filter — under gathering info */}
            {screen === 1 && (
              <GlobalLocationFilter
                locations={ALL_LOCATIONS}
                globalExclusions={globalLocationExclusions}
                onToggle={handleGlobalLocationToggle}
                inviteeCommutes={inviteeCommutes}
                onCommuteChange={handleCommuteChange}
              />
            )}
          </div>

          {/* Calendar connected indicator */}
          {screen === 1 && <CalendarConnectedIndicator />}

          {/* Screen 1: Selection */}
          {screen === 1 && (
            <div>
              <h3 style={styles.screenTitle}>What works for you?</h3>
              <p style={styles.screenDesc}>Review each timeslot and expand to see location details.</p>

              <div style={styles.tsListWrap}>
                {TIMESLOTS.map((ts) => (
                  <TimeslotRow
                    key={ts.id}
                    timeslot={ts}
                    selection={timeslotSelections[ts.id] || null}
                    onSelect={handleTimeslotSelect}
                    isExpanded={expandedTimeslot === ts.id}
                    onToggleExpand={() => setExpandedTimeslot(expandedTimeslot === ts.id ? null : ts.id)}
                    globalExclusions={globalLocationExclusions}
                    perSlotExclusions={locationExclusions}
                    onToggleLocation={handlePerSlotLocationToggle}
                    commitCount={TIMESLOT_COMMITMENTS[ts.id] || 0}
                    quorum={MOCK_GATHERING.quorum}
                    inviteeCommutes={inviteeCommutes}
                    maxCommuteMins={getMaxCommuteForTimeslot(ts)}
                    timelineAdjustment={timelineAdjustments[ts.id] || null}
                    onTimelineChange={(pos) => handleTimelineChange(ts.id, pos)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Screen 2: Ranking */}
          {screen === 2 && (
            <div>
              <h3 style={styles.screenTitle}>Rank your preferences</h3>
              <p style={styles.screenDesc}>Tap timeslots to assign your top {maxRanks > 1 ? maxRanks : ""} choice{maxRanks !== 1 ? "s" : ""}.</p>

              {/* Rank slots */}
              <div style={styles.rankSlotsRow}>
                {Array.from({ length: maxRanks }).map((_, i) => {
                  const tsId = rankings[i];
                  const ts = tsId ? TIMESLOTS.find(t => t.id === tsId) : null;
                  const rc = RANK_COLORS[i];
                  const slotIsProposed = ts && timeslotSelections[ts.id] === "proposed";
                  const slotCC = ts ? (TIMESLOT_COMMITMENTS[ts.id] || 0) : 0;
                  const slotReachesQuorum = ts && !slotIsProposed && slotCC === MOCK_GATHERING.quorum - 1;
                  // For proposed slots, show the adjusted time
                  const slotAdj = ts && timelineAdjustments[ts.id];
                  const slotTimeLabel = ts && slotIsProposed && slotAdj != null
                    ? `${formatTimePrecise(slotAdj)}\u2013${formatTimePrecise(slotAdj + MOCK_GATHERING.duration / 60)}`
                    : ts ? `${ts.timeStart}\u2013${ts.timeEnd}` : "";
                  return (
                    <div
                      key={i}
                      onClick={() => tsId && handleUnassignSlot(i)}
                      style={{
                        ...styles.rankSlot,
                        ...(ts ? { ...styles.rankSlotFilled, borderColor: rc.border, background: rc.bg, cursor: "pointer" } : {}),
                      }}
                    >
                      <div style={{ ...styles.rankSlotLabel, color: rc.badge }}>{rc.label}</div>
                      {ts ? (
                        <div style={styles.rankSlotContent}>
                          <div>{formatDate(ts.date)}</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{slotTimeLabel}</div>
                          {slotIsProposed ? (
                            <div style={{ fontSize: 10, color: "#f57f17", fontWeight: 700, marginTop: 2 }}>Proposed</div>
                          ) : slotReachesQuorum ? (
                            <div style={{ fontSize: 10, color: "#f9a825", fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                              <SparkIcon /> Quorum!
                            </div>
                          ) : (
                            <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>{slotCC + 1}/{MOCK_GATHERING.quorum} committed</div>
                          )}
                        </div>
                      ) : (
                        <div style={styles.rankSlotEmpty}>Tap below</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rankable timeslots (works + proposed) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rankableTimeslots.map(ts => {
                  const rankIndex = rankings.indexOf(ts.id);
                  const isRanked = rankIndex !== -1;
                  const allSlotsFull = rankings.slice(0, maxRanks).every(Boolean);
                  const rc = isRanked ? RANK_COLORS[rankIndex] : null;
                  const tsIsProposed = timeslotSelections[ts.id] === "proposed";
                  const includedCount = getIncludedLocationCount(ts, globalLocationExclusions, locationExclusions);
                  const includedLocs = ts.locations.filter(loc =>
                    !globalLocationExclusions.has(loc.name) && !(locationExclusions[ts.id] || new Set()).has(loc.name)
                  );
                  const cc = TIMESLOT_COMMITMENTS[ts.id] || 0;
                  const ccWithUser = cc + 1; // user marked "works"
                  const reachesQuorum = !tsIsProposed && cc === MOCK_GATHERING.quorum - 1;
                  // For proposed, show the adjusted time
                  const adj = timelineAdjustments[ts.id];
                  const displayTime = tsIsProposed && adj != null
                    ? `${formatTimePrecise(adj)}\u2013${formatTimePrecise(adj + MOCK_GATHERING.duration / 60)}`
                    : `${ts.timeStart}\u2013${ts.timeEnd}`;
                  return (
                    <button
                      key={ts.id}
                      onClick={() => handleRankToggle(ts.id)}
                      style={{
                        ...styles.rankOptionCard,
                        ...(isRanked ? { borderColor: rc.border, background: rc.bg } : {}),
                        ...(tsIsProposed && !isRanked ? { borderColor: "#ffe082", background: "#fffde7" } : {}),
                        ...(!isRanked && allSlotsFull ? { opacity: 0.45, cursor: "default" } : {}),
                      }}
                    >
                      {isRanked && (
                        <div style={{ ...styles.rankBadge, background: rc.badge }}>{rankIndex + 1}</div>
                      )}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                          {formatDate(ts.date)} &middot; {displayTime}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>{includedLocs.map(l => l.name.split(" \u2014 ")[0]).join(", ")}</span>
                          {includedCount === 0 && <span style={{ color: "#e53935" }}>No locations</span>}
                          {tsIsProposed ? (
                            <span style={styles.proposedNewBadge}>New option</span>
                          ) : reachesQuorum ? (
                            <span style={{ color: "#f9a825", fontWeight: 700, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <SparkIcon /> Reaches quorum
                            </span>
                          ) : (
                            <span style={{ color: COLORS.textLight, fontSize: 11 }}>{ccWithUser}/{MOCK_GATHERING.quorum}</span>
                          )}
                        </div>
                      </div>
                      {isRanked && (
                        <div style={{ color: COLORS.textLight, fontSize: 11 }}>tap to remove</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Proposed times note */}
              {proposedCount > 0 && (
                <div style={styles.proposedNote}>
                  <QuestionIcon /> Proposed times will be added as new options for others to vote on.
                </div>
              )}

              {/* Expiration */}
              <div style={styles.expirationSection}>
                <label style={styles.fieldLabel}>My availability expires on</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={getTomorrowDate()}
                  max={getMaxExpiration()}
                  style={styles.dateInput}
                />
                <p style={styles.fieldNote}>After this date, the host will know your selections may no longer be valid.</p>
              </div>

              {/* Notes */}
              <div style={{ marginTop: 20 }}>
                <label style={styles.fieldLabel}>Notes <span style={styles.fieldHint}>(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any constraints or preferences the host should know about..."
                  style={styles.textArea}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={styles.navRow}>
          {screen === 2 && <button onClick={() => setScreen(1)} style={styles.backBtn}>Back</button>}
          <div style={{ flex: 1 }} />
          {screen === 1 ? (
            <button
              onClick={() => canContinue && setScreen(2)}
              style={{ ...styles.primaryBtn, ...(canContinue ? {} : styles.primaryBtnDisabled) }}
              disabled={!canContinue}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={() => canSubmit && setScreen(3)}
              style={{ ...styles.publishBtn, ...(canSubmit ? {} : styles.primaryBtnDisabled) }}
              disabled={!canSubmit}
            >
              Submit Response
            </button>
          )}
        </div>

        {/* Selection summary footer (Screen 1) */}
        {screen === 1 && (worksCount > 0 || proposedCount > 0 || doesntWorkCount > 0) && (
          <div style={styles.selectionFooter}>
            <div style={styles.selectionCount}>
              {worksCount > 0 && <span style={{ color: "#43a047", fontWeight: 600 }}>{worksCount} work{worksCount !== 1 ? "" : "s"}</span>}
              {proposedCount > 0 && <span style={{ color: "#f9a825", fontWeight: 600 }}>{proposedCount} proposed</span>}
              {doesntWorkCount > 0 && <span style={{ color: "#e53935", fontWeight: 600 }}>{doesntWorkCount} don't work</span>}
            </div>
            <span style={{ fontSize: 12, color: COLORS.textLight }}>{TIMESLOTS.length - worksCount - proposedCount - doesntWorkCount} remaining</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Styles ---
const styles = {
  container: { minHeight: "100vh", background: GRADIENTS.background, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", fontFamily: FONTS.base },
  card: { background: COLORS.cardBg, borderRadius: 20, maxWidth: 660, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)", overflow: "hidden" },
  header: { padding: "32px 32px 20px", borderBottom: "1px solid #f0f0f0" },
  backToHub: { display: "flex", alignItems: "center", background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "0 0 14px", fontFamily: FONTS.base, transition: "color 0.2s" },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logo: { width: 36, height: 36, borderRadius: 10, background: GRADIENTS.primaryBtn, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, letterSpacing: -0.5 },
  logoText: { fontSize: 20, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, margin: "4px 0 0" },

  // Step indicator
  stepRow: { display: "flex", alignItems: "center", padding: "24px 32px 8px", gap: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: 8 },
  stepDot: { width: 36, height: 36, borderRadius: "50%", border: "2px solid #dde3ea", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0bac5", flexShrink: 0, transition: "all 0.3s" },
  stepDotActive: { borderColor: "#2e86c1", color: "#2e86c1", background: "#eaf4fb" },
  stepDotDone: { borderColor: "#43a047", background: "#43a047", color: "#fff" },
  stepLabel: { fontSize: 12, fontWeight: 500, color: "#b0bac5", whiteSpace: "nowrap" },
  stepLabelActive: { color: COLORS.text, fontWeight: 600 },
  stepLabelDone: { color: "#43a047" },
  stepLine: { flex: 1, height: 2, background: "#e8ecf0", margin: "0 8px", borderRadius: 1, transition: "background 0.3s" },
  stepLineDone: { background: "#43a047" },
  stepContent: { padding: "24px 32px", minHeight: 300 },

  // Gathering info
  gatheringInfo: { padding: "16px 20px", background: "#f5f7fa", borderRadius: 14, marginBottom: 16 },
  gatheringTitle: { fontSize: 17, fontWeight: 700, color: COLORS.text, margin: "0 0 8px", letterSpacing: -0.2 },
  gatheringMeta: { display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#5a6a7a", marginBottom: 12 },
  gatheringMetaItem: { display: "flex", alignItems: "center", gap: 5 },
  quorumRow: { display: "flex", alignItems: "center", gap: 10 },
  quorumLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: 500, whiteSpace: "nowrap" },
  quorumBar: { flex: 1, height: 4, borderRadius: 2, background: "#e0e5eb", overflow: "hidden" },
  quorumBarFill: { height: "100%", borderRadius: 2, background: COLORS.blueLight, transition: "width 0.3s" },

  // Quorum slot summary
  quorumSlotSummary: { marginTop: 12, paddingTop: 10, borderTop: "1px solid #e0e5eb" },
  quorumSlotLabel: { fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 },
  quorumSlotGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  quorumSlotItem: { display: "flex", flexDirection: "column", gap: 3, alignItems: "center" },
  quorumSlotDate: { fontSize: 11, fontWeight: 600, color: "#5a6a7a" },
  quorumSlotMiniBar: { width: "100%", height: 4, borderRadius: 2, background: "#e0e5eb", overflow: "hidden" },
  quorumSlotMiniFill: { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  quorumSlotCount: { fontSize: 11, color: COLORS.textMuted, fontWeight: 500 },

  // Quorum callout
  quorumCallout: {
    display: "flex", alignItems: "center", gap: 8, marginTop: 12,
    padding: "10px 14px", borderRadius: 10,
    background: "#fffde7", border: "1.5px solid #ffe082",
    fontSize: 13, fontWeight: 600, color: "#f57f17", lineHeight: 1.4,
  },

  // Global location filter
  globalLocFilter: { marginTop: 14, paddingTop: 12, borderTop: "1px solid #e0e5eb" },
  globalLocLabel: { fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  globalLocRow: {
    display: "flex", alignItems: "center", gap: 10, width: "100%",
    padding: "8px 10px", borderRadius: 10, border: "none",
    background: "transparent", cursor: "pointer", fontFamily: FONTS.base,
    transition: "background 0.15s",
  },
  globalLocCard: { display: "flex", flexDirection: "column", marginBottom: 4 },
  globalLocCommuteWrap: { padding: "0 10px 6px 40px" },
  excludedTag: { fontSize: 11, color: "#e53935", fontWeight: 600, padding: "2px 8px", background: "#ffebee", borderRadius: 6 },

  // Calendar connected
  calConnected: { display: "flex", alignItems: "center", padding: "8px 0", marginBottom: 12 },

  // Screen titles
  screenTitle: { fontSize: 17, fontWeight: 700, color: COLORS.text, margin: "0 0 6px", letterSpacing: -0.2 },
  screenDesc: { fontSize: 14, color: COLORS.textMuted, margin: "0 0 16px", lineHeight: 1.5 },

  // Timeslot list
  tsListWrap: { display: "flex", flexDirection: "column", gap: 10 },

  // Timeslot card
  tsCard: {
    borderRadius: 14, border: `1.5px solid ${COLORS.borderLight}`, background: "#fff",
    overflow: "hidden", transition: "all 0.2s",
  },
  tsCardWorks: { borderColor: "#a5d6a7", background: "#f1f8e9" },
  tsCardProposed: { borderColor: "#ffe082", background: "#fffde7" },
  tsCardDoesntWork: { borderColor: "#ffcdd2", background: "#fff5f5", opacity: 0.65 },
  tsMainRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 16px", cursor: "pointer", userSelect: "none",
  },
  tsAvailBar: { width: 4, height: 36, borderRadius: 2, flexShrink: 0 },
  tsDateRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 3 },
  tsDate: { fontSize: 14, fontWeight: 700, color: COLORS.text },
  tsDot: { fontSize: 14, color: COLORS.textLight },
  tsTime: { fontSize: 13, fontWeight: 500, color: COLORS.textMuted },
  tsLocCountRow: { display: "flex", alignItems: "center", gap: 10 },
  tsLocCount: { fontSize: 12, color: COLORS.textMuted },
  tsMetaSep: { fontSize: 12, color: "#d0d8e0", margin: "0 2px" },
  tsCommitCount: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: COLORS.textMuted, fontWeight: 500 },
  tsCommitNear: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#f57f17", fontWeight: 700 },
  tsCommitQuorum: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#43a047", fontWeight: 700 },
  tsAvailLabel: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 600, cursor: "pointer",
  },
  tsToggles: { display: "flex", gap: 6, flexShrink: 0 },
  tsToggleBtn: {
    width: 36, height: 36, borderRadius: 10,
    border: `1.5px solid ${COLORS.border}`, background: COLORS.fieldBg,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#7a8a9a", cursor: "pointer", transition: "all 0.2s",
    fontFamily: FONTS.base, padding: 0,
  },
  tsToggleBtnWorks: { borderColor: "#43a047", background: "#43a047", color: "#fff" },
  tsToggleBtnProposed: { borderColor: "#f9a825", background: "#f9a825", color: "#fff" },
  tsToggleBtnDoesntWork: { borderColor: "#e53935", background: "#e53935", color: "#fff" },
  tsToggleBtnDisabled: { opacity: 0.35, cursor: "not-allowed", pointerEvents: "none" },

  // Expanded location panel
  expandedPanel: {
    borderTop: `1px solid ${COLORS.borderLight}`,
    padding: "8px 16px 12px 28px",
    background: "#fafbfc",
  },
  locRow: {
    display: "flex", alignItems: "center", gap: 10, width: "100%",
    padding: "8px 10px", borderRadius: 10, border: "none",
    background: "transparent", fontFamily: FONTS.base,
    transition: "background 0.15s",
  },
  locRowLocked: { opacity: 0.55 },
  locRowExcluded: { opacity: 0.7 },
  locAvailPill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
  },
  locAvailGreen: { background: "#e8f5e9", color: "#2e7d32" },
  locAvailAmber: { background: "#fff8e1", color: "#f57f17" },
  locAvailRed: { background: "#ffebee", color: "#c62828" },
  locLockedLabel: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 600, color: "#b0bac5",
  },
  locCommutePill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
    background: "#eef2f7", color: "#5a6a7a",
  },

  // Popover
  popover: { width: 260, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)", padding: 0, overflow: "hidden", cursor: "default" },
  popoverHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f0f0f0", background: "#fafbfc" },
  popoverTitle: { fontSize: 13, fontWeight: 700, color: COLORS.text },
  popoverBadge: { display: "flex", alignItems: "center", fontSize: 10, color: "#4285f4", fontWeight: 600, background: "#e8f0fe", padding: "2px 8px", borderRadius: 10 },
  popoverWindow: { padding: "6px 14px", background: "#f5f7fa", fontSize: 11, color: "#6a7585", fontWeight: 600, borderBottom: "1px solid #f0f0f0" },
  popoverList: { listStyle: "none", padding: "8px 14px 10px", margin: 0, display: "flex", flexDirection: "column", gap: 5 },
  popoverListItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.text, lineHeight: 1.3 },
  popoverBullet: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  popoverItemText: { fontSize: 11, color: "#4a5568" },

  // Selection footer
  selectionFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 32px 16px", borderTop: "1px solid #f0f0f0", background: "#f9fafb" },
  selectionCount: { display: "flex", gap: 16, fontSize: 13 },

  // Rank slots
  rankSlotsRow: { display: "flex", gap: 10, marginBottom: 20 },
  rankSlot: { flex: 1, padding: "12px 10px", borderRadius: 12, border: "2px dashed #d0d8e0", minHeight: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", transition: "all 0.2s" },
  rankSlotFilled: { borderStyle: "solid" },
  rankSlotLabel: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  rankSlotContent: { fontSize: 12, fontWeight: 600, color: COLORS.text, lineHeight: 1.4 },
  rankSlotEmpty: { fontSize: 12, color: "#b0bac5", fontStyle: "italic" },

  // Rank option cards
  rankOptionCard: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${COLORS.borderLight}`, background: "#fff", cursor: "pointer", fontFamily: FONTS.base, transition: "all 0.2s", width: "100%", textAlign: "left" },
  rankBadge: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 },

  // Expiration & notes
  // Proposed times summary (screen 2)
  proposedNote: {
    display: "flex", alignItems: "center", gap: 6,
    marginTop: 12, padding: "8px 12px", borderRadius: 8,
    background: "#fffde7", border: "1px solid #ffe082",
    fontSize: 12, color: "#f57f17", fontWeight: 500, lineHeight: 1.4,
  },
  proposedNewBadge: {
    fontSize: 10, fontWeight: 700, color: "#f57f17",
    background: "#fff8e1", padding: "1px 6px", borderRadius: 4,
  },

  expirationSection: { marginTop: 24, paddingTop: 20, borderTop: "1px solid #eef1f5" },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 6 },
  fieldHint: { fontWeight: 400, color: COLORS.textLight },
  fieldNote: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  dateInput: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, fontWeight: 500, color: COLORS.text, background: COLORS.fieldBg, fontFamily: FONTS.base, outline: "none" },
  textArea: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, color: COLORS.text, background: COLORS.fieldBg, fontFamily: FONTS.base, outline: "none", minHeight: 80, resize: "vertical", lineHeight: 1.5 },

  // Navigation
  navRow: { display: "flex", alignItems: "center", padding: "16px 32px 28px", gap: 12 },
  backBtn: { padding: "11px 24px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, background: "#fff", fontSize: 14, fontWeight: 600, color: "#4a5568", cursor: "pointer", fontFamily: FONTS.base, transition: "all 0.2s" },
  primaryBtn: { padding: "11px 28px", borderRadius: 10, border: "none", background: GRADIENTS.primaryBtn, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: FONTS.base, transition: "all 0.2s", boxShadow: "0 2px 8px rgba(26,82,118,0.25)" },
  primaryBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  publishBtn: { padding: "11px 28px", borderRadius: 10, border: "none", background: GRADIENTS.greenBtn, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: FONTS.base, transition: "all 0.2s", boxShadow: "0 2px 8px rgba(30,126,52,0.25)" },

  // Confirmation
  confirmBody: { display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 32px", textAlign: "center" },
  confirmTitle: { fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 10px" },
  confirmSub: { fontSize: 15, color: COLORS.textMuted, lineHeight: 1.6, maxWidth: 400, margin: "0 0 24px" },
  confirmStats: { display: "flex", gap: 24, alignItems: "center" },
  confirmStat: { display: "flex", flexDirection: "column", gap: 4, alignItems: "center" },
  confirmStatLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: 500 },
  confirmStatValue: { fontSize: 20, fontWeight: 700, color: COLORS.text },
  confirmStatDivider: { width: 1, height: 32, background: "#e8ecf0" },

  // Per-location commute & directions
  locCard: { display: "flex", flexDirection: "column" },
  locDirectionsLink: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: COLORS.blueLight, textDecoration: "none", borderBottom: "1px dashed " + COLORS.blueLight, lineHeight: 1, transition: "opacity 0.15s" },
  locCommuteWrap: { padding: "0 10px 6px 40px" },
  locCommuteRow: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#5a6a7a" },
  locCommuteValue: { fontWeight: 600, color: COLORS.text, borderBottom: "1px dashed #b0bac5", lineHeight: 1.2 },
  locCommuteInput: { width: 44, padding: "2px 4px", borderRadius: 5, border: `1.5px solid ${COLORS.blueLight}`, fontSize: 12, fontWeight: 600, color: COLORS.text, outline: "none", fontFamily: FONTS.base, background: "#fff", textAlign: "center" },
  locCommuteUnit: { fontSize: 11, color: COLORS.textMuted },

  // Invitee timeline
  invTimelineWrap: { padding: "10px 16px 14px 28px", borderTop: `1px solid ${COLORS.borderLight}`, background: "#f5f7fa" },
  invTimelineHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  invTimelineLabel: { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  invTimelineReset: { fontSize: 11, fontWeight: 600, color: COLORS.blueLight, background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.base, padding: "2px 6px", borderRadius: 4, transition: "background 0.15s" },
  invTimelineBar: { position: "relative", height: 32, borderRadius: 8, background: "#e8ecf0", overflow: "hidden" },
  invBusyRow: { position: "relative", height: 6, marginTop: 2 },
  invTimelineLabels: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: COLORS.textMuted, marginTop: 3, padding: "0 2px" },
  invTimelineWarning: { fontSize: 12, color: "#e65100", background: "#fff8f0", border: "1px solid #ffe0b2", borderRadius: 8, padding: "8px 12px", lineHeight: 1.4 },
};
