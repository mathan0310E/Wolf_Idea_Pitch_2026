export type TeamTypeId = "individual" | "duo" | "square";

export type RegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PAYMENT_PENDING"
  | "PAYMENT_VERIFICATION"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "SUBMITTED"
  | "VERIFIED"
  | "CONFIRMED"
  | "REJECTED";

export interface Member {
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  registerNumber: string;
  isTeamLeader: boolean;
}

export interface Registration {
  id?: string;
  registrationId: string; // e.g. WOLF-2026-00001
  lookupToken: string; // secret random token for /status lookup
  teamName: string;
  teamType: TeamTypeId;
  memberCount: number;
  domain: string;
  totalAmount: number;
  members: Member[];
  registrationStatus: RegistrationStatus;
  paymentStatus: PaymentStatus;
  createdAt: string; // ISO date string
  updatedAt: string;
  createdByIp?: string; // Hashed IP
  utr?: string;
  transactionId?: string;
  screenshotUrl?: string;
  rejectionReason?: string;
}

export interface Payment {
  id?: string;
  paymentId: string;
  registrationId: string;
  amount: number;
  transactionId: string;
  utr: string;
  screenshotUrl: string;
  status: PaymentStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id?: string;
  actorUid: string;
  action: string;
  targetId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  timestamp: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: "admin";
  createdAt: string;
}
