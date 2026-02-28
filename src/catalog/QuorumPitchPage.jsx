import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, GRADIENTS, FONTS } from "../shared/styles";
import { QuorumCheckIcon, LocationMatchIcon, OverflowIcon, CalendarClockIcon } from "../shared/icons";
import EXPERIENCES from "../experiences/manifest";

// ── Icons ───────────────────────────────────────────────────

const BackArrow = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StepIcon = ({ number, filled }) => (
  <div style={{
    width: 32, height: 32, borderRadius: 16,
    background: filled ? COLORS.blueLight : "rgba(255,255,255,0.1)",
    color: filled ? "#fff" : "rgba(255,255,255,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  }}>
    {number}
  </div>
);

// ── Data ────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: QuorumCheckIcon,
    title: "Quorum-based confirmation",
    desc: "Events lock in when enough people say yes, not when everyone responds. Set your threshold and go.",
  },
  {
    icon: LocationMatchIcon,
    title: "Locations as participants",
    desc: "Venues have availability too. Quorum matches people, times, and places together automatically.",
  },
  {
    icon: OverflowIcon,
    title: "Overflow gatherings",
    desc: "Too much demand? Additional sessions spin up automatically from remaining slots.",
  },
];

const STEPS = [
  { num: 1, label: "Create", desc: "Host describes the gathering, sets quorum and capacity thresholds" },
  { num: 2, label: "Schedule", desc: "Host picks potential dates, times, and locations" },
  { num: 3, label: "Match", desc: "System cross-references to find viable options across all three dimensions" },
  { num: 4, label: "Invite", desc: "Invitees rank their top preferences with minimal friction" },
  { num: 5, label: "Confirm", desc: "Quorum met — host reviews results and locks in the gathering" },
  { num: 6, label: "Overflow", desc: "Excess demand? New sessions offered from remaining availability" },
];

const FUTURE_SCENARIOS = [
  { title: "Multi-Timezone Coordination", desc: "Co-hosts across time zones align 30+ people" },
  { title: "Recurring Series", desc: "Monthly gatherings that adapt as schedules shift" },
];

// ── Helpers ─────────────────────────────────────────────────

const quorumExperiences = EXPERIENCES.filter((e) => e.app === "quorum");
const scenarioExps = quorumExperiences.filter((e) => e.category === "scenario");
const hostDemos = quorumExperiences.filter((e) => e.persona === "host");
const inviteeDemos = quorumExperiences.filter((e) => e.persona === "invitee");

// ── Components ──────────────────────────────────────────────

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  return (
    <div style={styles.featureCard}>
      <div style={styles.featureIconWrap}>
        <Icon />
      </div>
      <h3 style={styles.featureTitle}>{feature.title}</h3>
      <p style={styles.featureDesc}>{feature.desc}</p>
    </div>
  );
}

