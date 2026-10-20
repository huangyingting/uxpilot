"use client";

import React, { useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import { UserCheck, KeyRound, Plus, Copy, Check, Trash2, Sparkles } from "lucide-react";

export default function AccountPage() {
  const { data, loading, refresh } = useWorkspace();

  const [displayName, setDisplayName] = useState("");
  const [tokenName, setTokenName] = useState("Cursor / Claude Code MCP Token");
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const user = data?.user;
  const tokens = data?.mcpTokens || [];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName || user?.name || "Alex Rivera",
        }),
      });
      if (res.ok) {
        setSavedNotice("Profile updated successfully.");
        await refresh();
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateMcpToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) return;
    setCreatingToken(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName }),
      });
      if (res.ok) {
        setSavedNotice("Generated new MCP access token.");
        await refresh();
      }
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    await fetch(`/api/account?id=${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>Account Settings, Plan & MCP Access Tokens</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your profile, AI credit balance, and Model Context Protocol (MCP) tokens for Cursor & Claude Code.
          </p>
        </div>

        {savedNotice && (
          <div
            data-testid="account-saved-notice"
            className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300"
          >
            {savedNotice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4"
          >
            <h2 className="text-sm font-bold text-white">Profile & Role</h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                placeholder={user?.name || "Your Name"}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                data-testid="account-name-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Assigned RBAC Role:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                {user?.role}
              </span>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              data-testid="save-account-profile-btn"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              {savingProfile ? "Saving..." : "Save Profile Changes"}
            </button>
          </form>

          {/* Subscription & Credits */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Plan & AI Credit Quota</span>
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  {user?.planTier || "Enterprise"} Plan
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Credits power Hi-Fi UI generation, 4-Look Variations, Autoflow, and Predictive Eye-Tracking reviews.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Remaining Credits</span>
                  <span className="font-bold text-white">
                    {user?.creditsRemaining ?? 840} / {user?.creditsTotal ?? 1200}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MCP Access Tokens Section */}
        <section className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Model Context Protocol (MCP) Personal Access Tokens</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Use these tokens with `@uxpilot/mcp-server` inside Claude Code, Cursor, or Windsurf.
              </p>
            </div>

            <form onSubmit={handleCreateMcpToken} className="flex items-center gap-2">
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                data-testid="mcp-token-name-input"
                className="px-3 py-1.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
              <button
                type="submit"
                disabled={creatingToken}
                data-testid="create-mcp-token-btn"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Token</span>
              </button>
            </form>
          </div>

          <div className="space-y-2.5">
            {tokens.map((t) => (
              <div
                key={t.id}
                data-testid={`mcp-token-row-${t.id}`}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-white">{t.name}</div>
                  <div className="text-[11px] font-mono text-emerald-300 mt-0.5">
                    {t.tokenValue}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(t.tokenValue);
                      setCopiedId(t.id);
                      setTimeout(() => setCopiedId(null), 1800);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteToken(t.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                    title="Delete Token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
