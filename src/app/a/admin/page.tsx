"use client";

import React, { useCallback, useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  ShieldAlert,
  KeyRound,
  Users,
  ScrollText,
  Cpu,
  Plus,
  Ban,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";

interface InvitationRow {
  id: string;
  code: string;
  email: string | null;
  invitedRole: "Admin" | "Editor" | "Viewer";
  status: string;
  effectiveStatus: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: "Admin" | "Editor" | "Viewer";
  status: "ACTIVE" | "REVOKED";
  planTier: string;
  creditsRemaining: number;
  revokedAt: string | null;
}

interface AuditLogRow {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  createdAt: string;
}

export default function AdminGovernancePage() {
  const { data, loading, refresh } = useWorkspace();

  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [actionFilter, setActionFilter] = useState("");

  // Create invitation form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Editor" | "Viewer">("Editor");
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [switchingAi, setSwitchingAi] = useState(false);

  const loadAdminData = useCallback(async () => {
    const [invRes, usrRes, logRes] = await Promise.all([
      fetch("/api/admin/invitations", { cache: "no-store" }),
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch(
        `/api/admin/audit-logs${actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : ""}`,
        { cache: "no-store" }
      ),
    ]);
    if (invRes.ok) {
      const j = await invRes.json();
      setInvitations(j.invitations || []);
    }
    if (usrRes.ok) {
      const j = await usrRes.json();
      setUsers(j.users || []);
    }
    if (logRes.ok) {
      const j = await logRes.json();
      setAuditLogs(j.logs || []);
    }
  }, [actionFilter]);

  useEffect(() => {
    if (data?.user?.role === "Admin") {
      loadAdminData();
    }
  }, [data?.user?.role, loadAdminData]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInvite(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim() || null,
          role: inviteRole,
          expiresInHours: Number(expiresInHours),
        }),
      });
      if (res.ok) {
        setInviteEmail("");
        await loadAdminData();
      }
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    await fetch(`/api/admin/invitations/${id}`, { method: "DELETE" });
    await loadAdminData();
  };

  const handleUpdateUser = async (
    id: string,
    payload: { role?: string; action?: "revoke" | "restore" }
  ) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadAdminData();
  };

  const handleSwitchAiProvider = async (
    provider: "copilot-sdk" | "azure-openai" | "deterministic"
  ) => {
    setSwitchingAi(true);
    try {
      await fetch("/api/ai/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      await refresh();
      await loadAdminData();
    } finally {
      setSwitchingAi(false);
    }
  };

  if (data?.user && data.user.role !== "Admin") {
    return (
      <WorkspaceShell data={data} loading={loading} refresh={refresh}>
        <div className="p-10 max-w-xl mx-auto text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="text-lg font-bold text-white">Admin Access Required</h1>
          <p className="text-xs text-slate-400">
            Only accounts with the Admin role can manage single-use invitations, RBAC roles, account revocations, and audit logs.
          </p>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Invite-Only Governance • RBAC • Pluggable AI • Audit Trail</span>
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            Enterprise Security & Governance Console
          </h1>
        </div>

        {/* Section 1: Pluggable AI Engine Switcher (Copilot SDK / Azure OpenAI / Deterministic) */}
        <section className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Pluggable AI Provider Adapter</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seamlessly switch between GitHub Copilot SDK (`@github/copilot-sdk`), Azure OpenAI, and Deterministic Synthesis.
              </p>
            </div>
            <span
              data-testid="admin-active-ai-provider"
              className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
            >
              Active: {data?.aiStatus?.activeProvider || "copilot-sdk"} (
              {data?.aiStatus?.activeModel})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(data?.aiStatus?.providers || []).map((prov) => {
              const isCurrent = data?.aiStatus?.activeProvider === prov.id;
              return (
                <button
                  key={prov.id}
                  type="button"
                  disabled={switchingAi}
                  onClick={() =>
                    handleSwitchAiProvider(
                      prov.id as "copilot-sdk" | "azure-openai" | "deterministic"
                    )
                  }
                  data-testid={`switch-ai-provider-${prov.id}`}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                    isCurrent
                      ? "bg-indigo-950/60 border-indigo-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{prov.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                      {isCurrent ? "Active" : "Select"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Model: {prov.model}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Single-Use / Expiring Invitation Codes */}
        <section className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Single-Use & Expiring Invitation Codes</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate invitation codes with assigned RBAC roles, optional email locks, and expiration windows.
            </p>
          </div>

          <form
            onSubmit={handleCreateInvitation}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 rounded-xl bg-slate-900/90 border border-slate-800"
          >
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Lock to Email (optional)
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="designer@company.com"
                data-testid="invite-email-input"
                className="w-full px-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "Admin" | "Editor" | "Viewer")
                }
                data-testid="invite-role-select"
                className="w-full px-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-xs text-white"
              >
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Expires In (Hours)</label>
              <input
                type="number"
                min={1}
                max={720}
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                data-testid="invite-expiry-input"
                className="w-full px-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={creatingInvite}
              data-testid="create-invitation-btn"
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{creatingInvite ? "Issuing..." : "Generate Invite Code"}</span>
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Email Lock</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Expires</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {invitations.map((inv) => (
                  <tr key={inv.id} data-testid={`invite-row-${inv.code}`}>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                      {inv.code}
                    </td>
                    <td className="py-2.5 px-3">{inv.invitedRole}</td>
                    <td className="py-2.5 px-3 text-slate-400">{inv.email || "Any email"}</td>
                    <td className="py-2.5 px-3">
                      <span
                        data-testid={`invite-status-${inv.code}`}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          inv.effectiveStatus === "PENDING"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : inv.effectiveStatus === "USED"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {inv.effectiveStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(inv.code);
                          setCopiedCode(inv.code);
                          setTimeout(() => setCopiedCode(null), 1500);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 inline-flex items-center gap-1"
                      >
                        {copiedCode === inv.code ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                      {inv.effectiveStatus === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id)}
                          data-testid={`revoke-invite-${inv.code}`}
                          className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 inline-flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: User RBAC Roles & Immediate Account Revocation */}
        <section className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Workspace Accounts, RBAC Roles & Immediate Revocation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Modify user roles (`Admin`, `Editor`, `Viewer`) or revoke access immediately.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3 text-right">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {users.map((u) => (
                  <tr key={u.id} data-testid={`admin-user-row-${u.email}`}>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{u.name || u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                        data-testid={`user-role-select-${u.email}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        data-testid={`user-status-${u.email}`}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{u.creditsRemaining}</td>
                    <td className="py-2.5 px-3 text-right">
                      {u.email !== data?.user?.email && (
                        <>
                          {u.status === "ACTIVE" ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateUser(u.id, { action: "revoke" })}
                              data-testid={`revoke-user-btn-${u.email}`}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold inline-flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Revoke Access</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateUser(u.id, { action: "restore" })}
                              data-testid={`restore-user-btn-${u.email}`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Immutable Security & Operational Audit Log */}
        <section className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-400" />
                <span>Immutable Audit Log ({auditLogs.length} events)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracks invitations, registrations, role changes, revocations, AI generations, and site publications.
              </p>
            </div>
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action (e.g. invitation, ai, user)..."
              data-testid="audit-log-filter-input"
              className="px-3 py-1.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white w-64"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="audit-log-list">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                      {log.action}
                    </span>
                    <span className="text-white font-medium">{log.summary}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Actor: {log.actorEmail || "system"} ({log.actorRole || "System"}) • Target:{" "}
                    {log.targetType}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
