export type TeamTypeId = "individual" | "duo" | "square";

export interface TeamType {
  id: TeamTypeId;
  label: string;
  memberCount: number;
  description: string;
}

export const feePerMember = 300;

export const teamTypes: TeamType[] = [
  {
    id: "individual",
    label: "Solo",
    memberCount: 1,
    description: "Solo participant",
  },
  {
    id: "duo",
    label: "Duo",
    memberCount: 2,
    description: "Team of two",
  },
  {
    id: "square",
    label: "Squad",
    memberCount: 4,
    description: "Team of four",
  },
];

export function getTeamType(teamTypeId: string): TeamType | undefined {
  return teamTypes.find((type) => type.id === teamTypeId);
}

export function teamTypeLabel(teamTypeId: TeamTypeId): string {
  return getTeamType(teamTypeId)?.label ?? teamTypeId;
}

export function registrationFee(teamTypeId: TeamTypeId): number {
  const teamType = getTeamType(teamTypeId);
  if (!teamType) {
    throw new Error(`Unknown team type: ${teamTypeId}`);
  }
  return teamType.memberCount * feePerMember;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const event = {
  name: "CYBERWOLF PRESENTS — WOLF IDEATHON 2026",
  shortName: "WOLF IDEATHON 2026",
  tagline: "LEARN • SECURE • BUILD",
  date: "2026-10-09",
  venue: "[VENUE NAME]",
  city: "[CITY]",
  contact: {
    phone: "[CONTACT PHONE]",
    email: "[CONTACT EMAIL]",
    whatsapp: "[WHATSAPP LINK]",
  },
  payment: {
    upiId: "[UPI ID]",
    beneficiaryName: "[RECEIVER NAME]",
    currency: "INR",
  },
  registration: {
    open: false,
    announcement:
      "Registrations will open soon. Follow @[SOCIAL HANDLE] for updates.",
    idPrefix: "WOLF-2026",
  },
  socials: {
    instagram: "[INSTAGRAM URL]",
    linkedin: "[LINKEDIN URL]",
  },
  themes: [
    { id: "theme-1", title: "[THEME 1]", description: "[THEME DESCRIPTION]" },
    { id: "theme-2", title: "[THEME 2]", description: "[THEME DESCRIPTION]" },
    { id: "theme-3", title: "[THEME 3]", description: "[THEME DESCRIPTION]" },
    { id: "theme-4", title: "[THEME 4]", description: "[THEME DESCRIPTION]" },
  ],
  schedule: {
    checkIn: "[SCHEDULE TBD]",
    opening: "[SCHEDULE TBD]",
    hackathonStart: "[SCHEDULE TBD]",
    hackathonEnd: "[SCHEDULE TBD]",
    results: "[SCHEDULE TBD]",
  },
} as const;