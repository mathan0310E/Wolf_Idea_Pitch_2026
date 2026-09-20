"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  CreditCard,
  Lock,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StepIndicator } from "@/components/ui/step-indicator";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { event, teamTypes, formatINR, TeamTypeId } from "@/config/event";
import { Member } from "@/lib/types";

const STEPS = [
  { id: 1, title: "Category", description: "Select team type" },
  { id: 2, title: "Team Info", description: "Name & Theme" },
  { id: 3, title: "Members", description: "Participant details" },
  { id: 4, title: "Review", description: "Verify input" },
  { id: 5, title: "Payment", description: "UPI Intent & QR" },
  { id: 6, title: "Proof", description: "UTR & Screenshot" },
  { id: 7, title: "Confirmed", description: "Registration ID" },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = React.useState(1);
  const [teamType, setTeamType] = React.useState<TeamTypeId>("individual");
  const [teamName, setTeamName] = React.useState("");
  const [domain, setDomain] = React.useState<string>(event.themes[0].title);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [transactionId, setTransactionId] = React.useState("");
  const [utr, setUtr] = React.useState("");
  const [screenshotUrl, setScreenshotUrl] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = React.useState<{
    registrationId: string;
    lookupToken: string;
  } | null>(null);
  const [copiedId, setCopiedId] = React.useState(false);
  const [copiedToken, setCopiedToken] = React.useState(false);

  const updateMembersForType = React.useCallback((type: TeamTypeId) => {
    const count = type === "individual" ? 1 : type === "duo" ? 2 : 4;
    setMembers((prev) => {
      const updated: Member[] = [];
      for (let i = 0; i < count; i++) {
        updated.push(
          prev[i] || {
            name: "",
            email: "",
            phone: "",
            college: "",
            department: "",
            year: "1",
            registerNumber: "",
            isTeamLeader: i === 0,
          }
        );
      }
      return updated;
    });
  }, []);

  React.useEffect(() => {
    const typeParam = searchParams.get("type") as TeamTypeId;
    if (typeParam && ["individual", "duo", "square"].includes(typeParam)) {
      setTeamType(typeParam);
      updateMembersForType(typeParam);
    } else {
      updateMembersForType("individual");
    }
  }, [searchParams, updateMembersForType]);

  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem("wolf_reg_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teamType) {
          setTeamType(parsed.teamType);
          setTeamName(parsed.teamName || "");
          setDomain(parsed.domain || event.themes[0].title);
          if (parsed.members && Array.isArray(parsed.members)) {
            setMembers(parsed.members);
          }
          if (parsed.transactionId) setTransactionId(parsed.transactionId);
          if (parsed.utr) setUtr(parsed.utr);
          if (parsed.screenshotUrl) setScreenshotUrl(parsed.screenshotUrl);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        "wolf_reg_draft",
        JSON.stringify({
          teamType,
          teamName,
          domain,
          members,
          transactionId,
          utr,
          screenshotUrl,
        })
      );
    } catch {
      // Ignore
    }
  }, [teamType, teamName, domain, members, transactionId, utr, screenshotUrl]);

  const memberCount = teamType === "individual" ? 1 : teamType === "duo" ? 2 : 4;
  const totalFee = memberCount * 300;

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(
    event.payment.upiId
  )}&pn=${encodeURIComponent(
    event.payment.beneficiaryName
  )}&am=${totalFee}&cu=INR&tn=${encodeURIComponent(`WOLF IDEATHON 2026 - ${teamName || "Registration"}`)}`;

  const handleMemberChange = (index: number, field: keyof Member, value: string | boolean) => {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!teamType) newErrors.teamType = "Please select a category.";
    } else if (step === 2) {
      if (!teamName.trim()) newErrors.teamName = "Team name is required.";
      if (!domain.trim()) newErrors.domain = "Domain selection is required.";
    } else if (step === 3) {
      members.forEach((m, idx) => {
        const prefix = `member_${idx}_`;
        if (!m.name.trim()) newErrors[`${prefix}name`] = "Full name is required.";
        if (!m.email.trim() || !/\S+@\S+\.\S+/.test(m.email))
          newErrors[`${prefix}email`] = "Valid email is required.";
        if (!m.phone.trim() || !/^[6-9]\d{9}$/.test(m.phone))
          newErrors[`${prefix}phone`] = "10-digit Indian phone number required.";
        if (!m.college.trim()) newErrors[`${prefix}college`] = "College is required.";
        if (!m.department.trim()) newErrors[`${prefix}department`] = "Department is required.";
        if (!m.registerNumber.trim()) newErrors[`${prefix}registerNumber`] = "Roll/Reg No required.";
      });
    } else if (step === 6) {
      if (!transactionId.trim()) newErrors.transactionId = "Transaction ID is required.";
      if (!utr.trim()) newErrors.utr = "UTR / Payment Reference UID is required.";
      if (!screenshotUrl) newErrors.screenshotUrl = "Payment screenshot proof is required.";
      if (!termsAccepted) newErrors.termsAccepted = "You must accept the terms to submit.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitRegistration = async () => {
    if (!validateStep(6)) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        teamType,
        teamName,
        domain,
        members,
        transactionId,
        utr,
        screenshotUrl,
        honeypot,
        termsAccepted: true,
      };

      const res = await fetch("/api/registrations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please check fields.");
      }

      setSubmissionResult({
        registrationId: data.registrationId,
        lookupToken: data.lookupToken,
      });

      sessionStorage.removeItem("wolf_reg_draft");
      setCurrentStep(7);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during submission.";
      setErrors({ form: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: "id" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          EVENT <span className="text-[#E50914]">REGISTRATION</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          WOLF IDEATHON 2026 — 09 October 2026 — Fee: ₹300 / participant
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <Card variant="default" className="border-white/10 p-6 sm:p-8">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-white">Select Registration Category</h2>
              <p className="text-xs text-zinc-400">
                Choose your team structure. Fees are automatically computed based on participant count.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {teamTypes.map((type) => {
                const isSelected = teamType === type.id;
                return (
                  <div
                    key={type.id}
                    onClick={() => {
                      setTeamType(type.id);
                      updateMembersForType(type.id);
                    }}
                    className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? "bg-[#E50914]/10 border-[#E50914] ring-1 ring-[#E50914]"
                        : "bg-[#1E1E1E] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-[#E50914] uppercase">
                        {type.memberCount} Participant{type.memberCount > 1 ? "s" : ""}
                      </span>
                      <h3 className="font-display text-xl font-bold text-white">{type.label}</h3>
                      <p className="text-xs text-zinc-400">{type.description}</p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400">Fee:</span>
                      <span className="font-display font-extrabold text-xl text-[#E50914]">
                        {formatINR(type.memberCount * 300)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-white">Team & Domain Information</h2>
              <p className="text-xs text-zinc-400">
                Provide your team name and select your preferred ideathon theme domain.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Team / Project Name"
                required
                placeholder="e.g. CyberKnights / Solo Innovator"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                error={errors.teamName}
              />

              <Select
                label="Ideathon Domain / Theme"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                options={event.themes.map((t) => ({
                  value: t.title,
                  label: `${t.title} - ${t.description}`,
                }))}
                error={errors.domain}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-white">Participant Details</h2>
              <p className="text-xs text-zinc-400">
                Enter details for all {memberCount} member(s). Member 1 is designated as Team Leader.
              </p>
            </div>

            <div className="space-y-8">
              {members.map((member, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-[#1E1E1E]/60 border border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-display text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      {idx === 0 ? "Member 1 (Team Leader)" : `Member ${idx + 1}`}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-mono uppercase bg-[#E50914]/20 text-[#E50914] px-2.5 py-0.5 rounded border border-[#E50914]/30">
                        Primary Contact
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      required
                      placeholder="John Doe"
                      value={member.name}
                      onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                      error={errors[`member_${idx}_name`]}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      inputMode="email"
                      required
                      placeholder="john@example.com"
                      value={member.email}
                      onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                      error={errors[`member_${idx}_email`]}
                    />

                    <Input
                      label="Phone Number (10-Digit)"
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="9876543210"
                      value={member.phone}
                      onChange={(e) => handleMemberChange(idx, "phone", e.target.value)}
                      error={errors[`member_${idx}_phone`]}
                    />

                    <Input
                      label="College / Institution"
                      required
                      placeholder="Institute Name"
                      value={member.college}
                      onChange={(e) => handleMemberChange(idx, "college", e.target.value)}
                      error={errors[`member_${idx}_college`]}
                    />

                    <Input
                      label="Department / Branch"
                      required
                      placeholder="CSE / IT / ECE"
                      value={member.department}
                      onChange={(e) => handleMemberChange(idx, "department", e.target.value)}
                      error={errors[`member_${idx}_department`]}
                    />

                    <Select
                      label="Year of Study"
                      required
                      value={member.year}
                      onChange={(e) => handleMemberChange(idx, "year", e.target.value)}
                      options={[
                        { value: "1", label: "1st Year" },
                        { value: "2", label: "2nd Year" },
                        { value: "3", label: "3rd Year" },
                        { value: "4", label: "4th Year" },
                        { value: "PG", label: "Post Graduate (PG)" },
                      ]}
                    />

                    <div className="sm:col-span-2">
                      <Input
                        label="Register / Roll Number"
                        required
                        placeholder="e.g. 21CS001"
                        value={member.registerNumber}
                        onChange={(e) => handleMemberChange(idx, "registerNumber", e.target.value)}
                        error={errors[`member_${idx}_registerNumber`]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-white">Review Registration Summary</h2>
              <p className="text-xs text-zinc-400">
                Verify all entered information carefully before proceeding to UPI payment.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#1E1E1E] border border-white/10 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-white/10 pb-4">
                <div>
                  <span className="text-zinc-400 block">Category:</span>
                  <span className="font-bold text-white uppercase">{teamType}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Team Name:</span>
                  <span className="font-bold text-white">{teamName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Domain:</span>
                  <span className="font-bold text-white truncate block">{domain}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Total Fee:</span>
                  <span className="font-bold text-[#E50914] font-mono text-base">{formatINR(totalFee)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Registered Members ({members.length})
                </h4>
                <div className="space-y-2">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#151515] border border-white/10 flex flex-col sm:flex-row justify-between text-xs gap-2"
                    >
                      <div>
                        <span className="font-bold text-white">{m.name}</span>{" "}
                        {idx === 0 && <span className="text-[#E50914] font-semibold">(Leader)</span>}
                        <span className="text-zinc-400 block">{m.college} • {m.department} ({m.registerNumber})</span>
                      </div>
                      <div className="text-zinc-400 font-mono">
                        {m.email} | {m.phone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="font-display text-2xl font-bold text-white">UPI Payment</h2>
              <p className="text-xs text-zinc-400">
                Scan the QR code or click the UPI Pay button to complete your registration payment.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#1E1E1E] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-xl bg-white border-2 border-[#E50914] shadow-lg">
                  <QRCodeSVG value={upiIntentUrl} size={180} />
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Scan with GPay, PhonePe, Paytm, BHIM
                </span>
              </div>

              <div className="flex-1 space-y-4 text-center lg:text-left">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-400 uppercase font-mono">Amount to Pay</span>
                  <div className="font-display text-4xl font-extrabold text-[#E50914]">
                    {formatINR(totalFee)}
                  </div>
                  <p className="text-xs text-zinc-400">
                    ({memberCount} member{memberCount > 1 ? "s" : ""} × ₹300)
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#151515] border border-white/10 text-xs text-zinc-300 font-mono space-y-1">
                  <div>UPI ID: <span className="text-white font-bold">{event.payment.upiId}</span></div>
                  <div>Receiver: <span className="text-white font-bold">{event.payment.beneficiaryName}</span></div>
                </div>

                <a
                  href={upiIntentUrl}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#E50914]/20"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>PAY {formatINR(totalFee)} VIA UPI</span>
                </a>

                <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 font-medium">
                  ⚠️ Note: Payment will be verified manually by the CyberWolf team. Clicking Pay does not automatically confirm your registration until screenshot and UTR proof are submitted in the next step.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-white">Payment Verification Proof</h2>
              <p className="text-xs text-zinc-400">
                Enter your UTR / Transaction reference ID and upload your payment screenshot.
              </p>
            </div>

            {errors.form && (
              <div className="p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 text-xs text-[#E50914] font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <div className="space-y-5">
              <Input
                label="Transaction ID / Order ID"
                required
                placeholder="e.g. TXN987654321"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                error={errors.transactionId}
              />

              <Input
                label="UTR / Payment Reference UID (12-Digits)"
                required
                placeholder="e.g. 427819028341"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                error={errors.utr}
              />

              <FileDropzone
                label="Payment Screenshot Proof"
                onFileSelect={(file, base64) => setScreenshotUrl(base64)}
                error={errors.screenshotUrl}
              />

              <input
                type="text"
                name="honeypot"
                className="hidden"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-[#E50914] w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-zinc-300 cursor-pointer select-none">
                  I certify that all details provided are accurate, and I agree to the rules and payment verification policy of WOLF IDEATHON 2026.
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="text-xs text-[#E50914] font-medium">⚠ {errors.termsAccepted}</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 7 && submissionResult && (
          <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-3xl font-extrabold text-white">REGISTRATION SUBMITTED</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Your registration proof has been submitted successfully. Please save your Registration ID and secret Lookup Token to track status.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#1E1E1E] border border-white/10 space-y-4 max-w-lg mx-auto text-left">
              <div>
                <span className="text-xs text-zinc-400 block font-mono">Registration ID</span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-mono text-xl font-bold text-[#E50914]">
                    {submissionResult.registrationId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(submissionResult.registrationId, "id")}
                    className="p-2 rounded bg-[#151515] hover:bg-white/10 text-xs text-zinc-300 flex items-center gap-1 border border-white/10"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedId ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-xs text-zinc-400 block font-mono">Private Lookup Token</span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-mono text-xs text-white truncate max-w-[260px]">
                    {submissionResult.lookupToken}
                  </span>
                  <button
                    onClick={() => copyToClipboard(submissionResult.lookupToken, "token")}
                    className="p-2 rounded bg-[#151515] hover:bg-white/10 text-xs text-zinc-300 flex items-center gap-1 border border-white/10"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedToken ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`/status?id=${submissionResult.registrationId}&token=${submissionResult.lookupToken}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider"
              >
                Go to Live Status Tracker
              </a>
            </div>
          </div>
        )}

        {currentStep < 7 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E1E1E] hover:bg-white/10 text-white font-semibold text-xs transition-colors border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-[#E50914]/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitRegistration}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#E50914]/25 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Registration...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Submit Registration & Proof</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-12">
        <React.Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading registration form...</div>}>
          <RegisterForm />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
