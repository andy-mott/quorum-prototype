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
  { label: "Morning", value: "morning", hint: "Before noon" },
  { label: "Afternoon", value: "afternoon", hint: "Noon \u2013 5 pm" },
  { label: "Evening", value: "evening", hint: "After 5 pm" },
  { label: "Flexible", value: "flexible", hint: "Any time" },
];

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

function getTimeWindow(timePref) {
  if (timePref.length === 0) return null;
  if (timePref.includes("flexible")) return { start: 8, end: 21, label: "8:00 AM \u2014 9:00 PM" };

  const windows = {
    morning: { start: 8, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 21 },
  };

  let minStart = 24, maxEnd = 0;
  for (const pref of timePref) {
    const w = windows[pref];
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

function MiniCalendar({ selectedDates, onToggleDate, duration, timePref }) {
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

  const tw = getTimeWindow(timePref);
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

// ── Main Component ──────────────────────────────────────────

export default function SimpleHostForm({ onBack }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(null);
  const [timePref, setTimePref] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [quorum, setQuorum] = useState(5);
  const [showCapacity, setShowCapacity] = useState(false);
  const [capacity, setCapacity] = useState(20);
  const [published, setPublished] = useState(false);

  const toggleTimePref = (val) => {
    if (val === "flexible") {
      setTimePref(timePref.includes("flexible") ? [] : ["flexible"]);
      return;
    }
    const without = timePref.filter((v) => v !== "flexible");
    setTimePref(
      without.includes(val) ? without.filter((v) => v !== val) : [...without, val]
    );
  };

  const toggleDate = (key) => {
    setSelectedDates((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

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
                {timePref.map((v) => TIME_OF_DAY.find((t) => t.value === v)?.label).join(", ")}
              </span>
            </div>
            <button
              style={styles.primaryBtn}
              onClick={() => {
                setPublished(false);
                setTitle("");
                setDescription("");
                setDuration(null);
                setTimePref([]);
                setSelectedDates([]);
                setQuorum(5);
                setShowCapacity(false);
                setCapacity(20);
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
                  }}
                >
                  <span>{t.label}</span>
                  <span style={styles.chipHint}>{t.hint}</span>
                </button>
              ))}
            </div>
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
};
