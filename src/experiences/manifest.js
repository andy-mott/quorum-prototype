import {
  CalendarIcon,
  EnvelopeIcon,
  CalendarClockIcon,
  CombinedFormIcon,
} from "../shared/icons";

const EXPERIENCES = [
  {
    id: "host-scheduling",
    title: "Host Scheduling Form",
    description: "Create and configure a group gathering with smart multi-dimensional scheduling across people, times, and places.",
    app: "quorum",
    icon: CalendarIcon,
    status: "active",
    load: () => import("./scheduling/HostSchedulingForm.jsx"),
  },
  {
    id: "invitee-response",
    title: "Invitee Response",
    description: "Respond to a gathering invite by ranking your top preferences and marking times you're unavailable.",
    app: "quorum",
    icon: EnvelopeIcon,
    status: "active",
    load: () => import("./scheduling/InviteeExperience.jsx"),
  },
  {
    id: "invitee-calendar",
    title: "Invitee Calendar View",
    description: "Respond to a gathering invite using an interactive calendar that shows available days and lets you pick specific time slots.",
    app: "quorum",
    icon: CalendarClockIcon,
    status: "active",
    load: () => import("./scheduling/InviteeCalendarExperience.jsx"),
  },
  {
    id: "host-combined",
    title: "Host Combined Form",
    description: "Create a gathering with schedule, location, and commute buffer combined into a single streamlined step.",
    app: "quorum",
    icon: CombinedFormIcon,
    status: "active",
    load: () => import("./scheduling/HostCombinedForm.jsx"),
  },
];

export const APPS = [
  {
    id: "quorum",
    name: "Quorum",
    tagline: "Smart group scheduling",
    description: "Organize gatherings with quorum-based confirmation, location matching, and overflow support.",
    icon: CalendarClockIcon,
    status: "active",
  },
  {
    id: "trellis",
    name: "Trellis",
    tagline: "Content discovery",
    description: "Surface and share interesting content with your community.",
    icon: null,
    status: "coming_soon",
  },
];

export default EXPERIENCES;
