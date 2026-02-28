import { useState, useEffect, useRef, useCallback } from "react";
import { COLORS, GRADIENTS, FONTS } from "../../shared/styles";

// ── Mock Gathering Data ─────────────────────────────────────
const GATHERING = {
  title: "Q1 Community Planning Session",
  hostName: "Sarah Chen",
  description:
    "Quarterly planning session to align on community priorities and resource allocation for Q2.",
  duration: 120,
  format: "In-person",
  quorum: 5,
  capacity: 15,
  overflow: true,
  totalInvited: 12,
};

const LOCATIONS = [
  { id: "loc1", name: "Community Center — Room A", address: "142 Main St", capacity: 40 },
  { id: "loc2", name: "Downtown Library — Meeting Room 3", address: "88 Elm Ave", capacity: 30 },
];

const TIMESLOTS = [
  {
    id: "ts-1",
    date: "2026-03-04",
    dateLabel: "Wed, Mar 4",
    timeStart: "9:00 AM",
    timeEnd: "11:00 AM",
    locations: LOCATIONS,
  },
  {
    id: "ts-2",
    date: "2026-03-05",
    dateLabel: "Thu, Mar 5",
    timeStart: "9:00 AM",
    timeEnd: "11:00 AM",
    locations: LOCATIONS,
  },
  {
    id: "ts-3",
    date: "2026-03-09",
    dateLabel: "Mon, Mar 9",
    timeStart: "2:00 PM",
    timeEnd: "4:00 PM",
    locations: LOCATIONS,
  },
];

// ── Mock Invitees (12 people with pre-set rankings) ─────────
// Rankings designed so ts-1 reaches quorum (5 first-choice) at response #7
const INVITEES = [
  { name: "Alex Rivera", initials: "AR", rankings: ["ts-1", "ts-3"] },
  { name: "Jordan Lee", initials: "JL", rankings: ["ts-3", "ts-2"] },
  { name: "Morgan Chen", initials: "MC", rankings: ["ts-1", "ts-2"] },
  { name: "Casey Wright", initials: "CW", rankings: ["ts-2", "ts-3"] },
  { name: "Taylor Kim", initials: "TK", rankings: ["ts-3", "ts-1"] },
  { name: "Sam Patel", initials: "SP", rankings: ["ts-1", "ts-2"] },
  { name: "Riley Johnson", initials: "RJ", rankings: ["ts-2", "ts-1", "ts-3"] },
  { name: "Jamie Torres", initials: "JT", rankings: ["ts-1", "ts-3"] },
  { name: "Drew Mitchell", initials: "DM", rankings: ["ts-3", "ts-2", "ts-1"] },
  { name: "Avery Collins", initials: "AC", rankings: ["ts-1", "ts-2", "ts-3"] },
  { name: "Quinn Douglas", initials: "QD", rankings: ["ts-3", "ts-2", "ts-1"] },
  { name: "Blake Thompson", initials: "BT", rankings: ["ts-2", "ts-3", "ts-1"] },
];

// Colors for initials avatars
const AVATAR_COLORS = [
  "#4285f4", "#ea4335", "#fbbc04", "#34a853", "#ff6d01",
  "#46bdc6", "#7baaf7", "#e07c7e", "#f0b849", "#57bb8a",
  "#ff8a65", "#9575cd",
];

// ── SVG Icons ───────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M5 3.5L14 9L5 14.5V3.5Z" fill="currentColor" />
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="4" y="3" width="3.5" height="12" rx="1" fill="currentColor" />
    <rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="currentColor" />
  </svg>
);

const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 2.5V6.5H6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 10A5 5 0 1 0 4.5 5L2.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="9" stroke="#1e7e34" strokeWidth="2" fill="#e8f5e9" />
    <path d="M6 10.5L8.5 13L14 7.5" stroke="#1e7e34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4.5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5S12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M1.5 14C1.5 11.5 3.5 9.5 6 9.5S10.5 11.5 10.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <circle cx="11" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M12 9.5C13.5 10 14.5 11.5 14.5 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1L8.8 5.1L13.2 5.5L9.9 8.4L10.8 12.7L7 10.5L3.2 12.7L4.1 8.4L0.8 5.5L5.2 5.1L7 1Z" fill="currentColor" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Helper Functions ────────────────────────────────────────

