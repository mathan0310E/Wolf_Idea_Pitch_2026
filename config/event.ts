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
  name: "CYBERWOLF PRESENTS — WOLF IDEA PITCH 2026",
  shortName: "WOLF IDEA PITCH 2026",
  tagline: "LEARN • SECURE • BUILD",
  date: "2026-10-09",
  venue: "Cyber Wolf HQ",
  city: "Tiruvannamalai, Tamil Nadu",
  venueAddress:
    "No. 3A, 10th Street, Gandhi Nagar, Tiruvannamalai, Tamil Nadu – 606601, India",
  contact: {
    phone: "+91 63798 69678",
    email: "info@cyberwolf360.in",
    whatsapp: "+91 78259 88139",
  },
  payment: {
    // ⚠️ ORGANIZER: Replace with your actual UPI ID before go-live.
    // Format: `yourname@bank` or `mobile@bank`.
    // Example: `cyberwolf360@oksbi`
    upiId: "8610259832-2@ybl",
    // ⚠️ ORGANIZER: Replace with the beneficiary name as it appears on the
    // bank account. This is shown to registrants for verification.
    beneficiaryName: "Mathan kumar. S",
    currency: "INR",
  },
  registration: {
    open: true,
    announcement:
      "Registrations are currently closed. For updates, contact info@cyberwolf360.in or +91 63798 69678.",
    idPrefix: "WOLF-2026",
  },
  socials: {
    // ⚠️ ORGANIZER: Replace with your actual social media profile URLs.
    instagram: "https://www.instagram.com/cyber_wolf_team",
    linkedin: "https://www.linkedin.com/company/cyberwolf-team",
  },
  themes: [
    {
      id: "theme-1",
      title: "Cyber Defense & Threat Intelligence 🛡️",
      description: "Detect and respond to cyber threats.",
    },
    {
      id: "theme-2",
      title: "AI × Cybersecurity 🤖",
      description: "Use AI to solve security problems.",
    },
    {
      id: "theme-3",
      title: "Application & Cloud Security 🔐",
      description: "Build secure apps, APIs, and cloud systems.",
    },
    {
      id: "theme-4",
      title: "IoT & Embedded Security 🌐",
      description: "Protect connected and smart devices.",
    },
    {
      id: "theme-5",
      title: "Digital Safety & Privacy 🧠",
      description: "Protect users, identities, and personal data.",
    },
    {
      id: "theme-6",
      title: "Cybercrime & Fraud Prevention 🚨",
      description: "Detect scams, fraud, and malicious activity.",
    },
    {
      id: "theme-7",
      title: "Industrial & Critical Infrastructure Security 🏭",
      description: "Secure industries, energy, and infrastructure.",
    },
    {
      id: "theme-8",
      title: "DevSecOps & Infrastructure Security ☁️",
      description: "Integrate security into software and infrastructure.",
    },
    {
      id: "theme-9",
      title: "Identity & Access Security 🔑",
      description: "Improve authentication, authorization, and Zero Trust.",
    },
    {
      id: "theme-10",
      title: "Open Cyber Innovation 💡",
      description: "Any innovative idea with a cybersecurity focus.",
    },
  ],
  schedule: {
    // ⚠️ ORGANIZER: Replace with your actual event schedule. These are
    // displayed on /schedule. Use 12-hour format with AM/PM for clarity.
    // Example: "08:30 AM - 09:30 AM"
    checkIn: "[SCHEDULE CHECK-IN - REPLACE ME]",
    opening: "[SCHEDULE OPENING CEREMONY - REPLACE ME]",
    hackathonStart: "[SCHEDULE HACKATHON START - REPLACE ME]",
    hackathonEnd: "[SCHEDULE HACKATHON END - REPLACE ME]",
    results: "[SCHEDULE RESULTS & VALEDICTORY - REPLACE ME]",
  },
} as const;