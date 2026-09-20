import { z } from "zod";

export const phoneRegex = /^[6-9]\d{9}$/;

export const memberSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(phoneRegex, "Must be a valid 10-digit Indian phone number starting with 6-9"),
  college: z
    .string()
    .min(2, "College/Institution name is required")
    .max(150, "College name is too long"),
  department: z
    .string()
    .min(1, "Department is required")
    .max(100, "Department name is too long"),
  year: z.string().min(1, "Year of study is required"),
  registerNumber: z
    .string()
    .min(2, "Register/Roll Number is required")
    .max(50, "Register number is too long"),
  isTeamLeader: z.boolean().default(false),
});

export const registrationFormSchema = z
  .object({
    teamName: z
      .string()
      .min(2, "Team name must be at least 2 characters")
      .max(100, "Team name is too long"),
    teamType: z.enum(["individual", "duo", "square"], {
      message: "Please select a team type",
    }),
    domain: z
      .string()
      .min(2, "Please select or enter a domain/theme")
      .max(100),
    members: z
      .array(memberSchema)
      .min(1, "At least one member is required"),
    transactionId: z
      .string()
      .min(4, "Transaction ID must be at least 4 characters")
      .max(60, "Transaction ID is too long"),
    utr: z
      .string()
      .min(4, "UTR / Payment Ref must be at least 4 characters")
      .max(60, "UTR is too long"),
    screenshotUrl: z
      .string()
      .min(1, "Payment screenshot proof is required"),
    honeypot: z.string().max(0, "Bot detected").optional(),
    termsAccepted: z.literal(true, {
      message: "You must accept the terms and guidelines",
    }),
  })
  .superRefine((data, ctx) => {
    const expectedCount =
      data.teamType === "individual" ? 1 : data.teamType === "duo" ? 2 : 4;
    if (data.members.length !== expectedCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["members"],
        message: `${data.teamType.toUpperCase()} team requires exactly ${expectedCount} member(s).`,
      });
    }
  });

export const statusLookupSchema = z.object({
  registrationId: z
    .string()
    .min(6, "Registration ID format is WOLF-2026-XXXXX")
    .transform((val) => val.trim().toUpperCase()),
  lookupToken: z
    .string()
    .min(10, "Valid Lookup Token is required"),
});

export const adminVerifySchema = z.object({
  registrationId: z.string().min(1),
  status: z.enum(["CONFIRMED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

/**
 * CSV Formula Injection Guard:
 * Prevents Excel/CSV formula injection attacks by prefixing dangerous starting characters (=, +, -, @, tab, cr) with a single quote.
 */
export function sanitizeForCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const dangerousPrefixes = ["=", "+", "-", "@", "\t", "\r"];
  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    return `'${str}`;
  }
  return str;
}
