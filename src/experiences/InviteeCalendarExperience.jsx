import { useState, useMemo } from "react";
import { COLORS, GRADIENTS, FONTS } from "../shared/styles";

// --- Mock Gathering Data (same as InviteeExperience) ---
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

const TIMESLOTS = (() => {
  const map = {};
  for (const opt of MOCK_OPTIONS) {
    const key = `${opt.date}|${opt.timeStart}|${opt.timeEnd}`;
    if (!map[key]) {
      map[key] = { id: `ts-${Object.keys(map).length + 1}`, date: opt.date, timeStart: opt.timeStart, timeEnd: opt.timeEnd, locations: [] };
    }
    map[key].locations.push({ name: opt.locationName, address: opt.locationAddr });
  }
  return Object.values(map);
})();

const TIMESLOT_WINDOWS = {
  "ts-1": { windowStart: "8:00 AM", windowEnd: "2:00 PM", hostEarliestStart: 8.5, hostLatestEnd: 13.5 },
  "ts-2": { windowStart: "8:00 AM", windowEnd: "2:00 PM", hostEarliestStart: 8.5, hostLatestEnd: 13.5 },
  "ts-3": { windowStart: "12:00 PM", windowEnd: "6:00 PM", hostEarliestStart: 12.33, hostLatestEnd: 17.67 },
  "ts-4": { windowStart: "12:00 PM", windowEnd: "6:00 PM", hostEarliestStart: 12.33, hostLatestEnd: 17.67 },
};

const TIMESLOT_COMMITMENTS = { "ts-1": 4, "ts-2": 2, "ts-3": 3, "ts-4": 1 };

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

