import { useState, useRef, useEffect } from "react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "90 min", value: 90 },
  { label: "2 hr", value: 120 },
  { label: "3 hr", value: 180 },
];

const TIME_OF_DAY = [
  { label: "Morning", value: "morning", hint: "8 am \u2013 noon" },
  { label: "Afternoon", value: "afternoon", hint: "Noon \u2013 5 pm" },
  { label: "Evening", value: "evening", hint: "After 5 pm" },
  { label: "Custom", value: "custom", hint: "Set your own" },
  { label: "Flexible", value: "flexible", hint: "Any time" },
];

const TIME_DEFAULTS = {
  morning: { start: 8, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
  custom: { start: 9, end: 17 },
};

const TIME_OPTIONS = [];
for (let h = 6; h <= 23; h += 0.5) {
  TIME_OPTIONS.push(h);
}

// ── Mock Location Data ──────────────────────────────────────

const LOCATIONS = [
  { id: "loc1", name: "Community Center — Room A", address: "142 Main St", capacity: 40 },
  { id: "loc2", name: "Downtown Library — Meeting Room 3", address: "88 Elm Ave", capacity: 30 },
  { id: "loc3", name: "The Hive Coworking — Event Space", address: "310 Oak Blvd", capacity: 25 },
  { id: "loc4", name: "Riverside Park Pavilion", address: "45 River Rd", capacity: 60 },
  { id: "loc5", name: "St. Mark's Parish Hall", address: "220 Church St", capacity: 50 },
];

const LOCATION_EVENTS = {
  loc1: {
    recurring: [
      { dayOfWeek: 1, start: 9, end: 11, title: "Yoga class" },
      { dayOfWeek: 1, start: 14, end: 16, title: "Senior social" },
      { dayOfWeek: 3, start: 10, end: 12, title: "Art workshop" },
      { dayOfWeek: 3, start: 13, end: 15, title: "Community meeting" },
      { dayOfWeek: 5, start: 9, end: 10.5, title: "Pilates" },
      { dayOfWeek: 5, start: 18, end: 20, title: "Dance class" },
      { dayOfWeek: 6, start: 10, end: 14, title: "Kids program" },
    ],
    oneOff: [
      { daysFromNow: 3, start: 11, end: 15, title: "Private event" },
      { daysFromNow: 8, start: 9, end: 17, title: "All-day booking" },
      { daysFromNow: 14, start: 13, end: 16, title: "Workshop rental" },
    ],
  },
  loc2: {
    recurring: [
      { dayOfWeek: 1, start: 10, end: 11.5, title: "Book club" },
      { dayOfWeek: 2, start: 14, end: 16, title: "Tutoring session" },
      { dayOfWeek: 2, start: 17, end: 19, title: "ESL class" },
      { dayOfWeek: 4, start: 10, end: 12, title: "Writer's group" },
      { dayOfWeek: 4, start: 15, end: 17, title: "Study group" },
      { dayOfWeek: 6, start: 11, end: 13, title: "Story time" },
    ],
    oneOff: [
      { daysFromNow: 2, start: 9, end: 12, title: "Staff training" },
      { daysFromNow: 5, start: 13, end: 17, title: "Author reading" },
      { daysFromNow: 10, start: 9, end: 17, title: "Maintenance" },
    ],
  },
  loc3: {
    recurring: [
      { dayOfWeek: 1, start: 8, end: 10, title: "Team standup room" },
      { dayOfWeek: 2, start: 13, end: 15, title: "Networking lunch" },
      { dayOfWeek: 4, start: 16, end: 18, title: "Founder meetup" },
    ],
    oneOff: [
      { daysFromNow: 4, start: 10, end: 16, title: "Product launch" },
      { daysFromNow: 12, start: 9, end: 12, title: "Corporate offsite" },
    ],
  },
  loc4: {
    recurring: [
      { dayOfWeek: 6, start: 8, end: 12, title: "Farmers market" },
      { dayOfWeek: 0, start: 9, end: 11, title: "Morning run club" },
    ],
    oneOff: [
      { daysFromNow: 7, start: 10, end: 18, title: "Community fair" },
      { daysFromNow: 15, start: 14, end: 17, title: "Outdoor concert setup" },
    ],
  },
  loc5: {
    recurring: [
      { dayOfWeek: 0, start: 9, end: 12, title: "Sunday service" },
      { dayOfWeek: 3, start: 18, end: 20, title: "Choir practice" },
      { dayOfWeek: 5, start: 10, end: 12, title: "Seniors group" },
    ],
    oneOff: [
      { daysFromNow: 6, start: 9, end: 17, title: "Fundraiser" },
      { daysFromNow: 20, start: 14, end: 18, title: "Community dinner prep" },
    ],
  },
};

const USER_PROFILE = {
  preferredLocations: ["loc1", "loc3"],
  startingLocation: "Home — 55 Maple Dr",
};

const COMMUTE_DEFAULTS = { loc1: 15, loc2: 22, loc3: 10, loc4: 35, loc5: 28 };

// ── Mock Google Calendar data ───────────────────────────────

const MOCK_EVENTS_WEEKDAY = [
  { start: 9, end: 9.5, title: "Team standup", color: "#4285f4" },
  { start: 10, end: 11, title: "Project sync", color: "#4285f4" },
  { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
  { start: 14, end: 15, title: "Design review", color: "#e67c73" },
  { start: 16, end: 16.5, title: "1:1 with manager", color: "#f4511e" },
];

const MOCK_EVENTS_VARIANTS = [
  [
    { start: 8.5, end: 9.5, title: "Leadership sync", color: "#4285f4" },
    { start: 10, end: 11.5, title: "Sprint planning", color: "#e67c73" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
    { start: 15, end: 16, title: "Customer call", color: "#f4511e" },
  ],
  [
    { start: 9, end: 9.5, title: "Team standup", color: "#4285f4" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
    { start: 13.5, end: 14.5, title: "Roadmap review", color: "#e67c73" },
    { start: 15, end: 16.5, title: "Workshop", color: "#0b8043" },
    { start: 17, end: 17.5, title: "Wrap-up", color: "#4285f4" },
  ],
  [
    { start: 10, end: 10.5, title: "Check-in", color: "#4285f4" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
  ],
  [
    { start: 8, end: 9, title: "Early sync", color: "#f4511e" },
    { start: 9.5, end: 10.5, title: "Product review", color: "#e67c73" },
    { start: 11, end: 12, title: "Interviews", color: "#0b8043" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
    { start: 13.5, end: 15, title: "Strategy session", color: "#4285f4" },
    { start: 15.5, end: 16.5, title: "Stakeholder update", color: "#e67c73" },
    { start: 17, end: 18, title: "Retro", color: "#f4511e" },
  ],
];

const MOCK_EVENTS_WEEKEND = [
  { start: 10, end: 11, title: "Farmers market", color: "#0b8043" },
];

// ── Helpers ─────────────────────────────────────────────────

function seededRandom(dateKey) {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = ((h << 5) - h + dateKey.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getMockEventsForDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay();
  if (dow === 0 || dow === 6) {
    return seededRandom(dateKey) % 3 === 0 ? MOCK_EVENTS_WEEKEND : [];
  }
  const seed = seededRandom(dateKey);
  if (seed % 5 === 0) return MOCK_EVENTS_WEEKDAY;
  return MOCK_EVENTS_VARIANTS[seed % MOCK_EVENTS_VARIANTS.length];
}

function formatHour(h) {
  const hr = Math.floor(h);
  const min = h % 1 === 0.5 ? "30" : "00";
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${min} ${ampm}`;
}

function getFreeGaps(events, windowStart, windowEnd) {
  const sorted = [...events]
    .filter((e) => e.end > windowStart && e.start < windowEnd)
    .sort((a, b) => a.start - b.start);
  const gaps = [];
  let cursor = windowStart;
  for (const ev of sorted) {
    if (ev.start > cursor) gaps.push({ start: cursor, end: ev.start });
    cursor = Math.max(cursor, ev.end);
  }
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd });
  return gaps;
}

function getTimeWindow(timePref, timeOverrides = {}) {
  if (timePref.length === 0) return null;
  if (timePref.includes("flexible")) return { start: 8, end: 21, label: "Based on your calendar" };
  // Merge all selected windows (morning, afternoon, evening, custom)
  let minStart = 24, maxEnd = 0;
  for (const pref of timePref) {
    const w = timeOverrides[pref] || TIME_DEFAULTS[pref];
    if (w) {
      minStart = Math.min(minStart, w.start);
      maxEnd = Math.max(maxEnd, w.end);
    }
  }
  return {
    start: minStart,
    end: maxEnd,
    label: `${formatHour(minStart)} \u2014 ${formatHour(maxEnd)}`,
  };
}

// ── Location Availability ────────────────────────────────────

function getLocationEventsForDate(locationId, dateKey) {
  const config = LOCATION_EVENTS[locationId];
  if (!config) return [];
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay();
  const events = [];
  for (const ev of config.recurring) {
    if (ev.dayOfWeek === dow) events.push({ start: ev.start, end: ev.end, title: ev.title });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const ev of config.oneOff) {
    const evDate = new Date(today);
    evDate.setDate(today.getDate() + ev.daysFromNow);
    const evKey = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, "0")}-${String(evDate.getDate()).padStart(2, "0")}`;
    if (evKey === dateKey) events.push({ start: ev.start, end: ev.end, title: ev.title });
  }
  return events;
}

function getLocationDateAvailability(locationId, dateKey, durationMinutes, windowStart, windowEnd) {
  const events = getLocationEventsForDate(locationId, dateKey);
  const gaps = getFreeGaps(events, windowStart, windowEnd);
  const durationHours = durationMinutes / 60;
  const totalFreeHours = gaps.reduce((sum, g) => sum + (g.end - g.start), 0);
  const windowHours = windowEnd - windowStart;
  const fullyFree = totalFreeHours >= windowHours - 0.01;
  const fitsOnce = gaps.some((g) => g.end - g.start >= durationHours);
  if (fullyFree) return "green";
  if (fitsOnce) return "amber";
  return "red";
}

function getLocationOverallAvailability(locationId, selectedDates, durationMinutes, windowStart, windowEnd) {
  if (selectedDates.length === 0) return { level: null, perDate: [] };
  const perDate = selectedDates.map((dateKey) => ({
    dateKey,
    level: getLocationDateAvailability(locationId, dateKey, durationMinutes, windowStart, windowEnd),
  }));
  const greenCount = perDate.filter((d) => d.level === "green").length;
  const amberCount = perDate.filter((d) => d.level === "amber").length;
  let level;
  if (greenCount === perDate.length) level = "green";
  else if (greenCount + amberCount > 0) level = "amber";
  else level = "red";
  return { level, perDate };
}

function scoreLocation(overallLevel, isPreferred, commuteMinutes) {
  const availScore = overallLevel === "green" ? 300
    : overallLevel === "amber" ? 200
    : overallLevel === "red" ? 100
    : 150;
  const prefScore = isPreferred ? 10 : 0;
  const commuteScore = Math.max(0, 5 - (commuteMinutes / 12));
  return availScore + prefScore + commuteScore;
}

function getDayAvailabilityInfo(dateKey, durationMinutes, startHr, endHr) {
  const events = getMockEventsForDate(dateKey);
  const windowEvents = events.filter((e) => e.end > startHr && e.start < endHr);
  const gaps = getFreeGaps(events, startHr, endHr);
  const durationHours = durationMinutes / 60;
  const totalFreeHours = gaps.reduce((sum, g) => sum + (g.end - g.start), 0);
  const windowHours = endHr - startHr;
  const fullyFree = totalFreeHours >= windowHours - 0.01;
  const fitsOnce = gaps.some((g) => g.end - g.start >= durationHours);

  let level;
  if (fullyFree) level = "green";
  else if (fitsOnce) level = "amber";
  else level = "red";

  const items = [];
  let cursor = startHr;
  const sorted = [...windowEvents].sort((a, b) => a.start - b.start);
  for (const ev of sorted) {
    const evStart = Math.max(ev.start, startHr);
    const evEnd = Math.min(ev.end, endHr);
    if (evStart > cursor) {
      const gapDur = evStart - cursor;
      const fits = gapDur >= durationHours;
      items.push({
        type: fits ? "green" : "amber",
        label: `${formatHour(cursor)}\u2013${formatHour(evStart)} \u2014 Free (${Math.round(gapDur * 60)} min)`,
      });
    }
    items.push({
      type: "red",
      label: `${formatHour(evStart)}\u2013${formatHour(evEnd)} \u2014 ${ev.title}`,
    });
    cursor = Math.max(cursor, evEnd);
  }
  if (cursor < endHr) {
    const gapDur = endHr - cursor;
    const fits = gapDur >= durationHours;
    items.push({
      type: fits ? "green" : "amber",
      label: `${formatHour(cursor)}\u2013${formatHour(endHr)} \u2014 Free (${Math.round(gapDur * 60)} min)`,
    });
  }

  return { level, items };
}

function formatDate(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function durationLabel(mins) {
  const d = DURATIONS.find((x) => x.value === mins);
  return d ? d.label : `${mins} min`;
}

// ── DayPopover ──────────────────────────────────────────────

function DayPopover({ dateKey, duration, window: tw, style }) {
  const info = getDayAvailabilityInfo(dateKey, duration, tw.start, tw.end);
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dayLabel = dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const bulletColors = { green: "#43a047", amber: "#f9a825", red: "#e53935" };

  return (
    <div style={{ ...styles.popover, ...style }} onClick={(e) => e.stopPropagation()}>
      <div style={styles.popoverHeader}>
        <span style={styles.popoverTitle}>{dayLabel}</span>
        <span style={styles.popoverBadge}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginRight: 4 }}>
            <circle cx="5" cy="5" r="4" stroke="#4285f4" strokeWidth="1.2" />
            <path d="M5 3V5.5L6.5 6.5" stroke="#4285f4" strokeWidth="1" strokeLinecap="round" />
          </svg>
          Google Calendar
        </span>
      </div>
      <div style={styles.popoverWindow}>
        <span style={styles.popoverWindowLabel}>{tw.label}</span>
      </div>
      <ul style={styles.popoverList}>
        {info.items.map((item, i) => (
          <li key={i} style={styles.popoverListItem}>
            <div style={{ ...styles.popoverBullet, background: bulletColors[item.type] }} />
            <span style={styles.popoverItemText}>{item.label}</span>
          </li>
        ))}
        {info.items.length === 0 && (
          <li style={styles.popoverListItem}>
            <div style={{ ...styles.popoverBullet, background: "#43a047" }} />
            <span style={styles.popoverItemText}>Fully available</span>
          </li>
        )}
      </ul>
    </div>
  );
}

// ── Calendar ────────────────────────────────────────────────

function MiniCalendar({ selectedDates, onToggleDate, duration, timePref, timeOverrides }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredDate, setHoveredDate] = useState(null);
  const hoverTimeout = useRef(null);

  useEffect(() => () => clearTimeout(hoverTimeout.current), []);

  const handleMouseEnter = (key) => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredDate(key), 300);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredDate(null), 200);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const dateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const isSelected = (day) => selectedDates.includes(dateKey(viewYear, viewMonth, day));
  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const tw = getTimeWindow(timePref, timeOverrides);
  const showAvailability = duration && tw;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={styles.cal}>
      <div style={styles.calHeader}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{ ...styles.calNav, ...(canGoPrev ? {} : styles.calNavDisabled) }}
        >
          &lsaquo;
        </button>
        <span style={styles.calMonth}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={styles.calNav}>&rsaquo;</button>
      </div>
      {showAvailability && (
        <div style={styles.calAvailHint}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginRight: 5, flexShrink: 0, marginTop: 1 }}>
            <circle cx="5" cy="5" r="4" stroke="#4285f4" strokeWidth="1.2" />
            <path d="M5 3V5.5L6.5 6.5" stroke="#4285f4" strokeWidth="1" strokeLinecap="round" />
          </svg>
          Hover dates to see your calendar availability
        </div>
      )}
      <div style={styles.calGrid}>
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} style={styles.calDayLabel}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;

          const key = dateKey(viewYear, viewMonth, day);
          const past = isPast(day);
          const selected = isSelected(day);
          const info = showAvailability && !past
            ? getDayAvailabilityInfo(key, duration, tw.start, tw.end)
            : null;
          const barColor = info
            ? info.level === "green" ? "#43a047"
            : info.level === "amber" ? "#f9a825"
            : "#e53935"
            : null;

          return (
            <div
              key={key}
              style={{ position: "relative" }}
              onMouseEnter={() => showAvailability && !past && handleMouseEnter(key)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                disabled={past}
                onClick={() => !past && onToggleDate(key)}
                style={{
                  ...styles.calDay,
                  ...(past ? styles.calDayPast : {}),
                  ...(selected ? styles.calDaySelected : {}),
                  ...(barColor ? { paddingBottom: 12 } : {}),
                }}
              >
                {day}
              </button>
              {barColor && (
                <div style={{ ...styles.calBar, background: barColor }} />
              )}
              {hoveredDate === key && !past && showAvailability && (
                <DayPopover
                  dateKey={key}
                  duration={duration}
                  window={tw}
                  style={{
                    position: "absolute",
                    zIndex: 100,
                    left: "50%",
                    transform: "translateX(-50%)",
                    bottom: "calc(100% + 8px)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Location Icons & Sub-Components ─────────────────────────

function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 12.5C7 12.5 11.5 9 11.5 5.5C11.5 3.01 9.49 1 7 1C4.51 1 2.5 3.01 2.5 5.5C2.5 9 7 12.5 7 12.5Z" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M5 0.5L6.1 3.6H9.5L6.7 5.5L7.8 8.6L5 6.7L2.2 8.6L3.3 5.5L0.5 3.6H3.9L5 0.5Z"/>
    </svg>
  );
}

function CommuteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 9.5H11.5V7L10 4H4L2.5 7V9.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M2.5 7H11.5" stroke="currentColor" strokeWidth="1"/>
      <circle cx="4.5" cy="8.5" r="0.6" fill="currentColor"/>
      <circle cx="9.5" cy="8.5" r="0.6" fill="currentColor"/>
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M6.7 1.3L10.7 5.3C11.1 5.7 11.1 6.3 10.7 6.7L6.7 10.7C6.3 11.1 5.7 11.1 5.3 10.7L1.3 6.7C0.9 6.3 0.9 5.7 1.3 5.3L5.3 1.3C5.7 0.9 6.3 0.9 6.7 1.3Z" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M4.5 6.5L6 5L7.5 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5V8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function DirectionsLink({ address }) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={styles.directionsLink}
    >
      <DirectionsIcon /> Directions
    </a>
  );
}

function CommuteInput({ locId, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const n = parseInt(editValue);
    onChange(locId, isNaN(n) || n < 0 ? 0 : Math.min(n, 180));
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={styles.commuteInputRow} onClick={(e) => e.stopPropagation()}>
        <CommuteIcon />
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          style={styles.commuteNumberInput}
          min={0}
          max={180}
          step={5}
        />
        <span style={styles.commuteUnit}>min</span>
      </div>
    );
  }

  return (
    <div
      style={{ ...styles.commuteInputRow, cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        setEditValue(value);
        setEditing(true);
      }}
    >
      <CommuteIcon />
      <span style={styles.commuteValueText}>{value}</span>
      <span style={styles.commuteUnit}>min</span>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function SimpleHostForm({ onBack }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(null);
  const [timePref, setTimePref] = useState([]);
  const [timeOverrides, setTimeOverrides] = useState({});
  const [selectedDates, setSelectedDates] = useState([]);
  const [quorum, setQuorum] = useState(5);
  const [showCapacity, setShowCapacity] = useState(false);
  const [capacity, setCapacity] = useState(20);
  const [published, setPublished] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [commuteTimes, setCommuteTimes] = useState({ ...COMMUTE_DEFAULTS });
  const [startingLocation, setStartingLocation] = useState(USER_PROFILE.startingLocation);

  const toggleTimePref = (val) => {
    if (val === "flexible") {
      setTimePref(timePref.includes("flexible") ? [] : ["flexible"]);
      return;
    }
    // All non-flexible chips (morning, afternoon, evening, custom) are combinable
    let next = timePref.filter((v) => v !== "flexible");
    next = next.includes(val) ? next.filter((v) => v !== val) : [...next, val];
    setTimePref(next);
  };

  const updateTimeOverride = (pref, field, value) => {
    const current = timeOverrides[pref] || TIME_DEFAULTS[pref];
    setTimeOverrides({
      ...timeOverrides,
      [pref]: { ...current, [field]: value },
    });
  };

  const toggleDate = (key) => {
    setSelectedDates((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const toggleLocation = (id) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const updateCommuteTime = (locId, minutes) => {
    setCommuteTimes((prev) => ({ ...prev, [locId]: minutes }));
  };

  const tw = getTimeWindow(timePref, timeOverrides);
  const hasLocationData = selectedDates.length > 0 && tw !== null && duration;

  const sortedLocations = [...LOCATIONS].map((loc) => {
    const isPreferred = USER_PROFILE.preferredLocations.includes(loc.id);
    const commute = commuteTimes[loc.id] || 0;
    const avail = hasLocationData
      ? getLocationOverallAvailability(loc.id, selectedDates, duration, tw.start, tw.end)
      : { level: null, perDate: [] };
    const score = scoreLocation(avail.level, isPreferred, commute);
    return { ...loc, isPreferred, commute, avail, score };
  }).sort((a, b) => b.score - a.score);

  const canPublish = title.trim() && duration && timePref.length > 0 && selectedDates.length > 0;

  // ── Published state ─────────────────────────────────────

  if (published) {
    const sortedDates = [...selectedDates].sort();
    const displayDates = sortedDates.map((d) => {
      const [y, m, day] = d.split("-").map(Number);
      return formatDate(new Date(y, m - 1, day));
    });

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.publishedState}>
            <div style={styles.publishedIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" fill="#E8F5E9" stroke="#43A047" strokeWidth="2"/>
                <path d="M15 25L21 31L33 17" stroke="#43A047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={styles.publishedTitle}>Gathering Created!</h2>
            <p style={styles.publishedEventName}>{title}</p>
            <p style={styles.publishedSub}>
              Invitees will be asked to rank their preferred dates. Your gathering
              confirms once <strong>{quorum} people</strong> accept.
            </p>
            <div style={styles.publishedDetails}>
              <div style={styles.publishedStat}>
                <span style={styles.publishedStatLabel}>Duration</span>
                <span style={styles.publishedStatValue}>{durationLabel(duration)}</span>
              </div>
              <div style={styles.publishedStatDivider} />
              <div style={styles.publishedStat}>
                <span style={styles.publishedStatLabel}>Dates offered</span>
                <span style={styles.publishedStatValue}>{selectedDates.length}</span>
              </div>
              <div style={styles.publishedStatDivider} />
              <div style={styles.publishedStat}>
                <span style={styles.publishedStatLabel}>Quorum</span>
                <span style={styles.publishedStatValue}>{quorum}</span>
              </div>
              {showCapacity && (
                <>
                  <div style={styles.publishedStatDivider} />
                  <div style={styles.publishedStat}>
                    <span style={styles.publishedStatLabel}>Capacity</span>
                    <span style={styles.publishedStatValue}>{capacity}</span>
                  </div>
                </>
              )}
            </div>
            <div style={styles.publishedDates}>
              <span style={styles.publishedDatesLabel}>Dates:</span>
              <span style={styles.publishedDatesText}>{displayDates.join(" \u00b7 ")}</span>
            </div>
            <div style={styles.publishedTimePref}>
              <span style={styles.publishedDatesLabel}>Time preference:</span>
              <span style={styles.publishedDatesText}>
                {timePref.includes("flexible")
                  ? "Flexible \u2014 based on calendar availability"
                  : timePref.map((v) => {
                      const w = timeOverrides[v] || TIME_DEFAULTS[v];
                      const label = TIME_OF_DAY.find((t) => t.value === v)?.label;
                      return w ? `${label} (${formatHour(w.start)}\u2013${formatHour(w.end)})` : label;
                    }).join(", ")}
              </span>
            </div>
            {selectedLocations.length > 0 && (
              <div style={styles.publishedDates}>
                <span style={styles.publishedDatesLabel}>Locations:</span>
                <span style={styles.publishedDatesText}>
                  {selectedLocations
                    .map((id) => LOCATIONS.find((l) => l.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            <button
              style={styles.primaryBtn}
              onClick={() => {
                setPublished(false);
                setTitle("");
                setDescription("");
                setDuration(null);
                setTimePref([]);
                setTimeOverrides({});
                setSelectedDates([]);
                setQuorum(5);
                setShowCapacity(false);
                setCapacity(20);
                setSelectedLocations([]);
                setCommuteTimes({ ...COMMUTE_DEFAULTS });
                setStartingLocation(USER_PROFILE.startingLocation);
              }}
            >
              Start New Gathering
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          {onBack && (
            <button onClick={onBack} style={styles.backBtn}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Quorum
            </button>
          )}
          <div style={styles.logoRow}>
            <div style={styles.logo}>Q</div>
            <span style={styles.logoText}>Quorum</span>
          </div>
          <p style={styles.subtitle}>Create a gathering</p>
        </div>

        {/* Form body */}
        <div style={styles.body}>

          {/* ─ Title & Description ─ */}
          <div style={styles.section}>
            <label style={styles.label}>
              What's the gathering?
              <span style={styles.required}>*</span>
            </label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Team dinner, Book club, Planning session"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            />
            <textarea
              style={styles.textarea}
              placeholder="Add a short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              rows={2}
            />
          </div>

          {/* ─ Duration ─ */}
          <div style={styles.section}>
            <label style={styles.label}>How long will it last?</label>
            <div style={styles.chipRow}>
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  style={{
                    ...styles.chip,
                    ...(duration === d.value ? styles.chipActive : {}),
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─ Time of day ─ */}
          <div style={styles.section}>
            <label style={styles.label}>What time of day works?</label>
            <p style={styles.hint}>Select one or more</p>
            <div style={styles.chipRow}>
              {TIME_OF_DAY.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleTimePref(t.value)}
                  style={{
                    ...styles.chip,
                    ...(timePref.includes(t.value) ? styles.chipActive : {}),
                    ...(t.value === "flexible" && timePref.includes("flexible") ? styles.chipFlexible : {}),
                  }}
                >
                  <span>{t.label}</span>
                  <span style={styles.chipHint}>{t.hint}</span>
                </button>
              ))}
            </div>

            {/* Window editors */}
            {timePref.includes("flexible") ? (
              <div style={styles.flexibleNote}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="7" cy="7" r="5.5" stroke="#4285f4" strokeWidth="1.2" />
                  <path d="M7 4.5V7.5L9 9" stroke="#4285f4" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>We'll use your calendar availability to determine the best time.</span>
              </div>
            ) : timePref.length > 0 ? (
              <div style={styles.windowEditors}>
                {timePref.map((pref) => {
                  const w = timeOverrides[pref] || TIME_DEFAULTS[pref];
                  if (!w) return null;
                  const label = TIME_OF_DAY.find((t) => t.value === pref)?.label;
                  return (
                    <div key={pref} style={styles.windowRow}>
                      <span style={styles.windowLabel}>{label}</span>
                      <select
                        value={w.start}
                        onChange={(e) => updateTimeOverride(pref, "start", parseFloat(e.target.value))}
                        style={styles.windowSelect}
                      >
                        {TIME_OPTIONS.filter((h) => h < w.end).map((h) => (
                          <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                      </select>
                      <span style={styles.windowTo}>to</span>
                      <select
                        value={w.end}
                        onChange={(e) => updateTimeOverride(pref, "end", parseFloat(e.target.value))}
                        style={styles.windowSelect}
                      >
                        {TIME_OPTIONS.filter((h) => h > w.start).map((h) => (
                          <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* ─ Date picker ─ */}
          <div style={styles.section}>
            <label style={styles.label}>Pick some dates</label>
            <p style={styles.hint}>Tap dates to add or remove them</p>
            <MiniCalendar
              selectedDates={selectedDates}
              onToggleDate={toggleDate}
              duration={duration}
              timePref={timePref}
              timeOverrides={timeOverrides}
            />
            {selectedDates.length > 0 && (
              <div style={styles.selectedSummary}>
                <span style={styles.selectedCount}>{selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""} selected</span>
                <span style={styles.selectedList}>
                  {[...selectedDates].sort().map((d) => {
                    const [y, m, day] = d.split("-").map(Number);
                    return formatDate(new Date(y, m - 1, day));
                  }).join(" \u00b7 ")}
                </span>
              </div>
            )}
          </div>

          {/* ─ Suggested Locations ─ */}
          <div style={styles.section}>
            <label style={styles.label}>Suggested Locations</label>
            <p style={styles.hint}>Select one or more venues for your gathering</p>

            {/* Starting location */}
            <div style={styles.startingLocationRow}>
              <MapPinIcon />
              <span style={styles.startingLocationLabel}>Starting from:</span>
              <input
                style={styles.startingLocationInput}
                type="text"
                value={startingLocation}
                onChange={(e) => setStartingLocation(e.target.value.slice(0, 100))}
                placeholder="Your starting location"
              />
            </div>
            <p style={{ fontSize: 11, color: "#9aa5b4", margin: "-4px 0 12px 22px" }}>
              Based on your profile. Change for this gathering.
            </p>

            {!hasLocationData && (
              <div style={styles.locationEmptyHint}>
                <span>Pick dates and a time preference above to see availability</span>
              </div>
            )}

            {/* Location cards */}
            <div style={styles.locationList}>
              {sortedLocations.map((loc) => {
                const selected = selectedLocations.includes(loc.id);
                const availColor = loc.avail.level === "green" ? "#43a047"
                  : loc.avail.level === "amber" ? "#f9a825"
                  : loc.avail.level === "red" ? "#e53935"
                  : null;
                const availLabel = loc.avail.level === "green" ? "Available for all dates"
                  : loc.avail.level === "amber" ? "Partially available"
                  : loc.avail.level === "red" ? "Unavailable"
                  : null;

                return (
                  <div
                    key={loc.id}
                    style={{
                      ...styles.locationCard,
                      ...(selected ? styles.locationCardSelected : {}),
                    }}
                    onClick={() => toggleLocation(loc.id)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      {/* Checkbox */}
                      <div style={{ paddingTop: 2 }}>
                        <div style={{
                          ...styles.locCheckbox,
                          ...(selected ? styles.locCheckboxChecked : {}),
                        }}>
                          {selected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={styles.locationName}>{loc.name}</span>
                          {loc.isPreferred && (
                            <span style={styles.preferredBadge}>
                              <StarIcon /> Preferred
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={styles.locationAddr}>{loc.address}</span>
                          <DirectionsLink address={loc.address} />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <CommuteInput
                            locId={loc.id}
                            value={loc.commute}
                            onChange={updateCommuteTime}
                          />
                          {availColor && (
                            <div style={styles.locationAvail}>
                              <span style={{ ...styles.availDot, background: availColor }} />
                              {availLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Per-date availability breakdown */}
                    {loc.avail.perDate.length > 0 && (
                      <div style={styles.locDateList}>
                        {loc.avail.perDate.map((d) => {
                          const [y, m, day] = d.dateKey.split("-").map(Number);
                          const dt = new Date(y, m - 1, day);
                          const label = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                          const c = d.level === "green" ? "#43a047" : d.level === "amber" ? "#f9a825" : "#e53935";
                          return (
                            <div key={d.dateKey} style={styles.locDateItem}>
                              <div style={{ ...styles.locDateDot, background: c }} />
                              <span style={styles.locDateLabel}>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedLocations.length > 0 && (
              <div style={styles.locationSelectedSummary}>
                {selectedLocations.length} location{selectedLocations.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          {/* ─ Quorum ─ */}
          <div style={styles.section}>
            <label style={styles.label}>
              How many people need to say yes?
            </label>
            <div style={styles.quorumRow}>
              <button
                style={styles.quorumBtn}
                onClick={() => setQuorum(Math.max(2, quorum - 1))}
              >
                &minus;
              </button>
              <span style={styles.quorumValue}>{quorum}</span>
              <button
                style={styles.quorumBtn}
                onClick={() => setQuorum(Math.min(99, quorum + 1))}
              >
                +
              </button>
              <span style={styles.quorumUnit}>people</span>
            </div>
            <p style={styles.quorumHelper}>
              Your gathering confirms once {quorum} invitee{quorum !== 1 ? "s" : ""} accept &mdash; no need to wait for everyone.
            </p>
          </div>

          {/* ─ Optional capacity ─ */}
          <div style={styles.section}>
            <button
              style={styles.toggleRow}
              onClick={() => setShowCapacity(!showCapacity)}
            >
              <div style={{
                ...styles.toggleBox,
                ...(showCapacity ? styles.toggleBoxChecked : {}),
              }}>
                {showCapacity && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={styles.toggleLabel}>Set a maximum capacity</span>
            </button>
            {showCapacity && (
              <div style={styles.capacityRow}>
                <button
                  style={styles.quorumBtn}
                  onClick={() => setCapacity(Math.max(quorum, capacity - 1))}
                >
                  &minus;
                </button>
                <span style={styles.quorumValue}>{capacity}</span>
                <button
                  style={styles.quorumBtn}
                  onClick={() => setCapacity(Math.min(500, capacity + 1))}
                >
                  +
                </button>
                <span style={styles.quorumUnit}>max attendees</span>
              </div>
            )}
          </div>

          {/* ─ Publish button ─ */}
          <button
            onClick={() => canPublish && setPublished(true)}
            disabled={!canPublish}
            style={{
              ...styles.publishBtn,
              ...(!canPublish ? styles.publishBtnDisabled : {}),
            }}
          >
            Create Gathering
          </button>

          {!canPublish && (
            <p style={styles.publishHint}>
              {!title.trim() ? "Add a title" : !duration ? "Pick a duration" : timePref.length === 0 ? "Select a time preference" : "Pick at least one date"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #0f1923 0%, #1a2a3a 40%, #0d2137 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'DM Sans', 'Avenir', 'Segoe UI', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    maxWidth: 560,
    width: "100%",
    boxShadow: "0 24px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  header: {
    padding: "28px 28px 20px",
    borderBottom: "1px solid #f0f0f0",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "none",
    border: "none",
    color: "#7a8a9a",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    padding: "0 0 14px",
    fontFamily: "inherit",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a2332",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#7a8a9a",
    margin: "4px 0 0",
  },
  body: {
    padding: "24px 28px 32px",
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    color: "#1a2332",
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  required: {
    color: "#e53935",
    marginLeft: 3,
  },
  hint: {
    fontSize: 13,
    color: "#9aa5b4",
    margin: "-4px 0 10px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #e0e5eb",
    fontSize: 14,
    fontWeight: 500,
    color: "#1a2332",
    background: "#fafbfc",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 10,
  },
  textarea: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #e0e5eb",
    fontSize: 14,
    color: "#1a2332",
    background: "#fafbfc",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.5,
    boxSizing: "border-box",
  },

  // Chips
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 18px",
    borderRadius: 10,
    border: "1.5px solid #e0e5eb",
    background: "#fafbfc",
    fontSize: 14,
    fontWeight: 500,
    color: "#4a5568",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
    gap: 2,
  },
  chipActive: {
    borderColor: "#2e86c1",
    background: "#eaf4fb",
    color: "#1a5276",
    fontWeight: 600,
  },
  chipHint: {
    fontSize: 11,
    fontWeight: 400,
    color: "#9aa5b4",
  },
  chipFlexible: {
    borderColor: "#4285f4",
    background: "#e8f0fe",
    color: "#1a56c4",
  },

  // Window editors
  windowEditors: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
  },
  windowRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "#f5f7fa",
    borderRadius: 10,
    border: "1px solid #eef1f4",
  },
  windowLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#4a5568",
    minWidth: 72,
  },
  windowSelect: {
    padding: "6px 8px",
    borderRadius: 8,
    border: "1.5px solid #e0e5eb",
    fontSize: 13,
    fontWeight: 500,
    color: "#1a2332",
    background: "#fff",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  },
  windowTo: {
    fontSize: 12,
    color: "#9aa5b4",
    fontWeight: 500,
  },
  flexibleNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: "10px 14px",
    background: "#e8f0fe",
    borderRadius: 10,
    border: "1px solid #d0dfef",
    fontSize: 13,
    color: "#1a56c4",
    lineHeight: 1.4,
  },

  // Calendar
  cal: {
    border: "1.5px solid #e0e5eb",
    borderRadius: 14,
    background: "#fafbfc",
    overflow: "hidden",
  },
  calHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #eef1f4",
  },
  calAvailHint: {
    display: "flex",
    alignItems: "flex-start",
    padding: "6px 14px",
    fontSize: 11,
    color: "#4285f4",
    fontWeight: 500,
    background: "#e8f0fe",
    borderBottom: "1px solid #eef1f4",
  },
  calMonth: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a2332",
  },
  calNav: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #e0e5eb",
    background: "#fff",
    fontSize: 20,
    color: "#4a5568",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
  },
  calNavDisabled: {
    opacity: 0.3,
    cursor: "default",
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    padding: "8px 12px 12px",
    gap: 2,
  },
  calDayLabel: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "#9aa5b4",
    padding: "4px 0 8px",
    textTransform: "uppercase",
  },
  calDay: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: 500,
    color: "#1a2332",
    background: "none",
    border: "2px solid transparent",
    borderRadius: 8,
    padding: "8px 0",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
    width: "100%",
  },
  calDayPast: {
    color: "#d0d5dc",
    cursor: "default",
  },
  calDaySelected: {
    background: "#eaf4fb",
    borderColor: "#2e86c1",
    color: "#1a5276",
    fontWeight: 700,
  },
  calBar: {
    position: "absolute",
    bottom: 2,
    left: 3,
    right: 3,
    height: 3,
    borderRadius: 2,
  },

  // Popover
  popover: {
    width: 260,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
    padding: 0,
    overflow: "hidden",
    cursor: "default",
  },
  popoverHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid #f0f0f0",
    background: "#fafbfc",
  },
  popoverTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1a2332",
  },
  popoverBadge: {
    display: "flex",
    alignItems: "center",
    fontSize: 10,
    color: "#4285f4",
    fontWeight: 600,
    background: "#e8f0fe",
    padding: "2px 8px",
    borderRadius: 10,
  },
  popoverWindow: {
    padding: "6px 14px",
    background: "#f5f7fa",
    fontSize: 11,
    color: "#6a7585",
    fontWeight: 600,
    borderBottom: "1px solid #f0f0f0",
  },
  popoverWindowLabel: {},
  popoverList: {
    listStyle: "none",
    padding: "8px 14px 10px",
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  popoverListItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#1a2332",
    lineHeight: 1.3,
  },
  popoverBullet: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  popoverItemText: {
    fontSize: 11,
    color: "#4a5568",
  },

  // Selected dates summary
  selectedSummary: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 12,
    padding: "10px 14px",
    background: "#f5f9ff",
    borderRadius: 10,
    border: "1px solid #d4e4f7",
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1a5276",
  },
  selectedList: {
    fontSize: 12,
    color: "#5a7a99",
    lineHeight: 1.4,
  },

  // Quorum
  quorumRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  quorumBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1.5px solid #e0e5eb",
    background: "#fff",
    fontSize: 18,
    color: "#4a5568",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  quorumValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a2332",
    minWidth: 36,
    textAlign: "center",
  },
  quorumUnit: {
    fontSize: 14,
    color: "#7a8a9a",
    marginLeft: 4,
  },
  quorumHelper: {
    fontSize: 13,
    color: "#7a8a9a",
    lineHeight: 1.5,
    marginTop: 10,
  },

  // Capacity toggle
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: "2px solid #d0d5dc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  toggleBoxChecked: {
    background: "#2e86c1",
    borderColor: "#2e86c1",
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "#4a5568",
  },
  capacityRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    paddingLeft: 32,
  },

  // Publish
  publishBtn: {
    width: "100%",
    padding: "14px 24px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
    marginTop: 8,
  },
  publishBtnDisabled: {
    opacity: 0.4,
    cursor: "default",
  },
  publishHint: {
    textAlign: "center",
    fontSize: 13,
    color: "#b0bac5",
    marginTop: 10,
  },

  // Published state
  publishedState: {
    padding: "48px 28px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  publishedIcon: {
    marginBottom: 16,
  },
  publishedTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a2332",
    margin: "0 0 8px",
  },
  publishedEventName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a2332",
    margin: "0 0 8px",
  },
  publishedSub: {
    fontSize: 14,
    color: "#7a8a9a",
    lineHeight: 1.6,
    maxWidth: 380,
    margin: "0 0 24px",
  },
  publishedDetails: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "14px 20px",
    background: "#f5f7fa",
    borderRadius: 12,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  publishedStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  publishedStatLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9aa5b4",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  publishedStatValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1a2332",
  },
  publishedStatDivider: {
    width: 1,
    height: 28,
    background: "#e0e5eb",
  },
  publishedDates: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 8,
  },
  publishedTimePref: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 20,
  },
  publishedDatesLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#9aa5b4",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  publishedDatesText: {
    fontSize: 14,
    color: "#4a5568",
  },
  primaryBtn: {
    padding: "12px 28px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    maxWidth: 240,
  },

  // Starting location
  startingLocationRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#f5f7fa",
    borderRadius: 10,
    border: "1px solid #eef1f4",
    marginBottom: 8,
    color: "#5a6a7a",
  },
  startingLocationLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#4a5568",
    whiteSpace: "nowrap",
  },
  startingLocationInput: {
    flex: 1,
    padding: "4px 8px",
    borderRadius: 6,
    border: "1.5px solid #e0e5eb",
    fontSize: 13,
    fontWeight: 500,
    color: "#1a2332",
    background: "#fff",
    fontFamily: "inherit",
    outline: "none",
  },

  // Location list & cards
  locationList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  locationCard: {
    display: "flex",
    flexDirection: "column",
    padding: "16px 18px",
    borderRadius: 14,
    border: "1.5px solid #e8ecf0",
    background: "#fafbfc",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
    fontFamily: "inherit",
  },
  locationCardSelected: {
    borderColor: "#2e86c1",
    background: "#eaf4fb",
  },
  locCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: "2px solid #ccd3dc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  locCheckboxChecked: {
    borderColor: "#2e86c1",
    background: "#2e86c1",
  },
  locationName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a2332",
  },
  locationAddr: {
    fontSize: 13,
    color: "#7a8a9a",
  },
  preferredBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#d4880f",
    background: "#fef9e7",
    padding: "2px 8px",
    borderRadius: 10,
    border: "1px solid #f5e6b8",
  },
  locationAvail: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#5a6a7a",
    fontWeight: 500,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  locDateList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #eef1f5",
  },
  locDateItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px 3px 7px",
    borderRadius: 8,
    background: "#f5f7fa",
    fontSize: 11,
    color: "#4a5568",
  },
  locDateDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  locDateLabel: {
    whiteSpace: "nowrap",
  },
  locationEmptyHint: {
    padding: "20px 16px",
    textAlign: "center",
    fontSize: 13,
    color: "#9aa5b4",
    borderRadius: 10,
    border: "1.5px dashed #e0e5eb",
    marginBottom: 12,
  },
  locationSelectedSummary: {
    marginTop: 8,
    padding: "8px 14px",
    background: "#f5f9ff",
    borderRadius: 10,
    border: "1px solid #d4e4f7",
    fontSize: 13,
    fontWeight: 700,
    color: "#1a5276",
  },

  // Directions & commute
  directionsLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 600,
    color: "#2e86c1",
    textDecoration: "none",
    padding: "2px 0",
    borderBottom: "1px dashed #2e86c1",
    transition: "opacity 0.15s",
    lineHeight: 1,
  },
  commuteInputRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "#5a6a7a",
    padding: "2px 0",
  },
  commuteValueText: {
    fontWeight: 600,
    color: "#1a2332",
    borderBottom: "1px dashed #b0bac5",
    lineHeight: 1.2,
  },
  commuteNumberInput: {
    width: 48,
    padding: "3px 6px",
    borderRadius: 6,
    border: "1.5px solid #2e86c1",
    fontSize: 13,
    fontWeight: 600,
    color: "#1a2332",
    outline: "none",
    fontFamily: "inherit",
    background: "#fff",
    textAlign: "center",
  },
  commuteUnit: {
    fontSize: 12,
    color: "#7a8a9a",
  },
};
