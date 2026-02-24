import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, GRADIENTS, FONTS } from "../shared/styles";
import { APPS } from "../experiences/manifest";

function AppCard({ app, onClick }) {
  const [hovered, setHovered] = useState(false);
  const isActive = app.status === "active";
  const Icon = app.icon;

  return (
    <button
      onClick={() => isActive && onClick(app.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.appCard,
        ...(isActive ? styles.appCardActive : styles.appCardDisabled),
        ...(isActive && hovered ? styles.appCardHover : {}),
      }}
    >
      <div style={styles.appIconWrap}>
        {Icon ? <Icon /> : <span style={styles.appIconPlaceholder}>?</span>}
      </div>
      <div style={styles.appCardBody}>
        <h3 style={{ ...styles.appName, ...(isActive ? {} : styles.appNameDisabled) }}>
          {app.name}
        </h3>
        <p style={styles.appTagline}>{app.tagline}</p>
        <p style={styles.appDesc}>{app.description}</p>
      </div>
      <div style={{ ...styles.appBadge, ...(isActive ? styles.appBadgeActive : styles.appBadgeSoon) }}>
        <div style={{ ...styles.appBadgeDot, background: isActive ? COLORS.greenLight : COLORS.textLight }} />
        {isActive ? "Active" : "Coming Soon"}
      </div>
    </button>
  );
}

export default function Catalog() {
  const navigate = useNavigate();

  const handleSelect = (appId) => {
    navigate(`/app/${appId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.landing}>
        <div style={styles.landingHeader}>
          <div style={styles.logoRow}>
            <div style={styles.logo}>P</div>
            <span style={styles.logoText}>Platopia</span>
          </div>
          <h1 style={styles.landingTitle}>Prototype Platform</h1>
          <p style={styles.landingDesc}>
            A collection of apps for organizing group experiences — from scheduling to content discovery.
          </p>
        </div>

        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Apps</h2>
        </div>

        <div style={styles.appGrid}>
          {APPS.map((app) => (
            <AppCard key={app.id} app={app} onClick={handleSelect} />
          ))}
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Each app is a self-contained prototype exploring a different facet of the Platopia platform.
          </p>
        </div>
      </div>
    </div>
  );
}

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
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    margin: 0,
  },
  appGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  appCard: {
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
  appCardActive: {
    background: "#fff",
    borderColor: "#e0e5eb",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)",
  },
  appCardHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(46,134,193,0.2)",
    borderColor: COLORS.blueLight,
  },
  appCardDisabled: {
    background: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
    cursor: "default",
    opacity: 0.7,
  },
  appIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: COLORS.blueAccentBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appIconPlaceholder: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.blueLight,
  },
  appCardBody: {
    flex: 1,
    marginBottom: 16,
  },
  appName: {
    fontSize: 19,
    fontWeight: 700,
    color: COLORS.text,
    margin: "0 0 4px",
    letterSpacing: -0.2,
  },
  appNameDisabled: {
    color: "rgba(255,255,255,0.6)",
  },
  appTagline: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.blueLight,
    margin: "0 0 10px",
  },
  appDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 1.55,
    margin: 0,
  },
  appBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  appBadgeActive: {
    background: "#e8f5e9",
    color: COLORS.greenLight,
  },
  appBadgeSoon: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.5)",
  },
  appBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
  },
  footer: {
    textAlign: "center",
    paddingTop: 8,
    marginTop: 40,
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
