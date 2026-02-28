import { COLORS } from "./styles";

export const CalendarIcon = () => (
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

export const EnvelopeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="8" width="24" height="18" rx="4" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
    <path d="M6 10L16 19L26 10" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CalendarClockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="20" height="20" rx="4" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
    <path d="M4 13H24" stroke={COLORS.blueLight} strokeWidth="2"/>
    <path d="M10 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M18 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="22" r="7" stroke={COLORS.blueLight} strokeWidth="2" fill="#fff"/>
    <path d="M24 18.5V22L26 24" stroke={COLORS.blueLight} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const ClassicScheduleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="24" height="22" rx="4" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
    <path d="M4 14H28" stroke={COLORS.blueLight} strokeWidth="2"/>
    <path d="M10 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M9 19H15" stroke={COLORS.blueLight} strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 23H12" stroke={COLORS.blueLight} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="22" cy="21" r="4" stroke={COLORS.blueLight} strokeWidth="1.8" fill="none"/>
    <path d="M22 19V21L23.5 22.5" stroke={COLORS.blueLight} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const SimulationIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="24" height="22" rx="4" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
    <path d="M4 14H28" stroke={COLORS.blueLight} strokeWidth="2"/>
    <path d="M10 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M13 18V26L21 22L13 18Z" fill={COLORS.blueLight} opacity="0.8"/>
  </svg>
);

export const CombinedFormIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="24" height="22" rx="4" stroke={COLORS.blueLight} strokeWidth="2.5" fill="none"/>
    <path d="M4 14H28" stroke={COLORS.blueLight} strokeWidth="2"/>
    <path d="M10 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 4V8" stroke={COLORS.blueLight} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="11" cy="20" r="2.5" stroke={COLORS.blueLight} strokeWidth="1.5" fill="none"/>
    <path d="M11 22.5V25" stroke={COLORS.blueLight} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="18" y="18" width="6" height="7" rx="1.5" stroke={COLORS.blueLight} strokeWidth="1.5" fill="none"/>
    <path d="M21 18V16" stroke={COLORS.blueLight} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
