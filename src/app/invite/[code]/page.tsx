"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Layers,
  KeyRound,
  ShieldCheck,
  Mail,
  User,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface InvitationPreview {
  code: string;
  email: string | null;
  assignedRole: "Admin" | "Editor" | "Viewer";
  expiresAt: string;
}

export default function DirectInvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeURIComponent(String(params?.code || "")).toUpperCase();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [validating, setValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkCode() {
      setValidating(true);
      try {
        const res = await fetch(`/api/auth/register?code=${encodeURIComponent(code)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json.valid) {
          setValidationError(json.reason || "Invitation link is invalid or expired.");
          setPreview(null);
        } else {
          setPreview(json.invitation);
          if (json.invitation?.email) {
            setEmail(json.invitation.email);
          }
          setValidationError(null);
        }
      } catch {
        if (active) setValidationError("Unable to verify invitation code.");
      } finally {
        if (active) setValidating(false);
      }
    }
    if (code) checkCode();
    return () => {
      active = false;
    };
  }, [code]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationCode: code,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error || "Could not redeem invitation.");
        return;
      }

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });
      if (!loginRes?.error) {
        router.push("/a/ui-list");
        router.refresh();
      } else {
        router.push("/sign-in");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#111827] border border-slate-800 p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">UX Pilot Studio</span>
          </Link>
          <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Invite Grant
          </span>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-white">
            Accept Workspace Invitation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Direct single-use invitation redemption link (`{code}`)
          </p>
        </div>

        {validating ? (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            Verifying single-use invitation grant...
          </div>
        ) : validationError ? (
          <div
            data-testid="invite-link-error"
            className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
            <p className="text-[11px] text-rose-300/80">
              Ask a workspace administrator to issue or rotate your invitation link in `/a/admin`.
            </p>
            <Link
              href="/sign-up"
              className="inline-block px-3.5 py-2 rounded-lg bg-slate-900 text-xs font-semibold text-white"
            >
              Enter Another Code →
            </Link>
          </div>
        ) : (
          preview && (
            <>
              <div
                data-testid="invite-grant-banner"
                className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified Single-Use Invite</span>
                  </span>
                  <span
                    data-testid="invite-grant-role"
                    className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase"
                  >
                    Role: {preview.assignedRole}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    {preview.email ? `Locked to ${preview.email}` : "Open to your work email"}
                  </span>
                  <span>Expires {new Date(preview.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>

              {submitError && (
                <div
                  data-testid="invite-submit-error"
                  className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200"
                >
                  {submitError}
                </div>
              )}

              <form onSubmit={handleRedeem} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Invitation Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      readOnly
                      value={code}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-indigo-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Morgan Lee"
                      data-testid="invite-link-name-input"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="morgan@company.com"
                      data-testid="invite-link-email-input"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      data-testid="invite-link-password-input"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="invite-link-submit-btn"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {submitting ? "Activating Account..." : "Accept Invite & Join Workspace"}
                  </span>
                </button>
              </form>
            </>
          )
        )}
      </div>
    </div>
  );
}
