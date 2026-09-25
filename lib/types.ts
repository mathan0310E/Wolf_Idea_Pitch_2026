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
  // NEVER store screenshot Base64 here — it lives in the separate
  // `payments` document (PAY-{registrationId}). Only lightweight metadata.
  screenshotUrl?: string; // legacy: Storage URL / inline data URL (old records only)
  screenshotMeta?: {
    mimeType: string;
    size: number; // bytes
  };
  rejectionReason?: string;
}

export interface Payment {
  id?: string;
  paymentId: string;
  registrationId: string;
  amount: number;
  transactionId: string;
  utr: string;
  // Screenshot lives ONLY here — never in the registration document and
  // never in list feeds. Fetched on demand via
  // GET /api/admin/payments/screenshot only.
  screenshotBase64: string; // raw base64 (no data: prefix)
  screenshotMimeType: string; // image/jpeg | image/png | image/webp
  screenshotSize: number; // bytes
  status: PaymentStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id?: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  targetId: string;
  registrationId?: string;
  paymentId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>; // NEVER base64 / secrets
  timestamp: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: "admin";
  createdAt: string;
}
