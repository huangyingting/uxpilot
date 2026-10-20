"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Layers, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@uxpilot.local");
  const [password, setPassword] = useState("AdminPassword123!");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });
      if (res?.error) {
        setError("Invalid credentials or account has been revoked by an administrator.");
      } else {
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
            <div>
              <span className="font-bold text-lg text-white">UX Pilot</span>
              <span className="ml-1.5 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Studio
              </span>
            </div>
          </Link>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RBAC Protected</span>
          </span>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-white">Sign in to your workspace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access AI UI design, wireframing, predictive heatmaps, and design system tools.
          </p>
        </div>

        {error && (
          <div
            data-testid="signin-error-alert"
            className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="signin-email-input"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="signin-password-input"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="signin-submit-btn"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition"
          >
            <span>{submitting ? "Signing in..." : "Sign In to Workspace"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Switcher Pills */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-400 font-medium">
            Quick Fill Demo Accounts (Admin / Editor / Viewer):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@uxpilot.local");
                setPassword("AdminPassword123!");
              }}
              data-testid="quickfill-admin"
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-rose-300 font-semibold"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("editor@uxpilot.local");
                setPassword("EditorPassword123!");
              }}
              data-testid="quickfill-editor"
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-300 font-semibold"
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("viewer@uxpilot.local");
                setPassword("ViewerPassword123!");
              }}
              data-testid="quickfill-viewer"
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-semibold"
            >
              Viewer
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Have a single-use invitation code?{" "}
          <Link href="/sign-up" className="text-indigo-400 hover:underline font-semibold">
            Redeem Invitation →
          </Link>
        </div>
      </div>
    </div>
  );
}
