import { useState } from "react";
import { COLORS, GRADIENTS, FONTS } from "./shared/styles";
import HostSchedulingForm from "./experiences/HostSchedulingForm";
import InviteeExperience from "./experiences/InviteeExperience";

// --- Icons for experience cards ---
const CalendarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="24" height="22" rx="4" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
    <path d="M4 14H28" stroke={COLORS.blueLight} strokeWidth="2"/>
    <path d="M10 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="9" y="18" width="4" height="3" rx="1" fill={COLORS.blueLight}/>
    <rect x="17" y="18" width="4" height="3" rx="1" fill={COLORS.blueLight} opacity="0.4"/>
    <rect x="9" y="23" width="4" height="3" rx="1" fill={COLORS.blueLight} opacity="0.4"/>
  </svg>
);

const EnvelopeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="8" width="24" height="18" rx="4" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
    <path d="M6 10L16 19L26 10" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// --- Experience registry ---
const EXPERIENCES = [
  {
    id: "host-scheduling",
    title: "Host Scheduling Form",
    description: "Create and configure a group gathering with smart multi-dimensional scheduling across people, times, and places.",
    icon: CalendarIcon,
    status: "active",
    component: HostSchedulingForm,
  },
  {
    id: "invitee-response",
    title: "Invitee Response",
    description: "Respond to a gathering invite by ranking your top preferences and marking times you're unavailable.",
    icon: EnvelopeIcon,
    status: "coming-soon",
    component: InviteeExperience,
  },
];

// --- Experience Card ---
function ExperienceCard({ experience, onClick }) {
  const [hovered, setHovered] = useState(false);
  const isActive = experience.status === "active";
  const Icon = experience.icon;

  return (
    <button
      onClick={() => isActive && onClick(experience.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.expCard,
        ...(isActive ? styles.expCardActive : styles.expCardDisabled),
        ...(isActive && hovered ? styles.expCardHover : {}),
      }}
    >
      <div style={styles.expIconWrap}>
        <Icon />
      </div>
      <h3 style={{ ...styles.expTitle, ...(isActive ? {} : styles.expTitleDisabled) }}>
        {experience.title}
      </h3>
      <p style={styles.expDesc}>{experience.description}</p>
      <div style={{ ...styles.expBadge, ...(isActive ? styles.expBadgeActive : styles.expBadgeSoon) }}>
        <div style={{ ...styles.expBadgeDot, background: isActive ? COLORS.greenLight : COLORS.textLight }} />
        {isActive ? "Active" : "Coming Soon"}
      </div>
    </button>
  );
}

// --- Landing Page ---
function LandingPage({ onSelect }) {
  return (
    <div style={styles.container}>
      <div style={styles.landing}>
        <div style={styles.landingHeader}>
          <div style={styles.logoRow}>
            <div style={styles.logo}>Q</div>
            <span style={styles.logoText}>Quorum</span>
          </div>
          <h1 style={styles.landingTitle}>Prototype Experiences</h1>
          <p style={styles.landingDesc}>
            Explore the interactive concepts behind Quorum — a smart scheduling platform for organizing group gatherings.
          </p>
        </div>
        <div style={styles.expGrid}>
          {EXPERIENCES.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} onClick={onSelect} />
          ))}
        </div>
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Built to illustrate Quorum's core mechanics: quorum-based confirmation,
            locations as participants, and availability set matching.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Root App ---
export default function App() {
  const [currentView, setCurrentView] = useState(null);

  if (currentView) {
    const experience = EXPERIENCES.find((e) => e.id === currentView);
    if (experience && experience.component) {
      const Component = experience.component;
      return <Component onBack={() => setCurrentView(null)} />;
    }
  }

  return <LandingPage onSelect={(id) => setCurrentView(id)} />;
}

// --- Styles ---
const styles = {
  container: {
    minHeight: "100vh",
    background: GRADIENTS.background,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "60px 16px 40px",
    fontFamily: FONTS.base,
  },
  landing: {
    maxWidth: 700,
    width: "100%",
  },
  landingHeader: {
    textAlign: "center",
    marginBottom: 40,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: GRADIENTS.primaryBtn,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: -0.5,
    boxShadow: "0 4px 16px rgba(26,82,118,0.4)",
  },
  logoText: {
    fontSize: 26,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: -0.5,
  },
  landingTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    margin: "0 0 10px",
    letterSpacing: -0.3,
  },
  landingDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.6,
    maxWidth: 480,
    margin: "0 auto",
  },
  expGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 40,
  },
  expCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "28px 24px 24px",
    borderRadius: 18,
    border: "1.5px solid",
    textAlign: "left",
    fontFamily: FONTS.base,
    transition: "all 0.25s ease",
    cursor: "pointer",
    minHeight: 200,
  },
  expCardActive: {
    background: "#fff",
    borderColor: "#e0e5eb",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)",
  },
  expCardHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(46,134,193,0.2)",
    borderColor: COLORS.blueLight,
  },
  expCardDisabled: {
    background: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
    cursor: "default",
    opacity: 0.7,
  },
  expIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: COLORS.blueAccentBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  expTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: COLORS.text,
    margin: "0 0 8px",
    letterSpacing: -0.2,
  },
  expTitleDisabled: {
    color: "rgba(255,255,255,0.6)",
  },
  expDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 1.55,
    margin: "0 0 16px",
    flex: 1,
  },
  expBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  expBadgeActive: {
    background: "#e8f5e9",
    color: COLORS.greenLight,
  },
  expBadgeSoon: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.5)",
  },
  expBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
  },
  footer: {
    textAlign: "center",
    paddingTop: 8,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    lineHeight: 1.6,
    maxWidth: 420,
    margin: "0 auto",
  },
};
