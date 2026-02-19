import { useState } from "react";

const LOCATIONS = [
  { id: "loc1", name: "Community Center — Room A", address: "142 Main St" },
  { id: "loc2", name: "Downtown Library — Meeting Room 3", address: "88 Elm Ave" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateDates(count = 28) {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM",
];

const DURATIONS = [30, 45, 60, 90, 120, 150, 180];

const CADENCES = [
  "Every week",
  "Every other week",
  "1st & 3rd week of month",
  "2nd & 4th week of month",
  "Once a month",
];

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

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="6.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 15C1 12 3.5 10 6.5 10C9.5 10 12 12 12 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="12.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M14 10.5C15.5 11 17 12.5 17 15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const SET_COLORS = [
  { bg: "#eaf4fb", border: "#2e86c1", accent: "#2e86c1", light: "#d4eaf8" },
  { bg: "#fef3e2", border: "#e67e22", accent: "#e67e22", light: "#fde8c8" },
  { bg: "#f0e6f6", border: "#8e44ad", accent: "#8e44ad", light: "#e0cced" },
  { bg: "#e8f5e9", border: "#43a047", accent: "#43a047", light: "#c8e6c9" },
  { bg: "#fce4ec", border: "#c62828", accent: "#c62828", light: "#f8bbd0" },
];

function AvailabilitySet({ set, index, colors, dates, onToggleDate, onChangeTime, onRemove, canRemove }) {
  const formatDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const formatDayName = (d) => DAYS_OF_WEEK[d.getDay()];

  return (
    <div style={{ ...styles.setCard, borderColor: colors.border, background: "#fff" }}>
      <div style={{ ...styles.setHeader, background: colors.bg }}>
        <div style={styles.setHeaderLeft}>
          <div style={{ ...styles.setDot, background: colors.accent }} />
          <span style={styles.setTitle}>Availability {index + 1}</span>
          <span style={styles.setDateCount}>{set.dates.length} date{set.dates.length !== 1 ? "s" : ""}</span>
        </div>
        {canRemove && (
          <button onClick={onRemove} style={styles.setRemoveBtn}><TrashIcon /></button>
        )}
      </div>
      <div style={styles.setSection}>
        <label style={styles.setSectionLabel}>Select dates</label>
        <div style={styles.calendarGrid}>
          {dates.map((d) => {
            const key = d.toISOString().split("T")[0];
            const selected = set.dates.includes(key);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <button
                key={key}
                onClick={() => onToggleDate(key)}
                style={{
                  ...styles.dateCell,
                  ...(selected ? { ...styles.dateCellSelected, borderColor: colors.accent, background: colors.accent } : {}),
                  ...(isWeekend && !selected ? styles.dateCellWeekend : {}),
                }}
              >
                <span style={styles.dateDayName}>{formatDayName(d)}</span>
                <span style={styles.dateNumber}>{formatDate(d)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={styles.setSection}>
        <label style={styles.setSectionLabel}>Time window for these dates</label>
        <div style={styles.timeRange}>
          <div style={styles.timeField}>
            <label style={styles.fieldLabelSmall}>Earliest start</label>
            <div style={styles.selectWrap}>
              <select value={set.timeStart} onChange={(e) => onChangeTime("timeStart", e.target.value)} style={styles.select}>
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
    </div>
  );
}

export default function QuorumSchedulingForm() {
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState("single");
  const [duration, setDuration] = useState(90);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [format, setFormat] = useState("in-person");
  const [availSets, setAvailSets] = useState([createEmptySet()]);
  const [cadence, setCadence] = useState("");
  const [cadenceDay, setCadenceDay] = useState("Thu");
  const [seriesCount, setSeriesCount] = useState(2);
  const [seriesPeriod, setSeriesPeriod] = useState("2 weeks");
  const [quorum, setQuorum] = useState(5);
  const [capacity, setCapacity] = useState(20);
  const [overflow, setOverflow] = useState(false);
  const [published, setPublished] = useState(false);

  const dates = generateDates(28);

  const toggleLocation = (id) => {
    setSelectedLocations((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
  };

  const toggleDateInSet = (setIndex, dateStr) => {
    setAvailSets((prev) => prev.map((s, i) =>
      i === setIndex ? { ...s, dates: s.dates.includes(dateStr) ? s.dates.filter((d) => d !== dateStr) : [...s.dates, dateStr] } : s
    ));
  };

  const changeTimeInSet = (setIndex, field, value) => {
    setAvailSets((prev) => prev.map((s, i) => i === setIndex ? { ...s, [field]: value } : s));
  };

  const addSet = () => { if (availSets.length < 5) setAvailSets((prev) => [...prev, createEmptySet()]); };
  const removeSet = (setIndex) => { setAvailSets((prev) => prev.filter((_, i) => i !== setIndex)); };

  const totalSelectedDates = availSets.reduce((sum, s) => sum + s.dates.length, 0);

  const steps = [
    { label: "Duration", icon: <ClockIcon /> },
    { label: "Location", icon: <MapPinIcon /> },
    { label: "Schedule", icon: <CalendarIcon /> },
    { label: "Capacity", icon: <UsersIcon /> },
  ];

  const canAdvance = () => {
    if (step === 0) return duration > 0;
    if (step === 1) return format === "virtual" || selectedLocations.length > 0;
    if (step === 2) {
      if (eventType === "single") return totalSelectedDates > 0;
      if (eventType === "recurring") return cadence && cadenceDay;
      if (eventType === "limited") return seriesCount > 0;
    }
    if (step === 3) return quorum > 0 && capacity >= quorum;
    return false;
  };

  const matchCount = eventType === "single"
    ? totalSelectedDates * (format === "virtual" ? 1 : Math.max(selectedLocations.length, 1))
    : eventType === "recurring" ? (format === "virtual" ? 1 : Math.max(selectedLocations.length, 1)) * 4
    : seriesCount * (format === "virtual" ? 1 : Math.max(selectedLocations.length, 1));

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
            <button style={{ ...styles.primaryBtn, marginTop: 24, maxWidth: 240 }} onClick={() => { setPublished(false); setStep(0); setAvailSets([createEmptySet()]); }}>
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
          {step === 0 && (
            <div>
              <h3 style={styles.stepTitle}>How long is your gathering?</h3>
              <p style={styles.stepDesc}>This helps Quorum find time slots that fit.</p>
              <div style={styles.durationGrid}>
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setDuration(d)} style={{ ...styles.durationChip, ...(duration === d ? styles.durationChipActive : {}) }}>
                    {d < 60 ? `${d} min` : `${d / 60}${d % 60 ? `.5` : ``} hr${d > 60 ? "s" : ""}`}
                  </button>
                ))}
              </div>
              <div style={styles.customDuration}>
                <label style={styles.fieldLabel}>Or enter custom minutes</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Math.max(15, parseInt(e.target.value) || 0))} style={styles.numberInput} min="15" step="15" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={styles.stepTitle}>Where could this happen?</h3>
              <p style={styles.stepDesc}>Locations are matched like participants — Quorum checks their availability automatically.</p>
              <div style={styles.formatRow}>
                {["in-person", "virtual", "hybrid"].map((f) => (
                  <button key={f} onClick={() => setFormat(f)} style={{ ...styles.formatChip, ...(format === f ? styles.formatChipActive : {}) }}>
                    {f === "in-person" ? "In-Person" : f === "virtual" ? "Virtual" : "Hybrid"}
                  </button>
                ))}
              </div>
              {(format === "in-person" || format === "hybrid") && (
                <div style={styles.locationList}>
                  {LOCATIONS.map((loc) => {
                    const selected = selectedLocations.includes(loc.id);
                    return (
                      <button key={loc.id} onClick={() => toggleLocation(loc.id)} style={{ ...styles.locationCard, ...(selected ? styles.locationCardSelected : {}) }}>
                        <div style={styles.locationCheck}>
                          <div style={{ ...styles.checkbox, ...(selected ? styles.checkboxChecked : {}) }}>{selected && <CheckIcon />}</div>
                        </div>
                        <div>
                          <div style={styles.locationName}>{loc.name}</div>
                          <div style={styles.locationAddr}>{loc.address}</div>
                          <div style={styles.locationAvail}><span style={styles.availDot} />Availability synced</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {format === "virtual" && (
                <div style={styles.virtualNote}><InfoIcon /><span>A virtual meeting link will be generated once the gathering is confirmed.</span></div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={styles.stepTitle}>When should this happen?</h3>
              <p style={styles.stepDesc}>Choose an event type, then define your availability. Quorum will cross-reference with location availability.</p>
              <div style={styles.eventTypeRow}>
                {[
                  { key: "single", label: "Single Event", desc: "One-time gathering" },
                  { key: "recurring", label: "Recurring Series", desc: "Regular cadence" },
                  { key: "limited", label: "Limited Series", desc: "Set number of sessions" },
                ].map((t) => (
                  <button key={t.key} onClick={() => setEventType(t.key)} style={{ ...styles.eventTypeCard, ...(eventType === t.key ? styles.eventTypeCardActive : {}) }}>
                    <div style={{ ...styles.eventTypeRadio, ...(eventType === t.key ? styles.eventTypeRadioActive : {}) }}>
                      {eventType === t.key && <div style={styles.eventTypeRadioDot} />}
                    </div>
                    <div>
                      <div style={{ ...styles.eventTypeLabel, ...(eventType === t.key ? styles.eventTypeLabelActive : {}) }}>{t.label}</div>
                      <div style={styles.eventTypeDesc}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={styles.scheduleDivider} />

              {eventType === "single" && (
                <div>
                  {availSets.map((set, i) => (
                    <AvailabilitySet key={set.id} set={set} index={i} colors={SET_COLORS[i % SET_COLORS.length]} dates={dates}
                      onToggleDate={(dateStr) => toggleDateInSet(i, dateStr)} onChangeTime={(field, val) => changeTimeInSet(i, field, val)}
                      onRemove={() => removeSet(i)} canRemove={availSets.length > 1} />
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

              {eventType === "recurring" && (
                <div style={styles.cadenceSection}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Cadence</label>
                    <div style={styles.cadenceOptions}>
                      {CADENCES.map((c) => (
                        <button key={c} onClick={() => setCadence(c)} style={{ ...styles.cadenceChip, ...(cadence === c ? styles.cadenceChipActive : {}) }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Preferred day</label>
                    <div style={styles.dayRow}>
                      {DAYS_OF_WEEK.map((day) => (
                        <button key={day} onClick={() => setCadenceDay(day)} style={{ ...styles.dayChip, ...(cadenceDay === day ? styles.dayChipActive : {}) }}>{day}</button>
                      ))}
                    </div>
                  </div>
                  <div style={styles.timeRange}>
                    <div style={styles.timeField}>
                      <label style={styles.fieldLabelSmall}>Earliest start</label>
                      <div style={styles.selectWrap}>
                        <select value={availSets[0]?.timeStart || "9:00 AM"} onChange={(e) => changeTimeInSet(0, "timeStart", e.target.value)} style={styles.select}>
                          {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <div style={styles.selectArrow}><ChevronDown /></div>
                      </div>
                    </div>
                    <div style={styles.timeDash}>—</div>
                    <div style={styles.timeField}>
                      <label style={styles.fieldLabelSmall}>Latest end</label>
                      <div style={styles.selectWrap}>
                        <select value={availSets[0]?.timeEnd || "5:00 PM"} onChange={(e) => changeTimeInSet(0, "timeEnd", e.target.value)} style={styles.select}>
                          {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <div style={styles.selectArrow}><ChevronDown /></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {eventType === "limited" && (
                <div style={styles.cadenceSection}>
                  <div style={styles.limitedRow}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel}>Number of sessions</label>
                      <input type="number" value={seriesCount} onChange={(e) => setSeriesCount(Math.max(1, parseInt(e.target.value) || 1))} style={styles.numberInput} min="1" />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel}>Over what period</label>
                      <div style={styles.selectWrap}>
                        <select value={seriesPeriod} onChange={(e) => setSeriesPeriod(e.target.value)} style={styles.select}>
                          <option>1 week</option><option>2 weeks</option><option>3 weeks</option><option>1 month</option><option>2 months</option><option>3 months</option>
                        </select>
                        <div style={styles.selectArrow}><ChevronDown /></div>
                      </div>
                    </div>
                  </div>
                  <div style={styles.timeRange}>
                    <div style={styles.timeField}>
                      <label style={styles.fieldLabelSmall}>Earliest start</label>
                      <div style={styles.selectWrap}>
                        <select value={availSets[0]?.timeStart || "9:00 AM"} onChange={(e) => changeTimeInSet(0, "timeStart", e.target.value)} style={styles.select}>
                          {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <div style={styles.selectArrow}><ChevronDown /></div>
                      </div>
                    </div>
                    <div style={styles.timeDash}>—</div>
                    <div style={styles.timeField}>
                      <label style={styles.fieldLabelSmall}>Latest end</label>
                      <div style={styles.selectWrap}>
                        <select value={availSets[0]?.timeEnd || "5:00 PM"} onChange={(e) => changeTimeInSet(0, "timeEnd", e.target.value)} style={styles.select}>
                          {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <div style={styles.selectArrow}><ChevronDown /></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={styles.stepTitle}>Set your attendance thresholds</h3>
              <p style={styles.stepDesc}>Quorum locks in the gathering once the minimum is reached. Overflow creates new sessions from excess demand.</p>
              <div style={styles.capacityRow}>
                <div style={styles.capacityField}>
                  <label style={styles.fieldLabel}>Quorum <span style={styles.fieldHint}>(minimum)</span></label>
                  <input type="number" value={quorum} onChange={(e) => setQuorum(Math.max(2, parseInt(e.target.value) || 2))} style={styles.numberInput} min="2" />
                  <p style={styles.fieldNote}>Gathering confirms when this many accept</p>
                </div>
                <div style={styles.capacityField}>
                  <label style={styles.fieldLabel}>Capacity <span style={styles.fieldHint}>(maximum)</span></label>
                  <input type="number" value={capacity} onChange={(e) => setCapacity(Math.max(quorum, parseInt(e.target.value) || quorum))} style={styles.numberInput} min={quorum} />
                  <p style={styles.fieldNote}>Waitlist starts after this number</p>
                </div>
              </div>
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
                <div style={styles.summaryTitle}>Matching preview</div>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{duration} min</span>
                    <span style={styles.summaryLabel}>Duration</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>
                      {format === "virtual" ? "Virtual" : `${selectedLocations.length} location${selectedLocations.length !== 1 ? "s" : ""}`}
                      {format === "hybrid" ? " + virtual" : ""}
                    </span>
                    <span style={styles.summaryLabel}>Venue</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{matchCount}</span>
                    <span style={styles.summaryLabel}>Viable options</span>
                  </div>
                  {eventType === "single" && availSets.length > 1 && (
                    <div style={styles.summaryItem}>
                      <span style={styles.summaryValue}>{availSets.length}</span>
                      <span style={styles.summaryLabel}>Avail. sets</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.navRow}>
          {step > 0 && <button onClick={() => setStep(step - 1)} style={styles.backBtn}>Back</button>}
          <div style={{ flex: 1 }} />
          {step < 3 ? (
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
  durationGrid: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 },
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
  eventTypeRow: { display: "flex", gap: 10, marginBottom: 20 },
  eventTypeCard: { flex: 1, display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 14px", borderRadius: 12, border: "1.5px solid #e0e5eb", background: "#fafbfc", cursor: "pointer", transition: "all 0.2s", textAlign: "left", fontFamily: "inherit" },
  eventTypeCardActive: { borderColor: "#2e86c1", background: "#eaf4fb" },
  eventTypeRadio: { width: 18, height: 18, borderRadius: "50%", border: "2px solid #ccd3dc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.2s" },
  eventTypeRadioActive: { borderColor: "#2e86c1" },
  eventTypeRadioDot: { width: 8, height: 8, borderRadius: "50%", background: "#2e86c1" },
  eventTypeLabel: { fontSize: 13, fontWeight: 600, color: "#4a5568", marginBottom: 2 },
  eventTypeLabelActive: { color: "#1a5276" },
  eventTypeDesc: { fontSize: 11, color: "#9aa5b4" },
  scheduleDivider: { height: 1, background: "#eef1f5", margin: "0 0 20px" },
  locationList: { display: "flex", flexDirection: "column", gap: 12 },
  locationCard: { display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", borderRadius: 14, border: "1.5px solid #e8ecf0", background: "#fafbfc", cursor: "pointer", transition: "all 0.2s", textAlign: "left", fontFamily: "inherit" },
  locationCardSelected: { borderColor: "#2e86c1", background: "#eaf4fb" },
  locationCheck: { paddingTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: "2px solid #ccd3dc", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s" },
  checkboxChecked: { borderColor: "#2e86c1", background: "#2e86c1" },
  locationName: { fontSize: 14, fontWeight: 600, color: "#1a2332", marginBottom: 2 },
  locationAddr: { fontSize: 13, color: "#7a8a9a", marginBottom: 6 },
  locationAvail: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#43a047", fontWeight: 500 },
  availDot: { width: 7, height: 7, borderRadius: "50%", background: "#43a047" },
  virtualNote: { display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "#f0f6ff", borderRadius: 12, fontSize: 13, color: "#3a6fa0", lineHeight: 1.5 },
  setCard: { borderRadius: 14, border: "1.5px solid #e0e5eb", marginBottom: 16, overflow: "hidden" },
  setHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" },
  setHeaderLeft: { display: "flex", alignItems: "center", gap: 10 },
  setDot: { width: 10, height: 10, borderRadius: "50%" },
  setTitle: { fontSize: 13, fontWeight: 700, color: "#1a2332" },
  setDateCount: { fontSize: 12, color: "#7a8a9a", fontWeight: 500 },
  setRemoveBtn: { padding: "6px 8px", borderRadius: 8, border: "none", background: "transparent", color: "#b0bac5", cursor: "pointer", display: "flex", alignItems: "center", transition: "color 0.2s" },
  setSection: { padding: "14px 16px" },
  setSectionLabel: { fontSize: 12, fontWeight: 600, color: "#6a7585", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 },
  dateCell: { display: "flex", flexDirection: "column", alignItems: "center", padding: "7px 3px", borderRadius: 8, border: "1.5px solid #e8ecf0", background: "#fafbfc", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", gap: 1 },
  dateCellSelected: { color: "#fff" },
  dateCellWeekend: { background: "#f5f5f5", borderColor: "#eaeaea" },
  dateDayName: { fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.7 },
  dateNumber: { fontSize: 11, fontWeight: 600 },
  timeRange: { display: "flex", alignItems: "flex-end", gap: 12 },
  timeField: { flex: 1 },
  timeDash: { paddingBottom: 12, color: "#b0bac5", fontWeight: 500 },
  selectWrap: { position: "relative" },
  select: { width: "100%", padding: "10px 36px 10px 14px", borderRadius: 10, border: "1.5px solid #e0e5eb", fontSize: 14, fontWeight: 500, color: "#1a2332", background: "#fafbfc", appearance: "none", outline: "none", fontFamily: "inherit", cursor: "pointer" },
  selectArrow: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9aa5b4", pointerEvents: "none" },
  addSetBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 20px", borderRadius: 12, border: "2px dashed #d0d8e0", background: "transparent", fontSize: 14, fontWeight: 600, color: "#6a7585", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", marginBottom: 16 },
  setsSummary: { display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#f5f7fa", borderRadius: 10, fontSize: 13, color: "#5a6a7a", lineHeight: 1.4 },
  cadenceSection: { display: "flex", flexDirection: "column", gap: 20 },
  fieldGroup: {},
  cadenceOptions: { display: "flex", flexWrap: "wrap", gap: 8 },
  cadenceChip: { padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e0e5eb", background: "#fafbfc", fontSize: 13, fontWeight: 500, color: "#4a5568", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  cadenceChipActive: { borderColor: "#2e86c1", background: "#eaf4fb", color: "#1a5276", fontWeight: 600 },
  dayRow: { display: "flex", gap: 6 },
  dayChip: { width: 44, height: 44, borderRadius: 10, border: "1.5px solid #e0e5eb", background: "#fafbfc", fontSize: 12, fontWeight: 600, color: "#4a5568", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  dayChipActive: { borderColor: "#2e86c1", background: "#2e86c1", color: "#fff" },
  limitedRow: { display: "flex", gap: 20 },
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
};
