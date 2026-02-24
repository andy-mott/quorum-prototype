import { Suspense, lazy, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { COLORS, GRADIENTS, FONTS } from "../shared/styles";
import EXPERIENCES, { APPS } from "../experiences/manifest";

const BackArrow = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function LoadingFallback() {
  return (
    <div style={shellStyles.loadingContainer}>
      <div style={shellStyles.spinner} />
      <p style={shellStyles.loadingText}>Loading experience...</p>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={shellStyles.loadingContainer}>
      <p style={shellStyles.notFoundText}>Experience not found</p>
      <button onClick={() => navigate("/")} style={shellStyles.notFoundBtn}>
        Back to Platopia
      </button>
    </div>
  );
}

export default function ExperienceShell() {
  const { appId, expId } = useParams();
  const navigate = useNavigate();

  const app = APPS.find((a) => a.id === appId);
  const experience = EXPERIENCES.find((e) => e.id === expId && e.app === appId);

  const LazyComponent = useMemo(() => {
    if (!experience) return null;
    return lazy(experience.load);
  }, [experience]);

  if (!experience || !LazyComponent) {
    return <NotFound />;
  }

  const backPath = `/app/${appId}`;
  const backLabel = app ? `Back to ${app.name}` : "Back";

  return (
    <div style={shellStyles.wrapper}>
      <div style={shellStyles.backBar}>
        <button
          onClick={() => navigate(backPath)}
          style={shellStyles.backBtn}
        >
          <BackArrow />
          <span>{backLabel}</span>
        </button>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent onBack={() => navigate(backPath)} />
      </Suspense>
    </div>
  );
}

const shellStyles = {
  wrapper: {
    position: "relative",
    minHeight: "100vh",
    paddingTop: 40,
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
  loadingContainer: {
    minHeight: "100vh",
    background: GRADIENTS.background,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: COLORS.blueLight,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: FONTS.base,
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
