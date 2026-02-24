import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { COLORS, GRADIENTS, FONTS } from "../shared/styles";
import EXPERIENCES, { APPS } from "../experiences/manifest";

const BackArrow = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={styles.notFoundContainer}>
      <p style={styles.notFoundText}>App not found</p>
      <button onClick={() => navigate("/")} style={styles.notFoundBtn}>
        Back to Platopia
      </button>
    </div>
  );
}

export default function AppPage() {
  const { appId } = useParams();
  const navigate = useNavigate();

  const app = APPS.find((a) => a.id === appId);

  if (!app) {
    return <NotFound />;
  }

  const appExperiences = EXPERIENCES.filter((exp) => exp.app === appId);

  const handleSelect = (expId) => {
    navigate(`/app/${appId}/${expId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.backBar}>
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          <BackArrow />
          <span>Back to Platopia</span>
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.appName}>{app.name}</h1>
          <p style={styles.appTagline}>{app.tagline}</p>
          <p style={styles.appDesc}>{app.description}</p>
        </div>

        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Experiences</h2>
          <p style={styles.sectionDesc}>{appExperiences.length} prototype{appExperiences.length !== 1 ? "s" : ""}</p>
        </div>

        <div style={styles.expGrid}>
          {appExperiences.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} onClick={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: GRADIENTS.background,
    fontFamily: FONTS.base,
  },
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
    transition: "color 0.15s ease",
  },
  content: {
    maxWidth: 700,
    width: "100%",
    margin: "0 auto",
    padding: "80px 16px 40px",
  },
  header: {
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 4px",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.blueLight,
    margin: "0 0 12px",
  },
  appDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.6,
    margin: 0,
  },
  sectionHeader: {
    marginBottom: 16,
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    margin: 0,
  },
  sectionDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
  expGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
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
  notFoundContainer: {
    minHeight: "100vh",
    background: GRADIENTS.background,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFoundText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    fontWeight: 600,
    fontFamily: FONTS.base,
  },
  notFoundBtn: {
    background: GRADIENTS.primaryBtn,
    color: "#fff",
    border: "none",
    padding: "10px 24px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: FONTS.base,
    cursor: "pointer",
  },
};