function getFirstChoiceVotes(responded) {
  const counts = { "ts-1": 0, "ts-2": 0, "ts-3": 0 };
  for (const inv of responded) {
    if (inv.rankings.length > 0) {
      counts[inv.rankings[0]]++;
    }
  }
  return counts;
}

function getAllVotes(responded) {
  const counts = { "ts-1": 0, "ts-2": 0, "ts-3": 0 };
  for (const inv of responded) {
    for (const ts of inv.rankings) {
      counts[ts]++;
    }
  }
  return counts;
}

function getWinningSlot(responded) {
  const votes = getFirstChoiceVotes(responded);
  let best = null;
  let bestCount = 0;
  for (const [tsId, count] of Object.entries(votes)) {
    if (count >= GATHERING.quorum && count > bestCount) {
      best = tsId;
      bestCount = count;
    }
  }
  return best;
}

function getAttendeesForSlot(responded, tsId) {
  return responded.filter((inv) => inv.rankings.includes(tsId));
}

// ── Phase Indicator ─────────────────────────────────────────

const PHASE_LABELS = ["Overview", "Live Responses", "Results"];

function PhaseIndicator({ phase }) {
  return (
    <div style={styles.phaseIndicator}>
      {PHASE_LABELS.map((label, i) => (
        <div key={i} style={styles.phaseStep}>
          <div
            style={{
              ...styles.phaseDot,
              background: i <= phase ? COLORS.blueLight : "#d0d5dd",
              color: i <= phase ? "#fff" : "#7a8a9a",
            }}
          >
            {i < phase ? "✓" : i + 1}
          </div>
          <span
            style={{
              ...styles.phaseLabel,
              color: i === phase ? COLORS.text : COLORS.textMuted,
              fontWeight: i === phase ? 600 : 400,
            }}
          >
            {label}
          </span>
          {i < PHASE_LABELS.length - 1 && <div style={styles.phaseConnector} />}
        </div>
      ))}
    </div>
  );
}

// ── Phase 0: Gathering Overview ─────────────────────────────

