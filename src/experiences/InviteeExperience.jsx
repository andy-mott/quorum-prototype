import { useState, useEffect } from "react";
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

function parseTimeToHour(timeStr) {
  if (!timeStr) return 9;
  const [time, ampm] = timeStr.split(" ");
  let [hr, min] = time.split(":").map(Number);
  if (ampm === "PM" && hr !== 12) hr += 12;
  if (ampm === "AM" && hr === 12) hr = 0;
  return hr + min / 60;
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
        <span>{timeslot.timeStart} \u2014 {timeslot.timeEnd}</span>
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

function GlobalLocationFilter({ locations, globalExclusions, onToggle }) {
  return (
    <div style={styles.globalLocFilter}>
      <div style={styles.globalLocLabel}>Locations</div>
      {locations.map((loc) => {
        const included = !globalExclusions.has(loc.name);
        return (
          <button
            key={loc.name}
            onClick={() => onToggle(loc.name)}
            style={styles.globalLocRow}
          >
            <CheckboxIcon checked={included} locked={false} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: included ? COLORS.text : COLORS.textLight }}>{loc.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{loc.address}</div>
            </div>
            {!included && (
              <span style={styles.excludedTag}>Excluded from all</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ExpandedLocationPanel({ timeslot, globalExclusions, perSlotExclusions, onToggleLocation }) {
  const slotExclusions = perSlotExclusions[timeslot.id] || new Set();

  return (
    <div style={styles.expandedPanel}>
      {timeslot.locations.map((loc) => {
        const isGloballyExcluded = globalExclusions.has(loc.name);
        const isLocallyExcluded = slotExclusions.has(loc.name);
        const isIncluded = !isGloballyExcluded && !isLocallyExcluded;
        const avail = getLocationAvailability(timeslot.date, timeslot.timeStart, timeslot.timeEnd);
        const availPill = isIncluded ? (
          avail.level === "green" ? styles.locAvailGreen :
          avail.level === "amber" ? styles.locAvailAmber : styles.locAvailRed
        ) : null;

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
              <span style={{ ...styles.locAvailPill, ...availPill }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: BULLET_COLORS[avail.level] }} />
                {AVAIL_LABELS[avail.level]}
              </span>
            ) : null}
          </button>
        );
      })}
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
}) {
  const [showPopover, setShowPopover] = useState(false);
  const avail = getTimeslotAvailability(timeslot, globalExclusions, perSlotExclusions);
  const includedCount = getIncludedLocationCount(timeslot, globalExclusions, perSlotExclusions);
  const isWorks = selection === "works";
  const isDoesntWork = selection === "doesnt-work";

  return (
    <div style={{
      ...styles.tsCard,
      ...(isWorks ? styles.tsCardWorks : {}),
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
            <span style={styles.tsTime}>{timeslot.timeStart}\u2013{timeslot.timeEnd}</span>
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
          </div>
        </div>

        {/* Toggle buttons */}
        <div style={styles.tsToggles} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSelect(timeslot.id, isWorks ? null : "works")}
            style={{ ...styles.tsToggleBtn, ...(isWorks ? styles.tsToggleBtnWorks : {}) }}
            title="Works for me"
          >
            <CheckIcon />
          </button>
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

      {/* Expanded location panel */}
      {isExpanded && (
        <ExpandedLocationPanel
          timeslot={timeslot}
          globalExclusions={globalExclusions}
          perSlotExclusions={perSlotExclusions}
          onToggleLocation={onToggleLocation}
        />
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

  const worksTimeslots = TIMESLOTS.filter(ts => timeslotSelections[ts.id] === "works");
  const worksCount = worksTimeslots.length;
  const doesntWorkCount = Object.values(timeslotSelections).filter(v => v === "doesnt-work").length;

  const maxRanks = Math.min(3, worksCount);

  // Clear invalid rankings when works selections change
  useEffect(() => {
    const worksIds = new Set(worksTimeslots.map(ts => ts.id));
    setRankings(prev => prev.map(id => (id && !worksIds.has(id)) ? null : id));
  }, [worksCount]);

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

  const handleUnassignSlot = (slotIndex) => {
    const next = [...rankings];
    next[slotIndex] = null;
    setRankings(next);
  };

  const filledRanks = rankings.filter(Boolean).length;
  const canContinue = worksCount >= 1;
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
              You ranked <strong>{filledRanks} timeslot preference{filledRanks !== 1 ? "s" : ""}</strong> from {worksCount} available slot{worksCount !== 1 ? "s" : ""}.
              {expirationDate && <><br/>Your availability expires <strong>{new Date(expirationDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.</>}
            </p>
            <div style={styles.confirmStats}>
              <div style={styles.confirmStat}>
                <span style={styles.confirmStatLabel}>Quorum progress</span>
                <span style={styles.confirmStatValue}>{MOCK_GATHERING.responsesReceived + 1} / {MOCK_GATHERING.quorum}</span>
              </div>
              <div style={styles.confirmStatDivider} />
              <div style={styles.confirmStat}>
                <span style={styles.confirmStatLabel}>Your #1 pick</span>
                <span style={{ ...styles.confirmStatValue, fontSize: 14 }}>
                  {rankings[0] ? (() => {
                    const ts = TIMESLOTS.find(t => t.id === rankings[0]);
                    return ts ? `${formatDate(ts.date)}, ${ts.timeStart}\u2013${ts.timeEnd}` : "";
                  })() : "\u2014"}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, marginTop: 16 }}>
              The host will notify you when quorum is reached and the gathering is confirmed.
            </p>
            <button
              style={{ ...styles.primaryBtn, marginTop: 24, maxWidth: 240 }}
              onClick={() => {
                setScreen(1);
                setTimeslotSelections({});
                setGlobalLocationExclusions(new Set());
                setLocationExclusions({});
                setExpandedTimeslot(null);
                setRankings([null, null, null]);
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
              <span style={styles.quorumLabel}>{MOCK_GATHERING.responsesReceived} of {MOCK_GATHERING.quorum} responses needed</span>
              <div style={styles.quorumBar}>
                <div style={{ ...styles.quorumBarFill, width: `${Math.min(100, quorumProgress * 100)}%` }} />
              </div>
            </div>

            {/* Global Location Filter — under gathering info */}
            {screen === 1 && (
              <GlobalLocationFilter
                locations={ALL_LOCATIONS}
                globalExclusions={globalLocationExclusions}
                onToggle={handleGlobalLocationToggle}
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
                  const includedCount = ts ? getIncludedLocationCount(ts, globalLocationExclusions, locationExclusions) : 0;
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
                          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{ts.timeStart}\u2013{ts.timeEnd}</div>
                          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>{includedCount} location{includedCount !== 1 ? "s" : ""}</div>
                        </div>
                      ) : (
                        <div style={styles.rankSlotEmpty}>Tap below</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rankable timeslots */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {worksTimeslots.map(ts => {
                  const rankIndex = rankings.indexOf(ts.id);
                  const isRanked = rankIndex !== -1;
                  const allSlotsFull = rankings.slice(0, maxRanks).every(Boolean);
                  const rc = isRanked ? RANK_COLORS[rankIndex] : null;
                  const includedCount = getIncludedLocationCount(ts, globalLocationExclusions, locationExclusions);
                  const includedLocs = ts.locations.filter(loc =>
                    !globalLocationExclusions.has(loc.name) && !(locationExclusions[ts.id] || new Set()).has(loc.name)
                  );
                  return (
                    <button
                      key={ts.id}
                      onClick={() => handleRankToggle(ts.id)}
                      style={{
                        ...styles.rankOptionCard,
                        ...(isRanked ? { borderColor: rc.border, background: rc.bg } : {}),
                        ...(!isRanked && allSlotsFull ? { opacity: 0.45, cursor: "default" } : {}),
                      }}
                    >
                      {isRanked && (
                        <div style={{ ...styles.rankBadge, background: rc.badge }}>{rankIndex + 1}</div>
                      )}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                          {formatDate(ts.date)} &middot; {ts.timeStart}\u2013{ts.timeEnd}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                          {includedLocs.map(l => l.name.split(" \u2014 ")[0]).join(", ")}
                          {includedCount === 0 && <span style={{ color: "#e53935" }}>No locations</span>}
                        </div>
                      </div>
                      {isRanked && (
                        <div style={{ color: COLORS.textLight, fontSize: 11 }}>tap to remove</div>
                      )}
                    </button>
                  );
                })}
              </div>

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
        {screen === 1 && (worksCount > 0 || doesntWorkCount > 0) && (
          <div style={styles.selectionFooter}>
            <div style={styles.selectionCount}>
              {worksCount > 0 && <span style={{ color: "#43a047", fontWeight: 600 }}>{worksCount} work{worksCount !== 1 ? "" : "s"}</span>}
              {doesntWorkCount > 0 && <span style={{ color: "#e53935", fontWeight: 600 }}>{doesntWorkCount} don't work</span>}
            </div>
            <span style={{ fontSize: 12, color: COLORS.textLight }}>{TIMESLOTS.length - worksCount - doesntWorkCount} remaining</span>
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

  // Global location filter
  globalLocFilter: { marginTop: 14, paddingTop: 12, borderTop: "1px solid #e0e5eb" },
  globalLocLabel: { fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  globalLocRow: {
    display: "flex", alignItems: "center", gap: 10, width: "100%",
    padding: "8px 10px", borderRadius: 10, border: "none",
    background: "transparent", cursor: "pointer", fontFamily: FONTS.base,
    transition: "background 0.15s",
  },
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
  tsToggleBtnDoesntWork: { borderColor: "#e53935", background: "#e53935", color: "#fff" },

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
};
