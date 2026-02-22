import { useState, useRef, useEffect } from "react";

const LOCATIONS = [
  { id: "loc1", name: "Community Center — Room A", address: "142 Main St", capacity: 40 },
  { id: "loc2", name: "Downtown Library — Meeting Room 3", address: "88 Elm Ave", capacity: 30 },
];

// Mock "remembered" commute defaults (from previous events)
const COMMUTE_DEFAULTS = { loc1: 30, loc2: 20 };

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- Mock Google Calendar data ---
const MOCK_EVENTS_WEEKDAY = [
  { start: 9, end: 9.5, title: "Team standup", color: "#4285f4" },
  { start: 10, end: 11, title: "Project sync", color: "#4285f4" },
  { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
  { start: 14, end: 15, title: "Design review", color: "#e67c73" },
  { start: 16, end: 16.5, title: "1:1 with manager", color: "#f4511e" },
];

const MOCK_EVENTS_VARIANTS = [
  // Variant A — busier morning
  [
    { start: 8.5, end: 9.5, title: "Leadership sync", color: "#4285f4" },
    { start: 10, end: 11.5, title: "Sprint planning", color: "#e67c73" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
    { start: 15, end: 16, title: "Customer call", color: "#f4511e" },
  ],
  // Variant B — busier afternoon
  [
    { start: 9, end: 9.5, title: "Team standup", color: "#4285f4" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
    { start: 13.5, end: 14.5, title: "Roadmap review", color: "#e67c73" },
    { start: 15, end: 16.5, title: "Workshop", color: "#0b8043" },
    { start: 17, end: 17.5, title: "Wrap-up", color: "#4285f4" },
  ],
  // Variant C — light day
  [
    { start: 10, end: 10.5, title: "Check-in", color: "#4285f4" },
    { start: 12, end: 13, title: "Lunch", color: "#7986cb" },
  ],
  // Variant D — packed
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

function seededRandom(dateKey) {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) { h = ((h << 5) - h + dateKey.charCodeAt(i)) | 0; }
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

function formatTimePrecise(h) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, "0")} ${ampm}`;
}

function formatDurationLabel(d) {
  if (d < 60) return `${d} min`;
  return `${Math.floor(d / 60)}${d % 60 ? '.5' : ''} hr${d >= 120 ? 's' : ''}`;
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

// --- Mock Location busy data ---
const LOCATION_EVENTS = {
  loc1: {
    // Community Center — Room A
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
      { daysFromNow: 21, start: 10, end: 12, title: "Board meeting" },
    ],
  },
  loc2: {
    // Downtown Library — Meeting Room 3
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
      { daysFromNow: 16, start: 14, end: 18, title: "Community forum" },
      { daysFromNow: 25, start: 10, end: 14, title: "Library board" },
    ],
  },
};

function getLocationEventsForDate(locationId, dateKey) {
  const config = LOCATION_EVENTS[locationId];
  if (!config) return [];
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay();
  const events = [];
  // Recurring events for this day of week
  for (const ev of config.recurring) {
    if (ev.dayOfWeek === dow) events.push({ start: ev.start, end: ev.end, title: ev.title });
  }
  // One-off events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const ev of config.oneOff) {
    const evDate = new Date(today);
    evDate.setDate(today.getDate() + ev.daysFromNow);
    const evKey = toDateKey(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());
    if (evKey === dateKey) events.push({ start: ev.start, end: ev.end, title: ev.title });
  }
  return events;
}

function getLocationDateAvailability(locationId, dateKey, durationMinutes, windowStart, windowEnd) {
  const startHr = parseTimeToHour(windowStart);
  const endHr = parseTimeToHour(windowEnd);
  const events = getLocationEventsForDate(locationId, dateKey);
  const gaps = getFreeGaps(events, startHr, endHr);
  const durationHours = durationMinutes / 60;
  const totalFreeHours = gaps.reduce((sum, g) => sum + (g.end - g.start), 0);
  const windowHours = endHr - startHr;
  const fullyFree = totalFreeHours >= windowHours - 0.01;
  const fitsOnce = gaps.some(g => (g.end - g.start) >= durationHours);
  if (fullyFree) return "green";
  if (fitsOnce) return "amber";
  return "red";
}

function getLocationOverallAvailability(locationId, availSets, durationMinutes) {
  const allDates = availSets.flatMap((set) =>
    set.dates.map((dateKey) => ({
      dateKey,
      level: getLocationDateAvailability(locationId, dateKey, durationMinutes, set.timeStart, set.timeEnd),
    }))
  );
  if (allDates.length === 0) return { level: null, dates: [] };
  const greenCount = allDates.filter(d => d.level === "green").length;
  const amberCount = allDates.filter(d => d.level === "amber").length;
  let level;
  if (greenCount === allDates.length) level = "green";
  else if (greenCount + amberCount > 0) level = "amber";
  else level = "red";
  return { level, dates: allDates };
}

function parseTimeToHour(timeStr) {
  if (!timeStr) return 9;
  const [time, ampm] = timeStr.split(" ");
  let [hr, min] = time.split(":").map(Number);
  if (ampm === "PM" && hr !== 12) hr += 12;
  if (ampm === "AM" && hr === 12) hr = 0;
  return hr + min / 60;
}

function getDayAvailabilityInfo(dateKey, durationMinutes, windowStart, windowEnd) {
  const startHr = parseTimeToHour(windowStart);
  const endHr = parseTimeToHour(windowEnd);
  const events = getMockEventsForDate(dateKey);
  const windowEvents = events.filter(e => e.end > startHr && e.start < endHr);
  const gaps = getFreeGaps(events, startHr, endHr);
  const durationHours = durationMinutes / 60;
  const totalFreeHours = gaps.reduce((sum, g) => sum + (g.end - g.start), 0);
  const windowHours = endHr - startHr;
  const fullyFree = totalFreeHours >= windowHours - 0.01;
  const fitsOnce = gaps.some(g => (g.end - g.start) >= durationHours);

  let level;
  if (fullyFree) level = "green";
  else if (fitsOnce) level = "amber";
  else level = "red";

  // Build bullet list items
  const items = [];
  let cursor = startHr;
  const sorted = [...windowEvents].sort((a, b) => a.start - b.start);
  for (const ev of sorted) {
    const evStart = Math.max(ev.start, startHr);
    const evEnd = Math.min(ev.end, endHr);
    if (evStart > cursor) {
      const gapDur = evStart - cursor;
      const fits = gapDur >= durationHours;
      items.push({ type: fits ? "green" : "amber", label: `${formatHour(cursor)}–${formatHour(evStart)} — Free (${Math.round(gapDur * 60)} min)` });
    }
    items.push({ type: "red", label: `${formatHour(evStart)}–${formatHour(evEnd)} — ${ev.title}` });
    cursor = Math.max(cursor, evEnd);
  }
  if (cursor < endHr) {
    const gapDur = endHr - cursor;
    const fits = gapDur >= durationHours;
    items.push({ type: fits ? "green" : "amber", label: `${formatHour(cursor)}–${formatHour(endHr)} — Free (${Math.round(gapDur * 60)} min)` });
  }

  return { level, items };
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const t = new Date();
  return toDateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

function isPast(year, month, day) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(year, month, day);
  return d < today;
}

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

function DayPopover({ dateKey, duration, windowStart, windowEnd, style }) {
  const info = getDayAvailabilityInfo(dateKey, duration || 60, windowStart || "9:00 AM", windowEnd || "5:00 PM");
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
            <circle cx="5" cy="5" r="4" stroke="#4285f4" strokeWidth="1.2"/><path d="M5 3V5.5L6.5 6.5" stroke="#4285f4" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          Google Calendar
        </span>
      </div>
      <div style={styles.popoverWindow}>
        <span style={styles.popoverWindowLabel}>{windowStart || "9:00 AM"} — {windowEnd || "5:00 PM"}</span>
      </div>
      <ul style={styles.popoverList}>
        {info.items.map((item, i) => (
          <li key={i} style={styles.popoverListItem}>
            <div style={{ ...styles.popoverBullet, background: bulletColors[item.type] }} />
            <span style={styles.popoverItemText}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalendarWidget({ selectedDates, onToggleDate, accentColor, duration, windowStart, windowEnd }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);
  const hoverTimeout = useRef(null);
  const popoverRef = useRef(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = todayKey();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const canGoPrev = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth());

  const yearOptions = [];
  for (let y = now.getFullYear(); y <= now.getFullYear() + 3; y++) yearOptions.push(y);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleMouseEnter = (key) => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredDate(key), 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredDate(null), 200);
  };

  useEffect(() => () => clearTimeout(hoverTimeout.current), []);

  return (
    <div style={{ position: "relative" }}>
      <div style={styles.calNavRow}>
        <button onClick={prevMonth} style={{ ...styles.calNavBtn, ...(canGoPrev ? {} : { opacity: 0.3, cursor: "default" }) }} disabled={!canGoPrev}>
          <ChevronLeft />
        </button>
        <button onClick={() => setShowYearPicker(!showYearPicker)} style={styles.calMonthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
          <ChevronDown />
        </button>
        <button onClick={nextMonth} style={styles.calNavBtn}>
          <ChevronRight />
        </button>
      </div>
      {showYearPicker && (
        <div style={styles.yearPickerRow}>
          {yearOptions.map((y) => (
            <button key={y} onClick={() => { setViewYear(y); setShowYearPicker(false); }}
              style={{ ...styles.yearChip, ...(viewYear === y ? styles.yearChipActive : {}) }}>
              {y}
            </button>
          ))}
        </div>
      )}
      <div style={styles.calDayHeaders}>
        {DAYS_OF_WEEK.map((d) => <div key={d} style={styles.calDayHeader}>{d}</div>)}
      </div>
      <div style={styles.calGrid}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} style={styles.calEmpty} />;
          const key = toDateKey(viewYear, viewMonth, day);
          const selected = selectedDates.includes(key);
          const past = isPast(viewYear, viewMonth, day);
          const isToday = key === today;
          const isWeekend = (i % 7 === 0) || (i % 7 === 6);
          const info = !past && duration ? getDayAvailabilityInfo(key, duration, windowStart || "9:00 AM", windowEnd || "5:00 PM") : null;
          const barColor = info ? (info.level === "green" ? "#43a047" : info.level === "amber" ? "#f9a825" : "#e53935") : null;
          return (
            <div key={key} style={{ position: "relative" }}
              onMouseEnter={() => !past && duration && handleMouseEnter(key)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => !past && onToggleDate(key)}
                disabled={past}
                style={{
                  ...styles.calCell,
                  ...(past ? styles.calCellPast : {}),
                  ...(isWeekend && !selected && !past ? styles.calCellWeekend : {}),
                  ...(isToday && !selected ? styles.calCellToday : {}),
                  ...(selected ? { ...styles.calCellSelected, background: accentColor, borderColor: accentColor } : {}),
                  width: "100%",
                  paddingBottom: barColor ? 10 : undefined,
                }}
              >
                {day}
              </button>
              {barColor && (
                <div style={{ ...styles.calBar, background: barColor }} />
              )}
              {hoveredDate === key && !past && (
                <DayPopover dateKey={key} duration={duration} windowStart={windowStart} windowEnd={windowEnd}
                  style={{ position: "absolute", zIndex: 100, left: "50%", transform: "translateX(-50%)", bottom: "calc(100% + 8px)" }}
                />
              )}
            </div>
          );
        })}
      </div>
      {duration && (
        <div style={styles.calLegend}>
          <div style={styles.calLegendItem}><div style={{ ...styles.calLegendBar, background: "#43a047" }} /><span>Fully free</span></div>
          <div style={styles.calLegendItem}><div style={{ ...styles.calLegendBar, background: "#f9a825" }} /><span>Duration fits</span></div>
          <div style={styles.calLegendItem}><div style={{ ...styles.calLegendBar, background: "#e53935" }} /><span>No availability</span></div>
        </div>
      )}
    </div>
  );
}

const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM",
];

const DURATIONS = [30, 45, 60, 90, 120, 150, 180];

function createEmptySet() {
  return { id: Date.now(), dates: [], timeStart: "9:00 AM", timeEnd: "5:00 PM" };
}
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M7 6.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="7" cy="4.5" r="0.75" fill="currentColor"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 4H12M5 4V2.5C5 2.22 5.22 2 5.5 2H8.5C8.78 2 9 2.22 9 2.5V4M10.5 4V11.5C10.5 11.78 10.28 12 10 12H4C3.72 12 3.5 11.78 3.5 11.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 7H16" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6 1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M12 1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M9 5V9L12 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 16C9 16 15 11.5 15 7C15 3.68629 12.3137 1 9 1C5.68629 1 3 3.68629 3 7C3 11.5 9 16 9 16Z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="9" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M12.5 2.5L15.5 5.5L5.5 15.5H2.5V12.5L12.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 4.5L13.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M2 13L6 9L9 12L12 9L16 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XSmallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="6.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 15C1 12 3.5 10 6.5 10C9.5 10 12 12 12 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="12.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M14 10.5C15.5 11 17 12.5 17 15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
  </svg>
);

const UnlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
  </svg>
);

const SET_COLORS = [
  { bg: "#eaf4fb", border: "#2e86c1", accent: "#2e86c1", light: "#d4eaf8" },
  { bg: "#fef3e2", border: "#e67e22", accent: "#e67e22", light: "#fde8c8" },
  { bg: "#f0e6f6", border: "#8e44ad", accent: "#8e44ad", light: "#e0cced" },
  { bg: "#e8f5e9", border: "#43a047", accent: "#43a047", light: "#c8e6c9" },
  { bg: "#fce4ec", border: "#c62828", accent: "#c62828", light: "#f8bbd0" },
];

function formatDateList(dateKeys) {
  if (dateKeys.length === 0) return "No dates selected";
  const sorted = [...dateKeys].sort();
  return sorted.map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }).join(", ");
}

function AvailabilitySet({ set, index, colors, onToggleDate, onChangeTime, onRemove, canRemove, collapsed, onExpand, duration }) {
  if (collapsed) {
    return (
      <div
        style={{ ...styles.setCard, borderColor: colors.border, background: "#fff", cursor: "pointer" }}
        onClick={onExpand}
      >
        <div style={{ ...styles.setHeader, background: colors.bg }}>
          <div style={styles.setHeaderLeft}>
            <div style={{ ...styles.setDot, background: colors.accent }} />
            <span style={styles.setTitle}>Availability {index + 1}</span>
            <span style={styles.setDateCount}>{set.dates.length} date{set.dates.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {canRemove && (
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={styles.setRemoveBtn}><TrashIcon /></button>
            )}
            <div style={{ color: "#9aa5b4", transform: "rotate(-90deg)", display: "flex" }}><ChevronDown /></div>
          </div>
        </div>
        <div style={styles.collapsedBody}>
          <div style={styles.collapsedRow}>
            <CalendarIcon />
            <span style={styles.collapsedText}>{formatDateList(set.dates)}</span>
          </div>
          <div style={styles.collapsedRow}>
            <ClockIcon />
            <span style={styles.collapsedText}>{set.timeStart} — {set.timeEnd}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.setCard, borderColor: colors.border, background: "#fff" }}>
      <div style={{ ...styles.setHeader, background: colors.bg }}>
        <div style={styles.setHeaderLeft}>
          <div style={{ ...styles.setDot, background: colors.accent }} />
          <span style={styles.setTitle}>Availability {index + 1}</span>
          <span style={styles.setDateCount}>{set.dates.length} date{set.dates.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {canRemove && (
            <button onClick={onRemove} style={styles.setRemoveBtn}><TrashIcon /></button>
          )}
        </div>
      </div>
      <div style={styles.setSection}>
        <label style={styles.setSectionLabel}>Time window</label>
        <div style={styles.timeRange}>
          <div style={styles.timeField}>
            <label style={styles.fieldLabelSmall}>Earliest start</label>
            <div style={styles.selectWrap}>
              <select value={set.timeStart} onChange={(e) => {
                onChangeTime("timeStart", e.target.value);
                const newStartHr = parseTimeToHour(e.target.value);
                const endHr = parseTimeToHour(set.timeEnd);
                if (newStartHr >= endHr) {
                  const minEndHr = newStartHr + (duration || 60) / 60;
                  const best = TIME_SLOTS.find(t => parseTimeToHour(t) >= minEndHr);
                  if (best) onChangeTime("timeEnd", best);
                  else onChangeTime("timeEnd", TIME_SLOTS[TIME_SLOTS.length - 1]);
                }
              }} style={styles.select}>
                {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <div style={styles.selectArrow}><ChevronDown /></div>
            </div>
          </div>
          <div style={styles.timeDash}>—</div>
          <div style={styles.timeField}>
            <label style={styles.fieldLabelSmall}>Latest end</label>
            <div style={styles.selectWrap}>
              <select value={set.timeEnd} onChange={(e) => onChangeTime("timeEnd", e.target.value)} style={styles.select}>
                {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <div style={styles.selectArrow}><ChevronDown /></div>
            </div>
          </div>
        </div>
      </div>
      <div style={styles.setSection}>
        <label style={styles.setSectionLabel}>Select dates</label>
        <CalendarWidget
          selectedDates={set.dates}
          onToggleDate={onToggleDate}
          accentColor={colors.accent}
          duration={duration}
          windowStart={set.timeStart}
          windowEnd={set.timeEnd}
        />
      </div>
    </div>
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
        <span style={styles.commuteUnit}>min commute</span>
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
      <span style={styles.commuteUnit}>min commute</span>
    </div>
  );
}

function IdealTimeSlider({ set, setIndex, colors, duration, commuteMins, idealStart, onIdealStartChange, protectCommute }) {
  const barRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [barWidth, setBarWidth] = useState(500);
  const dragStartRef = useRef(null);

  const windowStart = parseTimeToHour(set.timeStart);
  const windowEnd = parseTimeToHour(set.timeEnd);
  const windowHrs = windowEnd - windowStart;
  const durationHrs = duration / 60;
  const commuteHrs = commuteMins / 60;
  const fits = durationHrs <= windowHrs + 0.01;

  // Default: center the event in the window, snap to nearest :00 or :30
  const midpoint = windowStart + (windowHrs - durationHrs) / 2;
  const snapped = Math.round(midpoint * 2) / 2; // snap to :00 or :30
  const defaultIdealStart = Math.max(windowStart, Math.min(snapped, windowEnd - durationHrs));

  // Drag bounds based on protect commute
  const protectedMin = Math.min(windowStart + commuteHrs, windowEnd - durationHrs);
  const protectedMax = Math.max(windowEnd - commuteHrs - durationHrs, windowStart);
  const minStart = protectCommute ? protectedMin : windowStart;
  const maxStart = protectCommute ? protectedMax : windowEnd - durationHrs;

  // Current position — use saved value or default, then clamp to current bounds
  let currentStart = idealStart ?? defaultIdealStart;
  currentStart = Math.max(minStart, Math.min(currentStart, maxStart));

  const commuteBeforeHrs = commuteHrs;
  const commuteAfterHrs = commuteHrs;
  const commuteBeforeMins = Math.round(commuteBeforeHrs * 60);
  const commuteAfterMins = Math.round(commuteAfterHrs * 60);

  const toPercent = (h) => ((h - windowStart) / windowHrs) * 100;

  // Measure bar width
  useEffect(() => {
    if (barRef.current) setBarWidth(barRef.current.offsetWidth);
    const onResize = () => { if (barRef.current) setBarWidth(barRef.current.offsetWidth); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const pxPerHour = barWidth / windowHrs;

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dHrs = dx / pxPerHour;
      let newStart = dragStartRef.current.startVal + dHrs;
      newStart = Math.max(minStart, Math.min(maxStart, newStart));
      newStart = Math.round(newStart * 12) / 12; // snap 5 min
      onIdealStartChange(newStart);
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, pxPerHour, minStart, maxStart, onIdealStartChange]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragStartRef.current = { clientX: e.clientX, startVal: currentStart };
    setDragging(true);
  };

  // Date labels
  const dateLabels = set.dates && set.dates.length > 0
    ? [...set.dates].sort().slice(0, 3).map(k => {
        const [y, m, d] = k.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }).join(", ") + (set.dates.length > 3 ? ` +${set.dates.length - 3} more` : "")
    : "No dates";

  if (!fits) {
    return (
      <div style={styles.timelineRow}>
        <div style={styles.timelineRowHeader}>
          <div style={{ ...styles.timelineSetDot, background: colors.accent }} />
          <span style={styles.timelineSetLabel}>Availability {setIndex + 1}</span>
          <span style={styles.timelineSetDates}>{dateLabels}</span>
        </div>
        <div style={styles.timelineWarning}>
          <span style={{ fontSize: 14 }}>{"\u26A0\uFE0F"}</span>
          <span>Gathering ({formatDurationLabel(duration)}) exceeds this window ({set.timeStart} {"\u2013"} {set.timeEnd})</span>
        </div>
      </div>
    );
  }

  const eventEnd = currentStart + durationHrs;
  const eventWidthPct = (durationHrs / windowHrs) * 100;
  const eventBlockPx = (durationHrs / windowHrs) * barWidth;

  // Commute buffer rendering
  const renderCommuteZone = (zoneStart, zoneHrs, zoneMins, side) => {
    if (zoneMins < 1) return null;
    const widthPct = (zoneHrs / windowHrs) * 100;
    const zonePx = (zoneHrs / windowHrs) * barWidth;
    const isActive = protectCommute;
    return (
      <>
        <div style={{
          position: "absolute",
          left: `${toPercent(zoneStart)}%`,
          width: `${widthPct}%`,
          top: 0, bottom: 0,
          background: isActive ? colors.accent : "transparent",
          opacity: isActive ? 0.13 : 1,
          border: isActive ? "none" : `1.5px dashed ${colors.accent}40`,
          borderRadius: side === "left" ? "6px 0 0 6px" : "0 6px 6px 0",
          zIndex: 2,
          boxSizing: "border-box",
        }} />
        {zonePx > 35 && (
          <div style={{
            position: "absolute",
            left: `${toPercent(zoneStart)}%`,
            width: `${widthPct}%`,
            top: 0, bottom: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 600,
            color: isActive ? colors.accent : `${colors.accent}80`,
            pointerEvents: "none",
            zIndex: 4,
            userSelect: "none",
          }}>
            {zoneMins}m
          </div>
        )}
      </>
    );
  };

  return (
    <div style={styles.timelineRow}>
      <div style={styles.timelineRowHeader}>
        <div style={{ ...styles.timelineSetDot, background: colors.accent }} />
        <span style={styles.timelineSetLabel}>Availability {setIndex + 1}: {set.timeStart} {"\u2013"} {set.timeEnd}</span>
        <span style={styles.timelineSetDates}>{dateLabels}</span>
      </div>
      {/* Ideal time label */}
      <div style={{ display: "flex", alignItems: "baseline", fontSize: 12, fontWeight: 600, color: "#7a8a9a", marginBottom: 4 }}>
        <span>Ideal time</span>
        <span style={{ color: colors.accent, fontWeight: 700, marginLeft: 6 }}>{formatTimePrecise(currentStart)} {"\u2013"} {formatTimePrecise(eventEnd)}</span>
      </div>
      {/* Single timeline bar */}
      <div ref={barRef} style={{ ...styles.timelineBar, height: 36 }}>
        {/* Left commute zone */}
        {renderCommuteZone(windowStart, commuteBeforeHrs, commuteBeforeMins, "left")}
        {/* Draggable event block */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            left: `${toPercent(currentStart)}%`,
            width: `${eventWidthPct}%`,
            top: 3, bottom: 3,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
            borderRadius: 6,
            cursor: dragging ? "grabbing" : "grab",
            zIndex: 3,
            userSelect: "none",
            transition: dragging ? "none" : "left 0.15s ease",
            boxShadow: dragging ? "0 2px 10px rgba(0,0,0,0.25)" : "0 1px 4px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {eventBlockPx > 80 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: -0.2, whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              {formatTimePrecise(currentStart).replace(/:00/g, "")} {"\u2013"} {formatTimePrecise(eventEnd).replace(/:00/g, "")}
            </span>
          )}
          {eventBlockPx <= 80 && eventBlockPx > 30 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>
              {"\u2630"}
            </span>
          )}
        </div>
        {/* Right commute zone */}
        {renderCommuteZone(windowEnd - commuteAfterHrs, commuteAfterHrs, commuteAfterMins, "right")}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9aa5b4", marginTop: 3, padding: "0 2px" }}>
        <span>{set.timeStart}</span>
        <span>{set.timeEnd}</span>
      </div>
    </div>
  );
}

// --- Mock host suggestions for co-host autocomplete ---
const MOCK_CONTACTS = [
  { id: "c1", name: "Jordan Rivera", email: "jordan.r@company.com", avatar: "#4285f4" },
  { id: "c2", name: "Maya Patel", email: "maya.p@company.com", avatar: "#e67c73" },
  { id: "c3", name: "Alex Kim", email: "alex.k@company.com", avatar: "#0b8043" },
  { id: "c4", name: "Sam Torres", email: "sam.t@company.com", avatar: "#f4511e" },
  { id: "c5", name: "Chris Nakamura", email: "chris.n@company.com", avatar: "#7986cb" },
];

export default function HostCombinedForm({ onBack }) {
  const [step, setStep] = useState(0);
  // Step 0: Details
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [hosts, setHosts] = useState([]);
  const [hostSearch, setHostSearch] = useState("");
  const [showHostSuggestions, setShowHostSuggestions] = useState(false);
  const [eventImage, setEventImage] = useState(null); // { name, dataUrl }
  const imageInputRef = useRef(null);
  // Step 1: Schedule + Location + Commute
  const [duration, setDuration] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [format, setFormat] = useState("in-person");
  const [availSets, setAvailSets] = useState([createEmptySet()]);
  const [quorum, setQuorum] = useState(5);
  const [capacity, setCapacity] = useState(20);
  const [overflow, setOverflow] = useState(false);
  const [published, setPublished] = useState(false);
  const [expandedSet, setExpandedSet] = useState(0);
  const [durationLocked, setDurationLocked] = useState(false);
  const [matchingExpanded, setMatchingExpanded] = useState(false);
  // Commute & ideal time state
  const [commuteTimes, setCommuteTimes] = useState({ ...COMMUTE_DEFAULTS });
  const [idealTimes, setIdealTimes] = useState({});
  const [protectCommute, setProtectCommute] = useState(true);

  // Default capacity to min capacity of selected locations when entering step 2
  useEffect(() => {
    if (step === 2 && selectedLocations.length > 0) {
      const selectedLocs = LOCATIONS.filter(l => selectedLocations.includes(l.id));
      const minCap = Math.min(...selectedLocs.map(l => l.capacity));
      setCapacity(minCap);
    }
  }, [step]);

  const toggleLocation = (id) => {
    const scrollY = window.scrollY;
    setSelectedLocations((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const updateCommuteTime = (locId, minutes) => {
    setCommuteTimes(prev => ({ ...prev, [locId]: minutes }));
  };

  const maxCommuteMinutes = selectedLocations.length > 0
    ? Math.max(...selectedLocations.map(id => commuteTimes[id] || 0))
    : 0;

  const toggleDateInSet = (setIndex, dateStr) => {
    setAvailSets((prev) => prev.map((s, i) =>
      i === setIndex ? { ...s, dates: s.dates.includes(dateStr) ? s.dates.filter((d) => d !== dateStr) : [...s.dates, dateStr] } : s
    ));
  };

  const changeTimeInSet = (setIndex, field, value) => {
    setAvailSets((prev) => prev.map((s, i) => i === setIndex ? { ...s, [field]: value } : s));
  };

  const addSet = () => {
    if (availSets.length < 5) {
      setAvailSets((prev) => [...prev, createEmptySet()]);
      setExpandedSet(availSets.length);
    }
  };
  const removeSet = (setIndex) => {
    setAvailSets((prev) => prev.filter((_, i) => i !== setIndex));
    setExpandedSet((prev) => {
      if (prev === setIndex) return Math.max(0, setIndex - 1);
      if (prev > setIndex) return prev - 1;
      return prev;
    });
  };

  const totalSelectedDates = availSets.reduce((sum, s) => sum + s.dates.length, 0);

  // Compute viable locations (capacity fits) and exceeded locations
  const viableLocations = format !== "virtual"
    ? selectedLocations.filter(id => { const loc = LOCATIONS.find(l => l.id === id); return loc && capacity <= loc.capacity; })
    : [];
  const exceededLocations = format !== "virtual"
    ? selectedLocations.map(id => LOCATIONS.find(l => l.id === id)).filter(loc => loc && capacity > loc.capacity)
    : [];
  const viableLocationCount = format === "virtual" ? 1 : viableLocations.length;

  const steps = [
    { label: "Details", icon: <PencilIcon /> },
    { label: "Schedule & Location", icon: <CalendarIcon /> },
    { label: "Capacity", icon: <UsersIcon /> },
  ];

  const canAdvance = () => {
    if (step === 0) return eventTitle.trim().length > 0;
    if (step === 1) {
      if (!durationLocked) return false;
      if (totalSelectedDates === 0) return false;
      if (format !== "virtual" && selectedLocations.length === 0) return false;
      return true;
    }
    if (step === 2) {
      if (quorum <= 0 || capacity < quorum) return false;
      if (format !== "virtual" && selectedLocations.length > 0 && viableLocations.length === 0) return false;
      return true;
    }
    return false;
  };

  const matchCount = totalSelectedDates * (format === "virtual" ? 1 : viableLocationCount);

  if (published) {
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
            <h2 style={styles.publishedTitle}>Gathering Published!</h2>
            {eventTitle && <p style={{ fontSize: 16, fontWeight: 600, color: "#1a2332", margin: "0 0 4px" }}>{eventTitle}</p>}
            {hosts.length > 0 && (
              <p style={{ fontSize: 13, color: "#7a8a9a", margin: "0 0 8px" }}>
                Hosted by you &amp; {hosts.map(h => h.name.split(" ")[0]).join(", ")}
              </p>
            )}
            <p style={styles.publishedSub}>
              Quorum matched <strong>{matchCount} viable option{matchCount !== 1 ? "s" : ""}</strong> across
              {availSets.length > 1 ? ` ${availSets.length} availability sets` : " your dates"} and locations.
              Invitees will rank their top 3 preferences.
            </p>
            <div style={styles.publishedDetails}>
              <div style={styles.publishedStat}>
                <span style={styles.publishedStatLabel}>Quorum needed</span>
                <span style={styles.publishedStatValue}>{quorum}</span>
              </div>
              <div style={styles.publishedStatDivider} />
              <div style={styles.publishedStat}>
                <span style={styles.publishedStatLabel}>Max capacity</span>
                <span style={styles.publishedStatValue}>{capacity}</span>
              </div>
              <div style={styles.publishedStatDivider} />
              <div style={styles.publishedStat}>
                <span style={styles.publishedStatLabel}>Overflow</span>
                <span style={styles.publishedStatValue}>{overflow ? "On" : "Off"}</span>
              </div>
            </div>
            <button style={{ ...styles.primaryBtn, marginTop: 24, maxWidth: 240 }} onClick={() => { setPublished(false); setStep(0); setEventTitle(""); setEventDescription(""); setHosts([]); setEventImage(null); setAvailSets([createEmptySet()]); setDuration(null); setDurationLocked(false); setIdealTimes({}); setProtectCommute(true); }}>
              Start New Gathering
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
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
          <p style={styles.subtitle}>Schedule your gathering</p>
        </div>

        <div style={styles.stepRow}>
          {steps.map((st, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{ ...styles.stepDot, ...(i < step ? styles.stepDotDone : {}), ...(i === step ? styles.stepDotActive : {}) }}>
                {i < step ? <CheckIcon /> : st.icon}
              </div>
              <span style={{ ...styles.stepLabel, ...(i === step ? styles.stepLabelActive : {}), ...(i < step ? styles.stepLabelDone : {}) }}>
                {st.label}
              </span>
              {i < steps.length - 1 && <div style={{ ...styles.stepLine, ...(i < step ? styles.stepLineDone : {}) }} />}
            </div>
          ))}
        </div>

        <div style={styles.stepContent}>
          {/* Event summary card — visible on steps after Details */}
          {step > 0 && eventTitle && (
            <div style={styles.eventSummaryCard}>
              {eventImage && (
                <div style={styles.eventSummaryCover}>
                  <img src={eventImage.dataUrl} alt="" style={styles.eventSummaryCoverImg} />
                </div>
              )}
              <div style={styles.eventSummaryBody}>
                <div style={styles.eventSummaryTitle}>{eventTitle}</div>
                {eventDescription && (
                  <div style={styles.eventSummaryDesc}>{eventDescription}</div>
                )}
                <div style={styles.eventSummaryMeta}>
                  <span style={styles.eventSummaryMetaItem}>
                    <UsersIcon />
                    You{hosts.length > 0 ? `, ${hosts.map(h => h.name.split(" ")[0]).join(", ")}` : ""}
                  </span>
                  {duration && (
                    <span style={styles.eventSummaryMetaItem}>
                      <ClockIcon />
                      {formatDurationLabel(duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 0 && (
            <div>
              <h3 style={styles.stepTitle}>Describe your gathering</h3>
              <p style={styles.stepDesc}>Give invitees the essential details so they know what to expect.</p>

              {/* Title */}
              <div style={styles.detailsField}>
                <label style={styles.detailsLabel}>Title <span style={styles.detailsRequired}>*</span></label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Q1 Community Planning Session"
                  style={styles.detailsInput}
                  maxLength={100}
                />
                <div style={styles.detailsCharCount}>{eventTitle.length}/100</div>
              </div>

              {/* Description */}
              <div style={styles.detailsField}>
                <label style={styles.detailsLabel}>Description <span style={styles.detailsOptional}>(optional)</span></label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="What's the purpose of this gathering? Any preparation needed?"
                  style={styles.detailsTextarea}
                  maxLength={500}
                />
                <div style={styles.detailsCharCount}>{eventDescription.length}/500</div>
              </div>

              {/* Co-hosts */}
              <div style={styles.detailsField}>
                <label style={styles.detailsLabel}>Co-hosts <span style={styles.detailsOptional}>(optional)</span></label>
                <p style={styles.detailsHint}>Add co-hosts who can help manage this gathering.</p>

                {/* Selected hosts chips */}
                {hosts.length > 0 && (
                  <div style={styles.hostChips}>
                    {hosts.map(host => (
                      <div key={host.id} style={styles.hostChip}>
                        <div style={{ ...styles.hostAvatar, background: host.avatar }}>{host.name.charAt(0)}</div>
                        <span style={styles.hostChipName}>{host.name}</span>
                        <button
                          onClick={() => setHosts(prev => prev.filter(h => h.id !== host.id))}
                          style={styles.hostChipRemove}
                          title="Remove"
                        >
                          <XSmallIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div style={styles.hostSearchWrap}>
                  <input
                    type="text"
                    value={hostSearch}
                    onChange={(e) => { setHostSearch(e.target.value); setShowHostSuggestions(true); }}
                    onFocus={() => setShowHostSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowHostSuggestions(false), 150)}
                    placeholder="Search by name or email..."
                    style={styles.detailsInput}
                  />
                  {showHostSuggestions && hostSearch.trim().length > 0 && (
                    <div style={styles.hostSuggestions}>
                      {MOCK_CONTACTS
                        .filter(c =>
                          !hosts.some(h => h.id === c.id) &&
                          (c.name.toLowerCase().includes(hostSearch.toLowerCase()) ||
                           c.email.toLowerCase().includes(hostSearch.toLowerCase()))
                        )
                        .slice(0, 4)
                        .map(contact => (
                          <button
                            key={contact.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setHosts(prev => [...prev, contact]);
                              setHostSearch("");
                              setShowHostSuggestions(false);
                            }}
                            style={styles.hostSuggestionItem}
                          >
                            <div style={{ ...styles.hostAvatar, background: contact.avatar }}>{contact.name.charAt(0)}</div>
                            <div style={{ flex: 1, textAlign: "left" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2332" }}>{contact.name}</div>
                              <div style={{ fontSize: 11, color: "#7a8a9a" }}>{contact.email}</div>
                            </div>
                          </button>
                        ))
                      }
                      {MOCK_CONTACTS.filter(c =>
                        !hosts.some(h => h.id === c.id) &&
                        (c.name.toLowerCase().includes(hostSearch.toLowerCase()) ||
                         c.email.toLowerCase().includes(hostSearch.toLowerCase()))
                      ).length === 0 && (
                        <div style={styles.hostSuggestionEmpty}>No matches found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Event image */}
              <div style={styles.detailsField}>
                <label style={styles.detailsLabel}>
                  <ImageIcon /> Cover Image <span style={styles.detailsOptional}>(optional)</span>
                </label>
                <p style={styles.detailsHint}>Add a cover image to make your gathering stand out.</p>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setEventImage({ name: file.name, dataUrl: reader.result });
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />

                {eventImage ? (
                  <div style={styles.imagePreview}>
                    <img src={eventImage.dataUrl} alt="Cover" style={styles.imagePreviewImg} />
                    <div style={styles.imagePreviewOverlay}>
                      <span style={styles.imageFileName}>{eventImage.name}</span>
                      <button
                        onClick={() => setEventImage(null)}
                        style={styles.imageRemoveBtn}
                      >
                        <XSmallIcon /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    style={styles.imageUploadBtn}
                  >
                    <ImageIcon />
                    <span>Choose an image</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              {/* === DURATION SECTION === */}
              <div style={{ ...styles.durationSection, ...(durationLocked ? styles.durationSectionLocked : {}) }}>
                <div style={styles.durationSectionHeader}>
                  <div>
                    <h3 style={{ ...styles.stepTitle, margin: 0 }}>How long is your gathering?</h3>
                    {!durationLocked && <p style={{ ...styles.stepDesc, marginBottom: 0 }}>Select a duration to unlock scheduling below.</p>}
                  </div>
                  {durationLocked && (
                    <button
                      onClick={() => setDurationLocked(false)}
                      style={{ ...styles.lockBtn, ...styles.lockBtnLocked }}
                      title="Unlock to change duration"
                    >
                      <LockIcon />
                    </button>
                  )}
                </div>
                {durationLocked ? (
                  <div style={styles.durationLockedSummary}>
                    <ClockIcon />
                    <span style={styles.durationLockedText}>{formatDurationLabel(duration)}</span>
                  </div>
                ) : (
                  <>
                    <div style={styles.durationGrid}>
                      {DURATIONS.map((d) => (
                        <button key={d} onClick={() => { setDuration(d); setDurationLocked(true); }} style={{ ...styles.durationChip, ...(duration === d ? styles.durationChipActive : {}) }}>
                          {formatDurationLabel(d)}
                        </button>
                      ))}
                    </div>
                    <div style={styles.customDuration}>
                      <label style={styles.fieldLabel}>Or enter custom minutes</label>
                      <input type="number" value={duration === null || duration === "" ? "" : duration} onChange={(e) => { const v = e.target.value; if (v === "") { setDuration(""); return; } const n = parseInt(v); if (!isNaN(n)) setDuration(n); }} onBlur={() => { if (!duration || duration < 15) setDuration(15); }} style={styles.numberInput} min="15" step="15" placeholder="e.g. 75" />
                      {duration > 0 && !durationLocked && (
                        <button onClick={() => setDurationLocked(true)} style={styles.lockCustomBtn}>
                          Set {formatDurationLabel(duration)}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* === SCHEDULE SECTION === */}
              <div style={{ marginTop: 24, ...(durationLocked ? {} : styles.scheduleDisabled) }}>
                <h3 style={styles.stepTitle}>When should this happen?</h3>
                <p style={styles.stepDesc}>Define your availability windows. Quorum will cross-reference with location schedules.</p>
                {durationLocked && (
                  <div>
                    {availSets.map((set, i) => (
                      <AvailabilitySet key={set.id} set={set} index={i} colors={SET_COLORS[i % SET_COLORS.length]}
                        onToggleDate={(dateStr) => toggleDateInSet(i, dateStr)} onChangeTime={(field, val) => changeTimeInSet(i, field, val)}
                        onRemove={() => removeSet(i)} canRemove={availSets.length > 1}
                        collapsed={availSets.length > 1 && expandedSet !== i} onExpand={() => setExpandedSet(i)}
                        duration={duration} />
                    ))}
                    {availSets.length < 5 && (
                      <button onClick={addSet} style={styles.addSetBtn}><PlusIcon /><span>Add another availability</span></button>
                    )}
                    <div style={styles.setsSummary}>
                      <InfoIcon />
                      <span>{totalSelectedDates} date{totalSelectedDates !== 1 ? "s" : ""} across {availSets.length} availability set{availSets.length !== 1 ? "s" : ""}{availSets.length > 1 && " — each set has its own time window"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* === SECTION DIVIDER === */}
              <div style={styles.sectionDivider} />

              {/* === LOCATION SECTION === */}
              <div style={durationLocked ? {} : styles.scheduleDisabled}>
                <h3 style={styles.stepTitle}>Where could this happen?</h3>
                <p style={styles.stepDesc}>Locations are matched like participants — Quorum checks their availability automatically.</p>
                {/* Format chips */}
                <div style={styles.formatRow}>
                  {["in-person", "virtual", "hybrid"].map((f) => (
                    <button key={f} onClick={() => setFormat(f)} style={{ ...styles.formatChip, ...(format === f ? styles.formatChipActive : {}) }}>
                      {f === "in-person" ? "In-Person" : f === "virtual" ? "Virtual" : "Hybrid"}
                    </button>
                  ))}
                </div>
                {/* Location cards */}
                {(format === "in-person" || format === "hybrid") && (
                  <div style={styles.locationList}>
                    {LOCATIONS.map((loc) => {
                      const selected = selectedLocations.includes(loc.id);
                      const locAvail = totalSelectedDates > 0 ? getLocationOverallAvailability(loc.id, availSets, duration) : { level: null, dates: [] };
                      const overallColor = locAvail.level === "green" ? "#43a047" : locAvail.level === "amber" ? "#f9a825" : locAvail.level === "red" ? "#e53935" : null;
                      const overallLabel = locAvail.level === "green" ? "Available for all dates" : locAvail.level === "amber" ? "Partially available" : locAvail.level === "red" ? "No availability" : "Availability synced";
                      return (
                        <div key={loc.id} style={{ ...styles.locationCard, ...(selected ? styles.locationCardSelected : {}), flexDirection: "column", cursor: "pointer" }} onClick={() => toggleLocation(loc.id)}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={styles.locationCheck}>
                              <div style={{ ...styles.checkbox, ...(selected ? styles.checkboxChecked : {}) }}>{selected && <CheckIcon />}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={styles.locationName}>{loc.name}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                <span style={styles.locationAddr}>{loc.address}</span>
                                <DirectionsLink address={loc.address} />
                              </div>
                              <CommuteInput locId={loc.id} value={commuteTimes[loc.id] || 0} onChange={updateCommuteTime} />
                              <div style={{ ...styles.locationAvail, marginTop: 4 }}>
                                <span style={{ ...styles.availDot, background: overallColor || "#43a047" }} />
                                {overallLabel}
                              </div>
                            </div>
                          </div>
                          {locAvail.dates.length > 0 && (
                            <div style={styles.locDateList}>
                              {locAvail.dates.map((d) => {
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
                )}
                {format === "virtual" && (
                  <div style={styles.virtualNote}><InfoIcon /><span>A virtual meeting link will be generated once the gathering is confirmed.</span></div>
                )}
              </div>

              {/* === IDEAL TIME SECTION (at bottom, conditional) === */}
              {format !== "virtual" && selectedLocations.length > 0 && duration && durationLocked && (
                <>
                  <div style={styles.sectionDivider} />
                  <div style={styles.timelineSection}>
                    <div style={styles.timelineSectionLabel}>
                      <ClockIcon />
                      <span>Ideal time</span>
                    </div>
                    <p style={styles.timelineHint}>Drag to set your preferred time. Commute buffer is shown on each side.</p>
                    {/* Protect your commute toggle */}
                    <label style={styles.protectCommuteRow}>
                      <input
                        type="checkbox"
                        checked={protectCommute}
                        onChange={(e) => setProtectCommute(e.target.checked)}
                        style={styles.protectCommuteCheckbox}
                      />
                      <div>
                        <span style={styles.protectCommuteLabel}>Protect your commute</span>
                        <span style={styles.protectCommuteDesc}>
                          {protectCommute
                            ? "Your gathering can\u2019t overlap with travel time"
                            : "Commute protection off \u2014 you can schedule over travel time"}
                        </span>
                      </div>
                    </label>
                    {availSets.map((set, i) => {
                      if (set.dates.length === 0) return null;
                      const colors = SET_COLORS[i % SET_COLORS.length];
                      return (
                        <IdealTimeSlider
                          key={set.id}
                          set={set}
                          setIndex={i}
                          colors={colors}
                          duration={duration}
                          commuteMins={maxCommuteMinutes}
                          idealStart={idealTimes[set.id] ?? null}
                          onIdealStartChange={(val) => setIdealTimes(prev => ({ ...prev, [set.id]: val }))}
                          protectCommute={protectCommute}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={styles.stepTitle}>Set your attendance thresholds</h3>
              <p style={styles.stepDesc}>Quorum locks in the gathering once the minimum is reached. Overflow creates new sessions from excess demand.</p>
              <div style={styles.capacityRow}>
                <div style={styles.capacityField}>
                  <label style={styles.fieldLabel}>Quorum <span style={styles.fieldHint}>(minimum)</span></label>
                  <input type="number" value={quorum === "" ? "" : quorum} onChange={(e) => { const v = e.target.value; if (v === "") { setQuorum(""); return; } const n = parseInt(v); if (!isNaN(n)) setQuorum(n); }} onBlur={() => { if (!quorum || quorum < 2) setQuorum(2); }} style={styles.numberInput} min="2" />
                  <p style={styles.fieldNote}>Gathering confirms when this many accept</p>
                </div>
                <div style={styles.capacityField}>
                  <label style={styles.fieldLabel}>Capacity <span style={styles.fieldHint}>(maximum)</span></label>
                  <input type="number" value={capacity === "" ? "" : capacity} onChange={(e) => { const v = e.target.value; if (v === "") { setCapacity(""); return; } const n = parseInt(v); if (!isNaN(n)) setCapacity(n); }} onBlur={() => { const min = quorum || 2; if (!capacity || capacity < min) setCapacity(min); }} style={styles.numberInput} min={quorum || 2} />
                  <p style={styles.fieldNote}>Waitlist starts after this number</p>
                </div>
              </div>
              {format !== "virtual" && exceededLocations.length > 0 && (
                <div style={{
                  padding: "12px 16px", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10,
                  border: `1.5px solid ${viableLocations.length === 0 ? "#ffcdd2" : "#ffe0b2"}`,
                  background: viableLocations.length === 0 ? "#fff5f5" : "#fff8f0",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{viableLocations.length === 0 ? "\u26A0\uFE0F" : "\u2139\uFE0F"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: viableLocations.length === 0 ? "#c62828" : "#e65100" }}>
                      {viableLocations.length === 0
                        ? "Capacity exceeds all selected locations"
                        : `Capacity exceeds ${exceededLocations.length} of ${selectedLocations.length} location${selectedLocations.length !== 1 ? "s" : ""}`}
                    </div>
                    <div style={{ fontSize: 12, color: "#5a6a7a", lineHeight: 1.6 }}>
                      {exceededLocations.map(loc => (
                        <div key={loc.id}>{loc.name} — max capacity {loc.capacity}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div style={styles.overflowToggle}>
                <button onClick={() => setOverflow(!overflow)} style={styles.toggleRow}>
                  <div style={{ ...styles.toggle, ...(overflow ? styles.toggleOn : {}) }}>
                    <div style={{ ...styles.toggleKnob, ...(overflow ? styles.toggleKnobOn : {}) }} />
                  </div>
                  <div>
                    <div style={styles.toggleLabel}>Enable overflow gatherings</div>
                    <div style={styles.toggleDesc}>Automatically offer remaining slots to waitlisted invitees. A new gathering is created when quorum is reached again.</div>
                  </div>
                </button>
              </div>
              <div style={styles.summaryBox}>
                <div
                  onClick={() => setMatchingExpanded(!matchingExpanded)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 14 }}
                >
                  <div style={{ ...styles.summaryTitle, marginBottom: 0 }}>Matching preview</div>
                  <div style={{ color: "#9aa5b4", transform: matchingExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "flex" }}>
                    <ChevronDown />
                  </div>
                </div>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{duration} min</span>
                    <span style={styles.summaryLabel}>Duration</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={{
                      ...styles.summaryValue,
                      ...(format !== "virtual" && viableLocations.length === 0 && selectedLocations.length > 0 ? { color: "#e53935" } : {}),
                    }}>
                      {format === "virtual" ? "Virtual" : `${viableLocations.length} location${viableLocations.length !== 1 ? "s" : ""}`}
                      {format === "hybrid" ? " + virtual" : ""}
                    </span>
                    <span style={styles.summaryLabel}>Venue</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={{ ...styles.summaryValue, ...(matchCount === 0 ? { color: "#e53935" } : {}) }}>{matchCount}</span>
                    <span style={styles.summaryLabel}>Viable options</span>
                  </div>
                  {availSets.length > 1 && (
                    <div style={styles.summaryItem}>
                      <span style={styles.summaryValue}>{availSets.length}</span>
                      <span style={styles.summaryLabel}>Avail. sets</span>
                    </div>
                  )}
                </div>
                {matchingExpanded && format !== "virtual" && selectedLocations.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #dde8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                    {LOCATIONS.filter(l => selectedLocations.includes(l.id)).map(loc => {
                      const isViable = capacity <= loc.capacity;
                      return (
                        <div key={loc.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isViable ? "#43a047" : "#e53935", flexShrink: 0 }} />
                          <span style={{ flex: 1, color: isViable ? "#1a2332" : "#9aa5b4", fontWeight: 500 }}>{loc.name}</span>
                          <span style={{ color: "#7a8a9a", fontSize: 12 }}>Cap: {loc.capacity}</span>
                          {!isViable && <span style={{ fontSize: 11, color: "#e53935", fontWeight: 600, background: "#ffebee", padding: "2px 8px", borderRadius: 6 }}>Exceeded</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={styles.navRow}>
          {step > 0 && <button onClick={() => setStep(step - 1)} style={styles.backBtn}>Back</button>}
          <div style={{ flex: 1 }} />
          {step < 2 ? (
            <button onClick={() => canAdvance() && setStep(step + 1)} style={{ ...styles.primaryBtn, ...(canAdvance() ? {} : styles.primaryBtnDisabled) }} disabled={!canAdvance()}>Continue</button>
          ) : (
            <button onClick={() => canAdvance() && setPublished(true)} style={{ ...styles.publishBtn, ...(canAdvance() ? {} : styles.primaryBtnDisabled) }} disabled={!canAdvance()}>Publish Gathering</button>
          )}
        </div>
      </div>
    </div>
  );
}
const styles = {
  backToHub: { display: "flex", alignItems: "center", background: "none", border: "none", color: "#7a8a9a", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "0 0 14px", fontFamily: "'DM Sans', 'Avenir', 'Segoe UI', sans-serif", transition: "color 0.2s" },
  container: { minHeight: "100vh", background: "linear-gradient(145deg, #0f1923 0%, #1a2a3a 40%, #0d2137 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", fontFamily: "'DM Sans', 'Avenir', 'Segoe UI', sans-serif" },
  card: { background: "#fff", borderRadius: 20, maxWidth: 660, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)", overflow: "hidden" },
  header: { padding: "32px 32px 20px", borderBottom: "1px solid #f0f0f0" },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logo: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, letterSpacing: -0.5 },
  logoText: { fontSize: 20, fontWeight: 700, color: "#1a2332", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "#7a8a9a", margin: "4px 0 0" },
  stepRow: { display: "flex", alignItems: "center", padding: "24px 32px 8px", gap: 0 },
  stepItem: { display: "flex", alignItems: "center", flex: 1, gap: 8 },
  stepDot: { width: 36, height: 36, borderRadius: "50%", border: "2px solid #dde3ea", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0bac5", flexShrink: 0, transition: "all 0.3s" },
  stepDotActive: { borderColor: "#2e86c1", color: "#2e86c1", background: "#eaf4fb" },
  stepDotDone: { borderColor: "#43a047", background: "#43a047", color: "#fff" },
  stepLabel: { fontSize: 12, fontWeight: 500, color: "#b0bac5", whiteSpace: "nowrap" },
  stepLabelActive: { color: "#1a2332", fontWeight: 600 },
  stepLabelDone: { color: "#43a047" },
  stepLine: { flex: 1, height: 2, background: "#e8ecf0", margin: "0 8px", borderRadius: 1, transition: "background 0.3s" },
  stepLineDone: { background: "#43a047" },
  stepContent: { padding: "24px 32px", minHeight: 300 },
  stepTitle: { fontSize: 18, fontWeight: 700, color: "#1a2332", margin: "0 0 6px", letterSpacing: -0.3 },
  stepDesc: { fontSize: 14, color: "#7a8a9a", margin: "0 0 24px", lineHeight: 1.5 },

  // Details step (step 0)
  detailsField: { marginBottom: 22, position: "relative" },
  detailsLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#4a5568", marginBottom: 6 },
  detailsRequired: { color: "#e53935", fontWeight: 700 },
  detailsOptional: { fontWeight: 400, color: "#9aa5b4" },
  detailsHint: { fontSize: 12, color: "#9aa5b4", margin: "0 0 8px", lineHeight: 1.4 },
  detailsInput: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e0e5eb", fontSize: 14, fontWeight: 500, color: "#1a2332", background: "#fafbfc", fontFamily: "inherit", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  detailsTextarea: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e0e5eb", fontSize: 14, color: "#1a2332", background: "#fafbfc", fontFamily: "inherit", outline: "none", minHeight: 100, resize: "vertical", lineHeight: 1.5, transition: "border-color 0.2s", boxSizing: "border-box" },
  detailsCharCount: { fontSize: 11, color: "#b0bac5", textAlign: "right", marginTop: 4 },

  // Event summary card (shown on steps after Details)
  eventSummaryCard: { borderRadius: 14, border: "1.5px solid #e0e5eb", background: "#f5f7fa", marginBottom: 20, overflow: "hidden" },
  eventSummaryCover: { width: "100%", height: 80, overflow: "hidden" },
  eventSummaryCoverImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  eventSummaryBody: { padding: "14px 18px" },
  eventSummaryTitle: { fontSize: 16, fontWeight: 700, color: "#1a2332", letterSpacing: -0.2, marginBottom: 4 },
  eventSummaryDesc: { fontSize: 13, color: "#5a6a7a", lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  eventSummaryMeta: { display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#7a8a9a" },
  eventSummaryMetaItem: { display: "flex", alignItems: "center", gap: 5 },

  // Co-host chips & search
  hostChips: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  hostChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 5px", borderRadius: 20, background: "#eaf4fb", border: "1px solid #b3d7f2" },
  hostAvatar: { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 },
  hostChipName: { fontSize: 12, fontWeight: 600, color: "#1a5276" },
  hostChipRemove: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "#7a8a9a", display: "flex", alignItems: "center", marginLeft: 2, transition: "color 0.15s" },
  hostSearchWrap: { position: "relative" },
  hostSuggestions: { position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)", padding: "6px", zIndex: 20, overflow: "hidden" },
  hostSuggestionItem: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" },
  hostSuggestionEmpty: { padding: "12px 10px", fontSize: 13, color: "#9aa5b4", textAlign: "center" },

  // Event image
  imageUploadBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "28px 16px", borderRadius: 12, border: "2px dashed #d0d8e0", background: "#fafbfc", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: "#7a8a9a", transition: "all 0.2s" },
  imagePreview: { position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e0e5eb" },
  imagePreviewImg: { width: "100%", height: 160, objectFit: "cover", display: "block" },
  imagePreviewOverlay: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f5f7fa", borderTop: "1px solid #e8ecf0" },
  imageFileName: { fontSize: 12, color: "#5a6a7a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 },
  imageRemoveBtn: { display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#e53935", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" },

  durationSection: { padding: "20px", borderRadius: 14, border: "1.5px solid #e0e5eb", background: "#fafbfc", marginBottom: 0 },
  durationSectionLocked: { background: "#f0f6ff", borderColor: "#c4ddf0" },
  durationSectionHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  lockBtn: { width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e0e5eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa5b4", transition: "all 0.2s", flexShrink: 0 },
  lockBtnLocked: { borderColor: "#2e86c1", background: "#eaf4fb", color: "#2e86c1" },
  durationLockedSummary: { display: "flex", alignItems: "center", gap: 10, marginTop: 4, color: "#1a5276", fontSize: 15, fontWeight: 600 },
  durationLockedText: { fontSize: 16 },
  lockCustomBtn: { padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit", marginLeft: 8, whiteSpace: "nowrap" },
  scheduleDisabled: { opacity: 0.35, pointerEvents: "none", filter: "grayscale(0.5)" },
  durationGrid: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, marginTop: 4 },
  durationChip: { padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e0e5eb", background: "#fafbfc", fontSize: 14, fontWeight: 500, color: "#4a5568", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  durationChipActive: { borderColor: "#2e86c1", background: "#eaf4fb", color: "#1a5276", fontWeight: 600 },
  customDuration: { display: "flex", alignItems: "center", gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 6 },
  fieldLabelSmall: { fontSize: 12, fontWeight: 600, color: "#6a7585", display: "block", marginBottom: 4 },
  fieldHint: { fontWeight: 400, color: "#9aa5b4" },
  numberInput: { width: 90, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e0e5eb", fontSize: 15, fontWeight: 500, color: "#1a2332", outline: "none", fontFamily: "inherit", background: "#fafbfc" },
  formatRow: { display: "flex", gap: 10, marginBottom: 20 },
  formatChip: { padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e0e5eb", background: "#fafbfc", fontSize: 13, fontWeight: 500, color: "#4a5568", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  formatChipActive: { borderColor: "#2e86c1", background: "#eaf4fb", color: "#1a5276", fontWeight: 600 },
  sectionDivider: { height: 1, background: "#eef1f5", margin: "28px 0" },
  locationList: { display: "flex", flexDirection: "column", gap: 12 },
  locationCard: { display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", borderRadius: 14, border: "1.5px solid #e8ecf0", background: "#fafbfc", cursor: "pointer", transition: "all 0.2s", textAlign: "left", fontFamily: "inherit" },
  locationCardSelected: { borderColor: "#2e86c1", background: "#eaf4fb" },
  locationCheck: { paddingTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: "2px solid #ccd3dc", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s" },
  checkboxChecked: { borderColor: "#2e86c1", background: "#2e86c1" },
  locationName: { fontSize: 14, fontWeight: 600, color: "#1a2332", marginBottom: 2 },
  locationAddr: { fontSize: 13, color: "#7a8a9a" },
  locationAvail: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5a6a7a", fontWeight: 500 },
  locDateList: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid #eef1f5" },
  locDateItem: { display: "flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 7px", borderRadius: 8, background: "#f5f7fa", fontSize: 11, color: "#4a5568" },
  locDateDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  locDateLabel: { whiteSpace: "nowrap" },
  availDot: { width: 7, height: 7, borderRadius: "50%", background: "#43a047" },
  virtualNote: { display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "#f0f6ff", borderRadius: 12, fontSize: 13, color: "#3a6fa0", lineHeight: 1.5 },
  setCard: { borderRadius: 14, border: "1.5px solid #e0e5eb", marginBottom: 16, overflow: "hidden" },
  setHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" },
  setHeaderLeft: { display: "flex", alignItems: "center", gap: 10 },
  setDot: { width: 10, height: 10, borderRadius: "50%" },
  setTitle: { fontSize: 13, fontWeight: 700, color: "#1a2332" },
  setDateCount: { fontSize: 12, color: "#7a8a9a", fontWeight: 500 },
  setRemoveBtn: { padding: "6px 8px", borderRadius: 8, border: "none", background: "transparent", color: "#b0bac5", cursor: "pointer", display: "flex", alignItems: "center", transition: "color 0.2s" },
  collapsedBody: { padding: "10px 16px 12px", display: "flex", flexDirection: "column", gap: 6 },
  collapsedRow: { display: "flex", alignItems: "center", gap: 8, color: "#5a6a7a", fontSize: 13 },
  collapsedText: { lineHeight: 1.4 },
  setSection: { padding: "14px 16px" },
  setSectionLabel: { fontSize: 12, fontWeight: 600, color: "#6a7585", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  calNavRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  calNavBtn: { width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e0e5eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a5568", transition: "all 0.15s", fontFamily: "inherit" },
  calMonthLabel: { fontSize: 15, fontWeight: 700, color: "#1a2332", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", fontFamily: "inherit", padding: "4px 8px", borderRadius: 8, transition: "background 0.15s" },
  yearPickerRow: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 },
  yearChip: { padding: "6px 16px", borderRadius: 8, border: "1.5px solid #e0e5eb", background: "#fafbfc", fontSize: 13, fontWeight: 600, color: "#4a5568", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  yearChipActive: { borderColor: "#2e86c1", background: "#eaf4fb", color: "#1a5276" },
  calDayHeaders: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 },
  calDayHeader: { textAlign: "center", fontSize: 11, fontWeight: 600, color: "#9aa5b4", textTransform: "uppercase", padding: "4px 0" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 },
  calEmpty: { aspectRatio: "1", minHeight: 36 },
  calCell: { aspectRatio: "1", minHeight: 36, borderRadius: 8, border: "1.5px solid #e8ecf0", background: "#fff", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#1a2332", display: "flex", alignItems: "center", justifyContent: "center" },
  calCellPast: { opacity: 0.3, cursor: "default", background: "#f5f5f5" },
  calCellWeekend: { background: "#f9f9fb", borderColor: "#eaeaea" },
  calCellToday: { borderColor: "#2e86c1", borderWidth: 2 },
  calCellSelected: { color: "#fff", borderWidth: 2 },
  calBar: { position: "absolute", bottom: 2, left: 3, right: 3, height: 3, borderRadius: 2 },
  calLegend: { display: "flex", gap: 14, marginTop: 10, justifyContent: "center" },
  calLegendItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7a8a9a" },
  calLegendBar: { width: 16, height: 3, borderRadius: 2 },
  popover: { width: 260, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)", padding: 0, overflow: "hidden", cursor: "default" },
  popoverHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f0f0f0", background: "#fafbfc" },
  popoverTitle: { fontSize: 13, fontWeight: 700, color: "#1a2332" },
  popoverBadge: { display: "flex", alignItems: "center", fontSize: 10, color: "#4285f4", fontWeight: 600, background: "#e8f0fe", padding: "2px 8px", borderRadius: 10 },
  popoverWindow: { padding: "6px 14px", background: "#f5f7fa", fontSize: 11, color: "#6a7585", fontWeight: 600, borderBottom: "1px solid #f0f0f0" },
  popoverWindowLabel: {},
  popoverList: { listStyle: "none", padding: "8px 14px 10px", margin: 0, display: "flex", flexDirection: "column", gap: 5 },
  popoverListItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#1a2332", lineHeight: 1.3 },
  popoverBullet: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  popoverItemText: { fontSize: 11, color: "#4a5568" },
  timeRange: { display: "flex", alignItems: "flex-end", gap: 12 },
  timeField: { flex: 1 },
  timeDash: { paddingBottom: 12, color: "#b0bac5", fontWeight: 500 },
  selectWrap: { position: "relative" },
  select: { width: "100%", padding: "10px 36px 10px 14px", borderRadius: 10, border: "1.5px solid #e0e5eb", fontSize: 14, fontWeight: 500, color: "#1a2332", background: "#fafbfc", appearance: "none", outline: "none", fontFamily: "inherit", cursor: "pointer" },
  selectArrow: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9aa5b4", pointerEvents: "none" },
  addSetBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 20px", borderRadius: 12, border: "2px dashed #d0d8e0", background: "transparent", fontSize: 14, fontWeight: 600, color: "#6a7585", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", marginBottom: 16 },
  setsSummary: { display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#f5f7fa", borderRadius: 10, fontSize: 13, color: "#5a6a7a", lineHeight: 1.4 },
  capacityRow: { display: "flex", gap: 24, marginBottom: 24 },
  capacityField: { flex: 1 },
  fieldNote: { fontSize: 12, color: "#9aa5b4", marginTop: 6 },
  overflowToggle: { marginBottom: 24 },
  toggleRow: { display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", borderRadius: 14, border: "1.5px solid #e8ecf0", background: "#fafbfc", cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" },
  toggle: { width: 44, height: 24, borderRadius: 12, background: "#d5dbe3", position: "relative", flexShrink: 0, transition: "background 0.2s", marginTop: 2 },
  toggleOn: { background: "#2e86c1" },
  toggleKnob: { width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" },
  toggleKnobOn: { left: 22 },
  toggleLabel: { fontSize: 14, fontWeight: 600, color: "#1a2332", marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: "#7a8a9a", lineHeight: 1.5 },
  summaryBox: { background: "linear-gradient(135deg, #f0f6ff 0%, #f8fafb 100%)", borderRadius: 14, padding: "18px 20px", border: "1px solid #dde8f0" },
  summaryTitle: { fontSize: 12, fontWeight: 600, color: "#7a8a9a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 },
  summaryGrid: { display: "flex", gap: 20 },
  summaryItem: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  summaryValue: { fontSize: 18, fontWeight: 700, color: "#1a2332" },
  summaryLabel: { fontSize: 12, color: "#9aa5b4", fontWeight: 500 },
  navRow: { display: "flex", alignItems: "center", padding: "16px 32px 28px", gap: 12 },
  backBtn: { padding: "11px 24px", borderRadius: 10, border: "1.5px solid #e0e5eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#4a5568", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  primaryBtn: { padding: "11px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(26,82,118,0.25)" },
  primaryBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  publishBtn: { padding: "11px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1e7e34 0%, #43a047 100%)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(30,126,52,0.25)" },
  publishedState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 32px", textAlign: "center" },
  publishedIcon: { marginBottom: 20 },
  publishedTitle: { fontSize: 22, fontWeight: 700, color: "#1a2332", margin: "0 0 10px" },
  publishedSub: { fontSize: 15, color: "#7a8a9a", lineHeight: 1.6, maxWidth: 400, margin: "0 0 24px" },
  publishedDetails: { display: "flex", gap: 24, alignItems: "center" },
  publishedStat: { display: "flex", flexDirection: "column", gap: 4, alignItems: "center" },
  publishedStatLabel: { fontSize: 12, color: "#9aa5b4", fontWeight: 500 },
  publishedStatValue: { fontSize: 20, fontWeight: 700, color: "#1a2332" },
  publishedStatDivider: { width: 1, height: 32, background: "#e8ecf0" },

  // Directions link
  directionsLink: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#2e86c1", textDecoration: "none", padding: "2px 0", borderBottom: "1px dashed #2e86c1", transition: "opacity 0.15s", lineHeight: 1 },

  // Commute input
  commuteInputRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5a6a7a", marginTop: 2, padding: "2px 0" },
  commuteValueText: { fontWeight: 600, color: "#1a2332", borderBottom: "1px dashed #b0bac5", lineHeight: 1.2 },
  commuteNumberInput: { width: 52, padding: "3px 6px", borderRadius: 6, border: "1.5px solid #2e86c1", fontSize: 13, fontWeight: 600, color: "#1a2332", outline: "none", fontFamily: "inherit", background: "#fff", textAlign: "center" },
  commuteUnit: { fontSize: 12, color: "#7a8a9a" },

  // Timeline section
  timelineSection: { marginTop: 20, padding: "18px 20px", borderRadius: 14, border: "1.5px solid #e0e5eb", background: "#fafbfc" },
  timelineSectionLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#1a2332", marginBottom: 4 },
  timelineHint: { fontSize: 12, color: "#9aa5b4", margin: "0 0 12px", lineHeight: 1.4 },
  protectCommuteRow: { display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#fff", border: "1.5px solid #e0e5eb", marginBottom: 16, cursor: "pointer", transition: "border-color 0.15s" },
  protectCommuteCheckbox: { width: 18, height: 18, marginTop: 1, accentColor: "#2e86c1", cursor: "pointer", flexShrink: 0 },
  protectCommuteLabel: { display: "block", fontSize: 13, fontWeight: 700, color: "#1a2332", lineHeight: 1.3 },
  protectCommuteDesc: { display: "block", fontSize: 11, color: "#9aa5b4", lineHeight: 1.4, marginTop: 2 },
  timelineRow: { marginBottom: 16 },
  timelineRowHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  timelineSetDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  timelineSetLabel: { fontSize: 13, fontWeight: 600, color: "#1a2332" },
  timelineSetDates: { fontSize: 11, color: "#9aa5b4", fontWeight: 500 },
  timelineBar: { position: "relative", height: 36, borderRadius: 8, background: "#eef1f5", overflow: "hidden" },
  timelineLabels: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#9aa5b4", marginTop: 4, padding: "0 2px" },
  timelineWarning: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#fff8f0", border: "1px solid #ffe0b2", fontSize: 12, color: "#e65100", lineHeight: 1.4 },
};
