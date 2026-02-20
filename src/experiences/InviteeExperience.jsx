import { COLORS, GRADIENTS, FONTS } from "../shared/styles";

export default function InviteeExperience({ onBack }) {
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
          <p style={styles.subtitle}>Invitee Response Experience</p>
        </div>
        <div style={styles.body}>
          <div style={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill={COLORS.blueAccentBg} stroke={COLORS.blueLight} strokeWidth="2"/>
              <path d="M14 18L24 25L34 18" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="12" y="16" width="24" height="18" rx="3" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
            </svg>
          </div>
          <h2 style={styles.title}>Coming Soon</h2>
          <p style={styles.description}>
            The invitee response experience will let you respond to a gathering invite by ranking your top preferences
            and marking times you're unavailable. This experience is designed to work alongside the host scheduling form.
          </p>
          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span>View proposed dates, times, and locations</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span>Rank your top 3 preferred options</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span>Mark unavailable times from your calendar</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span>See real-time quorum progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: GRADIENTS.background, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", fontFamily: FONTS.base },
  card: { background: COLORS.cardBg, borderRadius: 20, maxWidth: 560, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)", overflow: "hidden" },
  header: { padding: "32px 32px 20px", borderBottom: "1px solid #f0f0f0" },
  backToHub: { display: "flex", alignItems: "center", background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "0 0 14px", fontFamily: FONTS.base, transition: "color 0.2s" },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logo: { width: 36, height: 36, borderRadius: 10, background: GRADIENTS.primaryBtn, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, letterSpacing: -0.5 },
  logoText: { fontSize: 20, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, margin: "4px 0 0" },
  body: { padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  icon: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 12px" },
  description: { fontSize: 15, color: COLORS.textMuted, lineHeight: 1.6, maxWidth: 420, margin: "0 0 28px" },
  featureList: { display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", textAlign: "left", width: "100%", maxWidth: 340 },
  featureItem: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: COLORS.textBody },
  featureDot: { width: 8, height: 8, borderRadius: "50%", background: COLORS.blueLight, flexShrink: 0 },
};