function DemoCard({ exp, onClick }) {
  const [hovered, setHovered] = useState(false);
  const Icon = exp.icon;
  return (
    <button
      onClick={() => onClick(exp.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.demoCard,
        ...(hovered ? styles.demoCardHover : {}),
      }}
    >
      <div style={styles.demoIconWrap}>
        <Icon />
      </div>
      <div style={styles.demoInfo}>
        <h4 style={styles.demoTitle}>{exp.pitchTitle || exp.title}</h4>
        <p style={styles.demoDesc}>{exp.pitchDescription || exp.description}</p>
      </div>
    </button>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function QuorumPitchPage() {
  const navigate = useNavigate();

  const handleExpClick = (expId) => {
    navigate(`/app/quorum/${expId}`);
  };

  return (
    <div style={styles.container}>
      {/* Back bar */}
      <div style={styles.backBar}>
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          <BackArrow />
          <span>Back to Platopia</span>
        </button>
      </div>

      {/* ─── A. Hero ─── */}
      <section style={styles.hero}>
        <div style={styles.heroIconWrap}>
          <CalendarClockIcon />
        </div>
        <h1 style={styles.heroName}>Quorum</h1>
        <p style={styles.heroTagline}>Gathering potential.</p>
        <p style={styles.heroSubtitle}>
          Smart scheduling that brings groups together — effortlessly.
        </p>
      </section>

      {/* ─── B. The Problem ─── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionHeading}>
            Organizing group events is broken
          </h2>
          <div style={styles.problemList}>
            <div style={styles.problemItem}>
              <span style={styles.problemBullet}>1</span>
              <p style={styles.problemText}>
                Scheduling polls create endless back-and-forth with no resolution
              </p>
            </div>
            <div style={styles.problemItem}>
              <span style={styles.problemBullet}>2</span>
              <p style={styles.problemText}>
                No tool considers venue availability alongside people's schedules
              </p>
            </div>
            <div style={styles.problemItem}>
              <span style={styles.problemBullet}>3</span>
              <p style={styles.problemText}>
                Events die in planning because organizers wait for 100% consensus that never comes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── B2. Our Approach ─── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.approachCard}>
            <h2 style={styles.approachHeading}>
              Simple for everyone, no matter the complexity
            </h2>
            <p style={styles.approachText}>
              Whether it's a quick meetup that fills up on any day, or distributing 200 people from
              multiple time zones into 15 different limited series — virtual, in-person, or hybrid — the
              experience stays frictionless.
            </p>
            <p style={styles.approachText}>
              We require minimum input through intuitive interfaces and abstract the complexity
              through smart code and AI-enabled scheduling.
            </p>
            <div style={styles.approachScale}>
              <div style={styles.scaleEnd}>
                <span style={styles.scaleLabel}>Simple</span>
                <span style={styles.scaleExample}>A quick team meetup</span>
              </div>
              <div style={styles.scaleLine}>
                <div style={styles.scaleArrow} />
              </div>
              <div style={{ ...styles.scaleEnd, textAlign: "right" }}>
                <span style={styles.scaleLabel}>Complex</span>
                <span style={styles.scaleExample}>200 people · 15 series · 5 time zones</span>
              </div>
            </div>
            <p style={styles.approachPunchline}>
              Same effortless experience for hosts and participants at every scale.
            </p>
          </div>
        </div>
      </section>

      {/* ─── C. The Solution ─── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionHeading}>
            Quorum solves this in three ways
          </h2>
          <div style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── D. How It Works ─── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionHeading}>How it works</h2>
          <div style={styles.stepsContainer}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={styles.stepRow}>
                <StepIcon number={step.num} filled={true} />
                {i < STEPS.length - 1 && <div style={styles.stepConnector} />}
                <div style={styles.stepContent}>
                  <span style={styles.stepLabel}>{step.label}</span>
                  <span style={styles.stepDesc}>{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── D2. Where This Is Going ─── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionHeading}>Where this is going</h2>
          <div style={styles.visionCard}>
            <div style={styles.visionRow}>
              <div style={styles.visionIcon}>
                <LocationMatchIcon />
              </div>
              <div style={styles.visionContent}>
                <h3 style={styles.visionTitle}>Automatic space discovery and booking</h3>
                <p style={styles.visionText}>
                  Quorum will discover and book available spaces automatically — starting with
                  public resources like library meeting rooms, where every branch uses different
                  scheduling software. Our agentic AI handles the complexity of navigating each
                  system so the host doesn't have to.
                </p>
              </div>
            </div>
            <div style={styles.visionRow}>
              <div style={styles.visionIcon}>
                <QuorumCheckIcon />
              </div>
              <div style={styles.visionContent}>
                <h3 style={styles.visionTitle}>AI-powered scheduling intelligence</h3>
                <p style={styles.visionText}>
                  As complexity grows — more people, more time zones, more constraints — the
                  scheduling engine gets smarter. AI optimizes slot selection, predicts attendance
                  patterns, and suggests configurations that maximize participation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── E. See It In Action ─── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionHeading}>See it in action</h2>
          <p style={styles.sectionSub}>
            Walk through real scheduling scenarios from start to finish
          </p>

          {/* S-01 hero card */}
          {scenarioExps.map((exp) => (
            <ScenarioHeroCard key={exp.id} exp={exp} onClick={handleExpClick} />
          ))}

          {/* Future scenarios */}
          <div style={styles.futureGrid}>
            {FUTURE_SCENARIOS.map((s) => (
              <div key={s.title} style={styles.futureCard}>
                <h4 style={styles.futureTitle}>{s.title}</h4>
                <p style={styles.futureDesc}>{s.desc}</p>
                <span style={styles.futureBadge}>Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── F. Explore the Product ─── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionHeading}>Explore the product</h2>
          <p style={styles.sectionSub}>
            Hands-on prototypes of key screens
          </p>

          {/* Host demos */}
          <h3 style={styles.personaHeading}>Host Experience</h3>
          <div style={styles.demoList}>
            {hostDemos.map((exp) => (
              <DemoCard key={exp.id} exp={exp} onClick={handleExpClick} />
            ))}
          </div>

          {/* Invitee demos */}
          <h3 style={styles.personaHeading}>Invitee Experience</h3>
          <div style={styles.demoList}>
            {inviteeDemos.map((exp) => (
              <DemoCard key={exp.id} exp={exp} onClick={handleExpClick} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── G. Footer ─── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p style={styles.footerText}>
            Quorum is the first app on <strong style={styles.footerBold}>Platopia</strong> — a platform for organizing group experiences.
          </p>
          <button onClick={() => navigate("/")} style={styles.footerLink}>
            <BackArrow />
            <span>Back to Platopia</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Scenario Hero Card (extracted for clarity) ──────────────

function ScenarioHeroCard({ exp, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(exp.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.scenarioCard,
        ...(hovered ? styles.scenarioCardHover : {}),
      }}
    >
      <div style={styles.scenarioTop}>
        <span style={styles.scenarioBadge}>Interactive simulation</span>
      </div>
      <h3 style={styles.scenarioTitle}>
        {exp.pitchTitle || exp.title}
      </h3>
      <p style={styles.scenarioMeta}>
        1 host · 12 invitees · 3 timeslots · 2 venues
      </p>
      <p style={styles.scenarioDesc}>
        {exp.pitchDescription || exp.description}
      </p>
      <div style={styles.scenarioCta}>
        <span>Walk through this scenario</span>
        <ArrowRight />
      </div>
    </button>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: "100vh",
    background: GRADIENTS.background,
    fontFamily: FONTS.base,
  },

  // Back bar
  backBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    background: "rgba(15, 25, 35, 0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    paddingLeft: 16,
    zIndex: 9999,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONTS.base,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
  },

  // Hero
  hero: {
    paddingTop: 100,
    paddingBottom: 60,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    background: "rgba(46,134,193,0.15)",
    border: "2px solid rgba(46,134,193,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: "scale(2)",
    transformOrigin: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  heroName: {
    fontSize: 48,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 8px",
    letterSpacing: -1.5,
  },
  heroTagline: {
    fontSize: 24,
    fontWeight: 600,
    color: COLORS.blueLight,
    margin: "0 0 12px",
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.5)",
    margin: 0,
    maxWidth: 420,
    lineHeight: 1.6,
  },

  // Sections
  section: {
    padding: "0 16px",
    marginBottom: 48,
  },
  sectionInner: {
    maxWidth: 700,
    margin: "0 auto",
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 8px",
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.45)",
    margin: "0 0 24px",
    lineHeight: 1.5,
  },

  // Problem
  problemList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 20,
  },
  problemItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "16px 20px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  problemBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    background: "rgba(230,81,0,0.15)",
    color: "#ff8a65",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  problemText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.5,
    margin: 0,
  },

  // Approach
  approachCard: {
    background: "rgba(46,134,193,0.06)",
    border: "1.5px solid rgba(46,134,193,0.2)",
    borderRadius: 18,
    padding: "32px 28px",
  },
  approachHeading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 16px",
    letterSpacing: -0.3,
  },
  approachText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.65,
    margin: "0 0 12px",
  },
  approachScale: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    margin: "24px 0 20px",
    padding: "16px 20px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
  },
  scaleEnd: {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  scaleLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.blueLight,
  },
  scaleExample: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  scaleLine: {
    flex: 1,
    height: 2,
    background: "linear-gradient(90deg, rgba(46,134,193,0.2), rgba(46,134,193,0.5), rgba(46,134,193,0.2))",
    margin: "0 16px",
    position: "relative",
  },
  scaleArrow: {
    position: "absolute",
    right: -4,
    top: -4,
    width: 10,
    height: 10,
    borderRight: "2px solid rgba(46,134,193,0.5)",
    borderTop: "2px solid rgba(46,134,193,0.5)",
    transform: "rotate(45deg)",
  },
  approachPunchline: {
    fontSize: 15,
    fontWeight: 600,
    color: COLORS.blueLight,
    margin: 0,
    textAlign: "center",
  },

  // Vision
  visionCard: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 16,
  },
  visionRow: {
    display: "flex",
    gap: 16,
    padding: "20px 22px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
  },
  visionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "rgba(46,134,193,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  visionContent: {
    flex: 1,
  },
  visionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 6px",
  },
  visionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.55,
    margin: 0,
  },

  // Features
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginTop: 20,
  },
  featureCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: "24px 20px",
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "rgba(46,134,193,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 8px",
  },
  featureDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.55,
    margin: 0,
  },

  // Steps
  stepsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    marginTop: 24,
  },
  stepRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    position: "relative",
    paddingBottom: 24,
  },
  stepConnector: {
    position: "absolute",
    left: 15,
    top: 36,
    width: 2,
    height: "calc(100% - 36px)",
    background: "rgba(46,134,193,0.3)",
  },
  stepContent: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingTop: 5,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.blueLight,
  },
  stepDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.5,
  },

  // Scenario hero card
  scenarioCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    padding: "28px 28px 24px",
    background: "rgba(46,134,193,0.08)",
    border: "2px solid rgba(46,134,193,0.25)",
    borderRadius: 18,
    textAlign: "left",
    fontFamily: FONTS.base,
    cursor: "pointer",
    transition: "all 0.25s ease",
    marginBottom: 16,
    boxSizing: "border-box",
  },
  scenarioCardHover: {
    background: "rgba(46,134,193,0.12)",
    borderColor: COLORS.blueLight,
    transform: "translateY(-2px)",
    boxShadow: "0 12px 40px rgba(46,134,193,0.15)",
  },
  scenarioTop: {
    marginBottom: 12,
  },
  scenarioBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 6,
    background: "rgba(67,160,71,0.15)",
    color: "#66bb6a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scenarioTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 6px",
  },
  scenarioMeta: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.blueLight,
    margin: "0 0 10px",
  },
  scenarioDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.55,
    margin: "0 0 18px",
  },
  scenarioCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 15,
    fontWeight: 600,
    color: COLORS.blueLight,
  },

  // Future scenario cards
  futureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  futureCard: {
    padding: "20px 18px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
  },
  futureTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "rgba(255,255,255,0.6)",
    margin: "0 0 4px",
  },
  futureDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.4,
    margin: "0 0 10px",
  },
  futureBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Persona heading
  personaHeading: {
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    margin: "24px 0 12px",
  },

  // Demo cards
  demoList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  demoCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    width: "100%",
    padding: "16px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    textAlign: "left",
    fontFamily: FONTS.base,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  demoCardHover: {
    background: "rgba(255,255,255,0.07)",
    borderColor: "rgba(46,134,193,0.3)",
    transform: "translateX(4px)",
  },
  demoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(46,134,193,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  demoInfo: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 3px",
  },
  demoDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.4,
    margin: 0,
  },

  // Footer
  footer: {
    padding: "40px 16px 60px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  footerInner: {
    maxWidth: 700,
    margin: "0 auto",
    textAlign: "center",
  },
  footerText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.6,
    margin: "0 0 16px",
  },
  footerBold: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: 700,
  },
  footerLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONTS.base,
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: 8,
  },
};