// --- Utility Functions ---
function formatTimePrecise(h) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, "0")} ${ampm}`;
}

// Calendar helpers
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function toDateKey(year, month, day) { return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
function isPast(year, month, day) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(year, month, day) < today;
}

// Derived data
const AVAILABLE_DATES = new Set(MOCK_OPTIONS.map(opt => opt.date));
const DATES_BY_KEY = (() => {
  const m = {};
  for (const ts of TIMESLOTS) {
    if (!m[ts.date]) m[ts.date] = [];
    m[ts.date].push(ts);
  }
  return m;
})();

// Slot carving: non-overlapping contiguous slots from the effective window
function carveSlotsForDate(dateKey) {
  const timeslots = DATES_BY_KEY[dateKey] || [];
  const durationHrs = MOCK_GATHERING.duration / 60;
  const allSlots = [];

  for (const ts of timeslots) {
    const win = TIMESLOT_WINDOWS[ts.id];
    if (!win) continue;
    const effectiveStart = win.hostEarliestStart;
    const effectiveEnd = win.hostLatestEnd;
    let cursor = effectiveStart;
    let idx = 0;
    while (cursor + durationHrs <= effectiveEnd + 0.001) {
      allSlots.push({
        id: `${dateKey}_${ts.id}_${idx}`,
        timeslotId: ts.id,
        date: dateKey,
        start: cursor,
        end: cursor + durationHrs,
        startLabel: formatTimePrecise(cursor),
        endLabel: formatTimePrecise(cursor + durationHrs),
        locations: ts.locations,
      });
      cursor += durationHrs;
      idx++;
    }
  }
  return allSlots;
}

// Conflict detection for a single slot
function getSlotConflicts(dateKey, slotStart, slotEnd) {
  const events = DETERMINISTIC_EVENTS[dateKey] || [];
  const overlapping = [];
  let busyMinutes = 0;
  const slotDuration = (slotEnd - slotStart) * 60;

  for (const ev of events) {
    const overlapStart = Math.max(ev.start, slotStart);
    const overlapEnd = Math.min(ev.end, slotEnd);
    if (overlapStart < overlapEnd) {
      busyMinutes += (overlapEnd - overlapStart) * 60;
      overlapping.push({
        title: ev.title,
        color: ev.color,
        overlapStart,
        overlapEnd,
        startLabel: formatTimePrecise(overlapStart),
        endLabel: formatTimePrecise(overlapEnd),
      });
    }
  }

  const busyFraction = slotDuration > 0 ? busyMinutes / slotDuration : 0;
  const level = busyFraction === 0 ? "free" : busyFraction >= 0.99 ? "full" : "partial";
  return { level, busyFraction, overlapping };
}

// Get best availability level for a date (for calendar dot color)
function getDateAvailabilityLevel(dateKey) {
  const slots = carveSlotsForDate(dateKey);
  if (slots.length === 0) return null;
  let hasFree = false;
  let hasPartial = false;
  for (const s of slots) {
    const c = getSlotConflicts(s.date, s.start, s.end);
    if (c.level === "free") hasFree = true;
    else if (c.level === "partial") hasPartial = true;
  }
  return hasFree ? "green" : hasPartial ? "amber" : "red";
}

// --- SVG Icons ---
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M8 1C5.24 1 3 3.24 3 6c0 4.5 5 9 5 9s5-4.5 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 4.5V8L10.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const BackArrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <path d="M2 7H14" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M11 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// --- Sub-Components ---

function ConflictTooltip({ event }) {
  return (
    <div style={styles.tooltip}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: event.color || "#e53935", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{event.title}</span>
      </div>
      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{event.startLabel} {"\u2013"} {event.endLabel}</div>
      <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 4 }}>Google Calendar</div>
    </div>
  );
}

function BusyIndicator({ conflicts, slotStart, slotEnd }) {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const slotDuration = slotEnd - slotStart;
  const isFree = conflicts.level === "free";

  return (
    <div style={{
      position: "relative",
      width: 5,
      minHeight: "100%",
      borderRadius: "3px 0 0 3px",
      background: isFree ? "#c8e6c9" : "#ffcdd2",
      flexShrink: 0,
      overflow: "visible",
    }}>
      {conflicts.overlapping.map((ev, i) => {
        const topPct = ((ev.overlapStart - slotStart) / slotDuration) * 100;
        const heightPct = ((ev.overlapEnd - ev.overlapStart) / slotDuration) * 100;
        return (
          <div
            key={i}
            onMouseEnter={() => setHoveredEvent(ev)}
            onMouseLeave={() => setHoveredEvent(null)}
            style={{
              position: "absolute",
              top: `${topPct}%`,
              height: `${heightPct}%`,
              left: 0, width: "100%",
              background: "#e53935",
              borderRadius: 2,
              cursor: "pointer",
              minHeight: 4,
            }}
          />
        );
      })}
      {hoveredEvent && <ConflictTooltip event={hoveredEvent} />}
    </div>
  );
}

function SlotCard({ slot, isSelected, onToggle, conflicts }) {
  const [hovered, setHovered] = useState(false);
  const commitCount = TIMESLOT_COMMITMENTS[slot.timeslotId] || 0;

  return (
    <button
      onClick={() => onToggle(slot.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.slotCard,
        borderColor: isSelected ? "#43a047" : hovered ? COLORS.blueLight : "#e8ecf0",
        background: isSelected ? "#f1f8e9" : hovered ? "#f8fafd" : "#fff",
      }}
    >
      <BusyIndicator conflicts={conflicts} slotStart={slot.start} slotEnd={slot.end} />
      <div style={styles.slotContent}>
        <div style={styles.slotTime}>{slot.startLabel} {"\u2013"} {slot.endLabel}</div>
        {conflicts.level === "partial" && (
          <div style={{ fontSize: 11, color: "#f57f17", marginTop: 1 }}>Partial conflict</div>
        )}
        {conflicts.level === "full" && (
          <div style={{ fontSize: 11, color: "#e53935", marginTop: 1 }}>Fully busy</div>
        )}
        {commitCount > 0 && (
          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>
            {commitCount} other{commitCount !== 1 ? "s" : ""} available
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: "0 12px", color: isSelected ? "#43a047" : "transparent" }}>
        <CheckIcon />
      </div>
    </button>
  );
}

function CalendarMonth({ viewYear, viewMonth, onPrevMonth, onNextMonth, availableDates, selectedDate, onSelectDate, selectedSlots }) {
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Count selected slots per date for badge
  const selectedCountByDate = {};
  for (const [slotId, val] of Object.entries(selectedSlots)) {
    if (!val) continue;
    const dateKey = slotId.split("_")[0] + "_" + slotId.split("_")[1]; // gets "2026-03-05"
    // Actually the slot id format is "2026-03-05_ts-1_0" so the date is the first part up to second underscore
    // Let's parse properly:
    const parts = slotId.split("_");
    const dk = parts[0]; // "2026-03-05"
    selectedCountByDate[dk] = (selectedCountByDate[dk] || 0) + 1;
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = toDateKey(viewYear, viewMonth, day);
    const hasAvail = availableDates.has(dateKey);
    const isSelected = selectedDate === dateKey;
    const past = isPast(viewYear, viewMonth, day);
    const selCount = selectedCountByDate[dateKey] || 0;
    const availLevel = hasAvail && !past ? getDateAvailabilityLevel(dateKey) : null;
    const dotColor = availLevel === "green" ? "#43a047" : availLevel === "amber" ? "#f9a825" : availLevel === "red" ? "#e53935" : null;

    cells.push(
      <button
        key={day}
        onClick={() => hasAvail && !past && onSelectDate(dateKey)}
        style={{
          ...styles.dayCell,
          color: past ? "#ccc" : hasAvail ? COLORS.text : "#b0b8c2",
          cursor: hasAvail && !past ? "pointer" : "default",
          fontWeight: hasAvail ? 700 : 400,
          background: isSelected ? COLORS.blueLight : "transparent",
          ...(isSelected ? { color: "#fff", borderRadius: 10 } : {}),
        }}
      >
        <span>{day}</span>
        {dotColor && !isSelected && (
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, marginTop: 2 }} />
        )}
        {selCount > 0 && !isSelected && (
          <div style={styles.dayBadge}>{selCount}</div>
        )}
        {selCount > 0 && isSelected && (
          <div style={{ ...styles.dayBadge, background: "#fff", color: COLORS.blueLight }}>{selCount}</div>
        )}
      </button>
    );
  }

  return (
    <div>
      <div style={styles.calHeader}>
        <button onClick={onPrevMonth} style={styles.calNavBtn}><ChevronLeft /></button>
        <span style={styles.calTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={onNextMonth} style={styles.calNavBtn}><ChevronRight /></button>
      </div>
      <div style={styles.calDowRow}>
        {DAYS_OF_WEEK.map(d => <div key={d} style={styles.calDow}>{d}</div>)}
      </div>
      <div style={styles.calGrid}>{cells}</div>
    </div>
  );
}

function DaySidebar({ dateKey, slots, selectedSlots, onToggleSlot }) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dateLabel = dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const locations = slots.length > 0 ? slots[0].locations : [];

  return (
    <div style={styles.sidebar}>
      <h3 style={styles.sidebarDate}>{dateLabel}</h3>
      <div style={styles.locationPills}>
        {locations.map(loc => (
          <div key={loc.name} style={styles.locationPill}>
            <MapPinIcon /> <span>{loc.name.split(" \u2014 ")[0]}</span>
          </div>
        ))}
      </div>
      <div style={styles.slotsHeader}>
        <ClockIcon />
        <span>Available slots ({slots.length})</span>
      </div>
      <div style={styles.slotsList}>
        {slots.map(slot => {
          const conflicts = getSlotConflicts(slot.date, slot.start, slot.end);
          return (
            <SlotCard
              key={slot.id}
              slot={slot}
              isSelected={!!selectedSlots[slot.id]}
              onToggle={onToggleSlot}
              conflicts={conflicts}
            />
          );
        })}
      </div>
    </div>
  );
}

function SelectionSummary({ count, onSubmit }) {
  // Count unique dates
  return (
    <div style={styles.summaryBar}>
      <div style={styles.summaryText}>
        <span style={{ fontWeight: 700, color: COLORS.text }}>{count} slot{count !== 1 ? "s" : ""}</span>
        <span style={{ color: COLORS.textMuted }}> selected</span>
      </div>
      <button onClick={onSubmit} style={styles.submitBtn}>Submit Response</button>
    </div>
  );
}

function ConfirmationScreen({ totalSelected, onBack }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2705"}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Response submitted!</h2>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, maxWidth: 360, margin: "0 auto 24px" }}>
            You selected {totalSelected} time slot{totalSelected !== 1 ? "s" : ""} that work for you.
            {MOCK_GATHERING.hostName} will confirm the final time once quorum ({MOCK_GATHERING.quorum} attendees) is reached.
          </p>
          <button onClick={onBack} style={styles.backToHomeBtn}>Back to Home</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function InviteeCalendarExperience({ onBack }) {
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(2); // March = index 2
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const totalSelected = Object.values(selectedSlots).filter(Boolean).length;

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return carveSlotsForDate(selectedDate);
  }, [selectedDate]);

  const handleToggleSlot = (slotId) => {
    setSelectedSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  if (submitted) {
    return <ConfirmationScreen totalSelected={totalSelected} onBack={onBack} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={onBack} style={styles.backBtn}><BackArrow /></button>
          <div>
            <h1 style={styles.title}>{MOCK_GATHERING.title}</h1>
            <div style={styles.hostLine}>
              Hosted by <span style={{ fontWeight: 600 }}>{MOCK_GATHERING.hostName}</span>
              {" \u00B7 "}{MOCK_GATHERING.duration} min {" \u00B7 "}{MOCK_GATHERING.format}
            </div>
          </div>
        </div>

        {/* Calendar connected indicator */}
        <div style={styles.calConnected}>
          <CalIcon />
          <span>Google Calendar connected</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#43a047" }} />
        </div>

        {/* Description */}
        <p style={styles.description}>{MOCK_GATHERING.description}</p>

        {/* Instruction */}
        <div style={styles.instruction}>
          Select the days and time slots that work for you. Your calendar conflicts are shown on each slot.
        </div>

        {/* Main content: calendar + sidebar */}
        <div style={styles.contentRow}>
          <div style={styles.calendarPanel}>
            <CalendarMonth
              viewYear={viewYear}
              viewMonth={viewMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              availableDates={AVAILABLE_DATES}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              selectedSlots={selectedSlots}
            />
          </div>
          {selectedDate ? (
            <DaySidebar
              dateKey={selectedDate}
              slots={slotsForSelectedDate}
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
            />
          ) : (
            <div style={styles.sidebarPlaceholder}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>{"\uD83D\uDCC5"}</div>
              <div>Select a highlighted day to see available time slots</div>
            </div>
          )}
        </div>

        {/* Selection summary */}
        {totalSelected > 0 && (
          <SelectionSummary count={totalSelected} onSubmit={() => setSubmitted(true)} />
        )}
      </div>
    </div>
  );
}

// --- Styles ---
const styles = {
  container: {
    minHeight: "100vh",
    background: GRADIENTS.background,
    display: "flex",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: FONTS.base,
  },
  card: {
    background: COLORS.cardBg,
    borderRadius: 20,
    maxWidth: 720,
    width: "100%",
    padding: "28px 0",
    boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
    alignSelf: "flex-start",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "0 28px",
    marginBottom: 12,
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: COLORS.textMuted,
    padding: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.text,
    margin: 0,
    lineHeight: 1.3,
  },
  hostLine: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  calConnected: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    margin: "8px 28px",
    padding: "5px 12px",
    borderRadius: 20,
    background: "#f0faf0",
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: 500,
  },
  description: {
    fontSize: 13,
    color: COLORS.textBody,
    lineHeight: 1.6,
    padding: "0 28px",
    margin: "8px 0 4px",
  },
  instruction: {
    fontSize: 12,
    color: COLORS.textLight,
    padding: "0 28px",
    margin: "0 0 16px",
    fontStyle: "italic",
  },
  contentRow: {
    display: "flex",
    gap: 0,
    minHeight: 360,
    borderTop: `1px solid ${COLORS.borderLight}`,
  },
  calendarPanel: {
    flex: "0 0 300px",
    padding: "20px 20px",
    borderRight: `1px solid ${COLORS.borderLight}`,
  },
  // Calendar styles
  calHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calNavBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: COLORS.textMuted,
    padding: 4,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
  },
  calTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.text,
  },
  calDowRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 0,
    marginBottom: 4,
  },
  calDow: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.textLight,
    padding: "4px 0",
    textTransform: "uppercase",
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 2,
  },
  dayCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 0",
    minHeight: 40,
    border: "none",
    background: "transparent",
    fontFamily: FONTS.base,
    fontSize: 13,
    position: "relative",
  },
  dayBadge: {
    position: "absolute",
    top: 1,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#43a047",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // Sidebar styles
  sidebar: {
    flex: 1,
    minWidth: 260,
    padding: "20px 24px",
    overflowY: "auto",
    maxHeight: 460,
  },
  sidebarPlaceholder: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    color: COLORS.textLight,
    fontSize: 13,
    textAlign: "center",
  },
  sidebarDate: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.text,
    margin: "0 0 8px",
  },
  locationPills: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  locationPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 8,
    background: COLORS.fieldBg,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: 500,
    border: `1px solid ${COLORS.borderLight}`,
  },
  slotsHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textMuted,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  slotsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  // Slot card styles
  slotCard: {
    display: "flex",
    alignItems: "stretch",
    width: "100%",
    padding: 0,
    borderRadius: 12,
    border: "1.5px solid #e8ecf0",
    background: "#fff",
    cursor: "pointer",
    overflow: "hidden",
    transition: "all 0.15s",
    fontFamily: FONTS.base,
    minHeight: 52,
    textAlign: "left",
  },
  slotContent: {
    flex: 1,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  slotTime: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
  },
  // Tooltip styles
  tooltip: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
    padding: "8px 12px",
    zIndex: 200,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  },
  // Summary bar
  summaryBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    borderTop: `1px solid ${COLORS.borderLight}`,
    marginTop: 0,
  },
  summaryText: {
    fontSize: 14,
  },
  submitBtn: {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: GRADIENTS.greenBtn,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.base,
  },
  backToHomeBtn: {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: GRADIENTS.primaryBtn,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.base,
  },
};