function GatheringOverview({ onStart }) {
  return (
    <div style={styles.phaseContainer}>
      {/* Event Header */}
      <div style={styles.eventCard}>
        <div style={styles.eventHeader}>
          <div style={styles.eventTitleRow}>
            <h2 style={styles.eventTitle}>{GATHERING.title}</h2>
            <span style={styles.formatBadge}>{GATHERING.format}</span>
          </div>
          <p style={styles.eventHost}>Hosted by {GATHERING.hostName}</p>
          <p style={styles.eventDesc}>{GATHERING.description}</p>
        </div>

        <div style={styles.eventMeta}>
          <div style={styles.metaItem}>
            <ClockIcon />
            <span>{GATHERING.duration} minutes</span>
          </div>
          <div style={styles.metaItem}>
            <UsersIcon />
            <span>
              Quorum: {GATHERING.quorum} of {GATHERING.totalInvited} ·
              Capacity: {GATHERING.capacity}
            </span>
          </div>
          {GATHERING.overflow && (
            <div style={styles.metaItem}>
              <span style={styles.overflowBadge}>Overflow enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeslots */}
      <h3 style={styles.sectionTitle}>Available Timeslots</h3>
      <div style={styles.timeslotGrid}>
        {TIMESLOTS.map((ts) => (
          <div key={ts.id} style={styles.timeslotCard}>
            <div style={styles.tsDateBadge}>{ts.dateLabel}</div>
            <div style={styles.tsTime}>
              {ts.timeStart} – {ts.timeEnd}
            </div>
            <div style={styles.tsLocations}>
              {ts.locations.map((loc) => (
                <div key={loc.id} style={styles.tsLocation}>
                  <MapPinIcon />
                  <span style={styles.tsLocationName}>{loc.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Invitee summary */}
      <div style={styles.inviteeSummary}>
        <UsersIcon />
        <span>
          {GATHERING.totalInvited} invitees will be asked to rank their top
          preferences
        </span>
      </div>

      {/* Start button */}
      <button style={styles.startButton} onClick={onStart}>
        <PlayIcon />
        <span>Start Simulation</span>
      </button>
    </div>
  );
}

// ── Phase 1: Live Response Tracker ──────────────────────────

function ProgressBar({ tsId, label, count, quorum, quorumReached, isWinner }) {
  const pct = Math.min((count / GATHERING.totalInvited) * 100, 100);
  const quorumPct = (quorum / GATHERING.totalInvited) * 100;
  const reachedQuorum = count >= quorum;

  return (
    <div style={styles.progressBarContainer}>
      <div style={styles.progressBarHeader}>
        <span style={styles.progressBarLabel}>{label}</span>
        <span
          style={{
            ...styles.progressBarCount,
            color: reachedQuorum ? "#1e7e34" : COLORS.textMuted,
            fontWeight: reachedQuorum ? 700 : 500,
          }}
        >
          {count} vote{count !== 1 ? "s" : ""}
          {reachedQuorum && " ✓"}
        </span>
      </div>
      <div style={styles.progressBarTrack}>
        <div
          style={{
            ...styles.progressBarFill,
            width: `${pct}%`,
            background: reachedQuorum
              ? "linear-gradient(90deg, #43a047, #66bb6a)"
              : `linear-gradient(90deg, ${COLORS.blueLight}, #5dade2)`,
            boxShadow: reachedQuorum ? "0 0 12px rgba(67,160,71,0.4)" : "none",
          }}
        />
        {/* Quorum threshold line */}
        <div
          style={{
            ...styles.quorumLine,
            left: `${quorumPct}%`,
          }}
        >
          <div style={styles.quorumLineBar} />
          <span style={styles.quorumLineBadge}>Q={quorum}</span>
        </div>
      </div>
    </div>
  );
}

function InviteeRow({ invitee, index, isNew }) {
  const firstChoice = invitee.rankings[0];
  const ts = TIMESLOTS.find((t) => t.id === firstChoice);

  return (
    <div
      style={{
        ...styles.inviteeRow,
        opacity: isNew ? 1 : 1,
        animation: isNew ? "slideIn 0.4s ease-out" : "none",
      }}
    >
      <div
        style={{
          ...styles.avatar,
          background: AVATAR_COLORS[index % AVATAR_COLORS.length],
        }}
      >
        {invitee.initials}
      </div>
      <div style={styles.inviteeInfo}>
        <span style={styles.inviteeName}>{invitee.name}</span>
        <span style={styles.inviteeChoice}>
          <StarIcon /> #{1} — {ts ? ts.dateLabel : ""},{" "}
          {ts ? ts.timeStart : ""}
        </span>
      </div>
      <div style={styles.rankingPills}>
        {invitee.rankings.map((r, i) => (
          <span
            key={r}
            style={{
              ...styles.rankPill,
              background: i === 0 ? "#e3f2fd" : "#f5f5f5",
              color: i === 0 ? COLORS.blueLight : COLORS.textMuted,
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {r.replace("ts-", "#")}
          </span>
        ))}
      </div>
    </div>
  );
}

function LiveTracker({ responded, speed, paused, onSpeedChange, onPauseToggle, onReset, quorumReachedAt, onViewResults, allDone }) {
  const votes = getFirstChoiceVotes(responded);
  const quorumJustReached =
    quorumReachedAt !== null && responded.length === quorumReachedAt;

  return (
    <div style={styles.phaseContainer}>
      {/* Controls bar */}
      <div style={styles.controlsBar}>
        <div style={styles.controlsLeft}>
          <button
            style={styles.controlButton}
            onClick={onPauseToggle}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button style={styles.controlButton} onClick={onReset} title="Reset">
            <ResetIcon />
          </button>
        </div>
        <div style={styles.speedControls}>
          {[1, 2, "instant"].map((s) => (
            <button
              key={s}
              style={{
                ...styles.speedButton,
                background: speed === s ? COLORS.blueLight : "transparent",
                color: speed === s ? "#fff" : COLORS.textMuted,
              }}
              onClick={() => onSpeedChange(s)}
            >
              {s === "instant" ? "⚡" : `${s}x`}
            </button>
          ))}
        </div>
        <div style={styles.responseCounter}>
          {responded.length} of {GATHERING.totalInvited} responded
        </div>
      </div>

      {/* Progress bars */}
      <div style={styles.progressSection}>
        {TIMESLOTS.map((ts) => (
          <ProgressBar
            key={ts.id}
            tsId={ts.id}
            label={`${ts.dateLabel}, ${ts.timeStart}`}
            count={votes[ts.id] || 0}
            quorum={GATHERING.quorum}
            quorumReached={quorumReachedAt !== null}
            isWinner={getWinningSlot(responded) === ts.id}
          />
        ))}
      </div>

      {/* Quorum celebration */}
      {quorumJustReached && (
        <div style={styles.quorumCelebration}>
          <div style={styles.celebrationInner}>
            <CheckCircleIcon size={28} />
            <div>
              <div style={styles.celebrationTitle}>Quorum Reached!</div>
              <div style={styles.celebrationSub}>
                Timeslot #1 has {GATHERING.quorum} first-choice votes —
                gathering can be confirmed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitee response feed */}
      <h3 style={styles.sectionTitle}>Response Feed</h3>
      <div style={styles.responseFeed}>
        {responded.length === 0 && (
          <div style={styles.emptyFeed}>Waiting for responses...</div>
        )}
        {[...responded].reverse().map((inv, i) => (
          <InviteeRow
            key={inv.name}
            invitee={inv}
            index={INVITEES.indexOf(inv)}
            isNew={i === 0}
          />
        ))}
      </div>

      {/* View Results button */}
      {allDone && (
        <button style={styles.startButton} onClick={onViewResults}>
          <span>View Results</span>
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}

// ── Phase 2: Results Dashboard ──────────────────────────────

function ResultsDashboard({ responded }) {
  const winningTsId = getWinningSlot(responded) || "ts-1";
  const winningTs = TIMESLOTS.find((t) => t.id === winningTsId);
  const attendees = getAttendeesForSlot(responded, winningTsId);
  const votes = getFirstChoiceVotes(responded);
  const allVotes = getAllVotes(responded);
  const firstChoiceCount = votes[winningTsId];

  // Determine if overflow is needed
  const needsOverflow = attendees.length > GATHERING.capacity;
  const confirmedAttendees = needsOverflow
    ? attendees.slice(0, GATHERING.capacity)
    : attendees;
  const waitlisted = needsOverflow
    ? attendees.slice(GATHERING.capacity)
    : [];

  // Find who's NOT attending this slot
  const notAttending = responded.filter(
    (inv) => !inv.rankings.includes(winningTsId)
  );

  return (
    <div style={styles.phaseContainer}>
      {/* Confirmed gathering card */}
      <div style={styles.confirmationCard}>
        <div style={styles.confirmationHeader}>
          <CheckCircleIcon size={32} />
          <h2 style={styles.confirmationTitle}>Gathering Confirmed!</h2>
        </div>
        <div style={styles.confirmedDetails}>
          <div style={styles.confirmedSlot}>
            <div style={styles.confirmedDateBig}>{winningTs.dateLabel}</div>
            <div style={styles.confirmedTimeBig}>
              {winningTs.timeStart} – {winningTs.timeEnd}
            </div>
          </div>
          <div style={styles.confirmedLocation}>
            <MapPinIcon />
            <span>{winningTs.locations[0].name}</span>
          </div>
          <div style={styles.confirmedLocation}>
            <span style={{ marginLeft: 20, color: COLORS.textMuted, fontSize: 13 }}>
              {winningTs.locations[0].address}
            </span>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {responded.length}/{GATHERING.totalInvited}
          </div>
          <div style={styles.statLabel}>Response Rate</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{firstChoiceCount}</div>
          <div style={styles.statLabel}>First-choice votes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{confirmedAttendees.length}</div>
          <div style={styles.statLabel}>Confirmed Attending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>#{7}</div>
          <div style={styles.statLabel}>Response at Quorum</div>
        </div>
      </div>

      {/* Vote breakdown */}
      <h3 style={styles.sectionTitle}>Vote Breakdown</h3>
      <div style={styles.voteBreakdown}>
        {TIMESLOTS.map((ts) => {
          const isWinner = ts.id === winningTsId;
          return (
            <div
              key={ts.id}
              style={{
                ...styles.voteRow,
                background: isWinner ? "#e8f5e9" : "#fff",
                borderColor: isWinner ? "#43a047" : COLORS.borderLight,
              }}
            >
              <div style={styles.voteRowLeft}>
                {isWinner && (
                  <span style={styles.winnerBadge}>Winner</span>
                )}
                <span style={styles.voteRowLabel}>
                  {ts.dateLabel}, {ts.timeStart}
                </span>
              </div>
              <div style={styles.voteRowRight}>
                <span style={styles.voteFirst}>
                  {votes[ts.id]} first-choice
                </span>
                <span style={styles.voteTotal}>
                  {allVotes[ts.id]} total
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendee list */}
      <h3 style={styles.sectionTitle}>
        Confirmed Attendees ({confirmedAttendees.length})
      </h3>
      <div style={styles.attendeeGrid}>
        {confirmedAttendees.map((inv) => {
          const idx = INVITEES.indexOf(inv);
          const rankPos = inv.rankings.indexOf(winningTsId) + 1;
          return (
            <div key={inv.name} style={styles.attendeeCard}>
              <div
                style={{
                  ...styles.avatar,
                  background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                }}
              >
                {inv.initials}
              </div>
              <div style={styles.attendeeInfo}>
                <span style={styles.attendeeName}>{inv.name}</span>
                <span style={styles.attendeeRank}>
                  Ranked #{rankPos}
                </span>
              </div>
              <CheckCircleIcon size={18} />
            </div>
          );
        })}
      </div>

      {/* Not attending */}
      {notAttending.length > 0 && (
        <>
          <h3 style={{ ...styles.sectionTitle, color: COLORS.textMuted }}>
            Not Attending This Slot ({notAttending.length})
          </h3>
          <div style={styles.attendeeGrid}>
            {notAttending.map((inv) => {
              const idx = INVITEES.indexOf(inv);
              return (
                <div
                  key={inv.name}
                  style={{ ...styles.attendeeCard, opacity: 0.6 }}
                >
                  <div
                    style={{
                      ...styles.avatar,
                      background: "#ccc",
                    }}
                  >
                    {inv.initials}
                  </div>
                  <div style={styles.attendeeInfo}>
                    <span style={styles.attendeeName}>{inv.name}</span>
                    <span style={styles.attendeeRank}>
                      Preferred: {inv.rankings.map((r) => r.replace("ts-", "#")).join(", ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Overflow status */}
      <div style={styles.overflowCard}>
        <h4 style={styles.overflowTitle}>Overflow Status</h4>
        {needsOverflow ? (
          <p style={styles.overflowText}>
            {waitlisted.length} invitees are on the waitlist. A second
            gathering will be offered at the next-best slot.
          </p>
        ) : (
          <p style={styles.overflowText}>
            All {confirmedAttendees.length} attendees fit within the
            capacity of {GATHERING.capacity}. No overflow session needed.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function S01Simulation({ onBack }) {
  const [phase, setPhase] = useState(0);
  const [responded, setResponded] = useState([]);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [quorumReachedAt, setQuorumReachedAt] = useState(null);

  const timerRef = useRef(null);
  const nextIndexRef = useRef(0);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);

  // Keep refs in sync
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const allDone = responded.length === INVITEES.length;

  const getDelay = useCallback(() => {
    if (speedRef.current === "instant") return 50;
    const base = 800 + Math.random() * 700;
    return base / (speedRef.current === 2 ? 2 : 1);
  }, []);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (pausedRef.current) {
        // Poll until unpaused
        timerRef.current = setTimeout(() => scheduleNext(), 100);
        return;
      }

      const idx = nextIndexRef.current;
      if (idx >= INVITEES.length) return;

      const invitee = INVITEES[idx];
      nextIndexRef.current = idx + 1;

      setResponded((prev) => {
        const next = [...prev, invitee];
        // Check quorum
        const votes = getFirstChoiceVotes(next);
        const reached = Object.values(votes).some((v) => v >= GATHERING.quorum);
        if (reached && !quorumReachedAt) {
          setQuorumReachedAt(next.length);
        }
        return next;
      });

      if (idx + 1 < INVITEES.length) {
        scheduleNext();
      }
    }, getDelay());
  }, [getDelay, quorumReachedAt]);

  const startSimulation = useCallback(() => {
    setPhase(1);
    setResponded([]);
    setQuorumReachedAt(null);
    nextIndexRef.current = 0;
    setPaused(false);
    scheduleNext();
  }, [scheduleNext]);

  const resetSimulation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResponded([]);
    setQuorumReachedAt(null);
    nextIndexRef.current = 0;
    setPaused(false);
    setTimeout(() => scheduleNext(), 300);
  }, [scheduleNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* CSS keyframes for animation */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(67,160,71,0.3); }
          50% { box-shadow: 0 0 20px 8px rgba(67,160,71,0.2); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.headerTitle}>S-01: Scenario Simulation</h1>
          <span style={styles.headerSub}>
            Single Host · Single Gathering · Small Group
          </span>
        </div>
        <PhaseIndicator phase={phase} />
      </div>

      {/* Phase content */}
      {phase === 0 && <GatheringOverview onStart={startSimulation} />}
      {phase === 1 && (
        <LiveTracker
          responded={responded}
          speed={speed}
          paused={paused}
          onSpeedChange={setSpeed}
          onPauseToggle={() => setPaused((p) => !p)}
          onReset={resetSimulation}
          quorumReachedAt={quorumReachedAt}
          onViewResults={() => setPhase(2)}
          allDone={allDone}
        />
      )}
      {phase === 2 && <ResultsDashboard responded={responded} />}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = {
  container: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "24px 16px 60px",
    fontFamily: FONTS.base,
    color: COLORS.text,
  },

  // Header
  header: {
    marginBottom: 28,
  },
  headerTop: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: 500,
    marginTop: 4,
    display: "block",
  },

  // Phase indicator
  phaseIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 0,
  },
  phaseStep: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  phaseDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  phaseLabel: {
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  phaseConnector: {
    width: 32,
    height: 2,
    background: "#d0d5dd",
    margin: "0 6px",
    flexShrink: 0,
  },

  // Phase content
  phaseContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  // Event card
  eventCard: {
    background: "#fff",
    border: `1.5px solid ${COLORS.borderLight}`,
    borderRadius: 14,
    overflow: "hidden",
  },
  eventHeader: {
    padding: "20px 20px 16px",
  },
  eventTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: COLORS.text,
  },
  formatBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 6,
    background: "#e3f2fd",
    color: COLORS.blueLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventHost: {
    fontSize: 14,
    color: COLORS.blueLight,
    fontWeight: 500,
    margin: "2px 0 8px",
  },
  eventDesc: {
    fontSize: 14,
    color: COLORS.textBody,
    lineHeight: 1.5,
    margin: 0,
  },
  eventMeta: {
    padding: "12px 20px",
    background: "#fafbfc",
    borderTop: `1px solid ${COLORS.borderLight}`,
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: COLORS.textBody,
  },
  overflowBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#fff3e0",
    color: "#e65100",
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: "8px 0 4px",
    color: COLORS.text,
  },

  // Timeslot grid
  timeslotGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  timeslotCard: {
    background: "#fff",
    border: `1.5px solid ${COLORS.borderLight}`,
    borderRadius: 12,
    padding: 16,
  },
  tsDateBadge: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.blueLight,
    marginBottom: 4,
  },
  tsTime: {
    fontSize: 15,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: 10,
  },
  tsLocations: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  tsLocation: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: COLORS.textBody,
  },
  tsLocationName: {
    fontSize: 13,
  },

  // Invitee summary
  inviteeSummary: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    background: "#f0f4f8",
    borderRadius: 10,
    fontSize: 14,
    color: COLORS.textBody,
  },

  // Start / CTA button
  startButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "14px 24px",
    background: GRADIENTS.primaryBtn,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.base,
    marginTop: 8,
  },

  // Controls bar
  controlsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "#fff",
    border: `1.5px solid ${COLORS.borderLight}`,
    borderRadius: 12,
    gap: 12,
  },
  controlsLeft: {
    display: "flex",
    gap: 6,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1.5px solid ${COLORS.borderLight}`,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: COLORS.textBody,
    padding: 0,
  },
  speedControls: {
    display: "flex",
    gap: 4,
  },
  speedButton: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.base,
    transition: "all 0.15s",
  },
  responseCounter: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textBody,
    whiteSpace: "nowrap",
  },

  // Progress bars
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  progressBarContainer: {
    background: "#fff",
    border: `1.5px solid ${COLORS.borderLight}`,
    borderRadius: 12,
    padding: "12px 16px",
  },
  progressBarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBarLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
  },
  progressBarCount: {
    fontSize: 13,
  },
  progressBarTrack: {
    height: 24,
    background: "#f0f2f5",
    borderRadius: 12,
    position: "relative",
    overflow: "visible",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 12,
    transition: "width 0.5s ease-out, background 0.3s",
    minWidth: 0,
  },
  quorumLine: {
    position: "absolute",
    top: -4,
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 1,
  },
  quorumLineBar: {
    width: 2,
    height: 32,
    background: "#e65100",
    borderRadius: 1,
    opacity: 0.6,
  },
  quorumLineBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "#e65100",
    marginTop: 2,
    whiteSpace: "nowrap",
  },

  // Quorum celebration
  quorumCelebration: {
    background: "#e8f5e9",
    border: "2px solid #43a047",
    borderRadius: 14,
    padding: 16,
    animation: "pulseGlow 2s ease-in-out 3",
  },
  celebrationInner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  celebrationTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e7e34",
  },
  celebrationSub: {
    fontSize: 13,
    color: "#2e7d32",
    marginTop: 2,
  },

  // Response feed
  responseFeed: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxHeight: 360,
    overflowY: "auto",
    padding: "4px 0",
  },
  emptyFeed: {
    textAlign: "center",
    padding: 32,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  inviteeRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "#fff",
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  inviteeInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  inviteeName: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
  },
  inviteeChoice: {
    fontSize: 12,
    color: COLORS.textMuted,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  rankingPills: {
    display: "flex",
    gap: 4,
  },
  rankPill: {
    fontSize: 11,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 6,
  },

  // Confirmation card
  confirmationCard: {
    background: "#e8f5e9",
    border: "2px solid #43a047",
    borderRadius: 16,
    padding: 24,
  },
  confirmationHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1e7e34",
    margin: 0,
  },
  confirmedDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  confirmedSlot: {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
  },
  confirmedDateBig: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.text,
  },
  confirmedTimeBig: {
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.textBody,
  },
  confirmedLocation: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: COLORS.textBody,
  },

  // Stats grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },
  statCard: {
    background: "#fff",
    border: `1.5px solid ${COLORS.borderLight}`,
    borderRadius: 12,
    padding: "14px 10px",
    textAlign: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.blueLight,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: 500,
    marginTop: 4,
  },

  // Vote breakdown
  voteBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  voteRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    border: "1.5px solid",
    borderRadius: 10,
  },
  voteRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  winnerBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 6,
    background: "#43a047",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  voteRowLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
  },
  voteRowRight: {
    display: "flex",
    gap: 12,
  },
  voteFirst: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.blueLight,
  },
  voteTotal: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // Attendee grid
  attendeeGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  attendeeCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "#fff",
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: 10,
  },
  attendeeInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
  },
  attendeeRank: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Overflow card
  overflowCard: {
    background: "#fff3e0",
    border: "1.5px solid #ffcc80",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  overflowTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e65100",
    margin: "0 0 6px",
  },
  overflowText: {
    fontSize: 13,
    color: "#bf360c",
    lineHeight: 1.5,
    margin: 0,
  },
};
