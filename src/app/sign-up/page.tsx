"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Layers, KeyRound, Mail, User, Lock, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationCode: invitationCode.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Registration failed.");
        return;
      }

      setSuccessMsg(
        `Invitation redeemed! Assigned role: ${json.user.role}. Signing you in...`
      );

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (!loginRes?.error) {
        router.push("/a/ui-list");
        router.refresh();
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
            Invite-Only Admission
          </span>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-white">
            Redeem Single-Use Invitation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registration requires a valid, non-expired single-use invitation code issued by a workspace administrator.
          </p>
        </div>

        {error && (
          <div
            data-testid="signup-error-alert"
            className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200"
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            data-testid="signup-success-alert"
            className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Invitation Code (Single-Use)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="UXP-2026-EDITOR1"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                data-testid="signup-invite-code-input"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Jordan Taylor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="signup-name-input"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="jordan@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="signup-email-input"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password (minimum 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="signup-password-input"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="signup-submit-btn"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg transition"
          >
            {submitting ? "Verifying Invitation..." : "Redeem Invitation & Create Account"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-indigo-400 hover:underline font-semibold">
            Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}
