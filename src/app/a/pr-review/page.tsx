"use client";

import React, { useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import { GitPullRequest, Play, CheckCircle2, AlertTriangle, Code2 } from "lucide-react";

export default function PrReviewPage() {
  const { data, loading, refresh } = useWorkspace();

  const [repoFullName, setRepoFullName] = useState("acme-corp/fintech-web");
  const [prNumber, setPrNumber] = useState("158");
  const [prTitle, setPrTitle] = useState("feat(checkout): biometric passkey modal & responsive drawer");
  const [branchName, setBranchName] = useState("feat/biometric-passkey");
  const [running, setRunning] = useState(false);

  const canEdit = data?.user?.role === "Admin" || data?.user?.role === "Editor";
  const prRuns = data?.prRuns || [];

  const handleRunPrCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      const res = await fetch("/api/pr-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName,
          prNumber: Number(prNumber),
          prTitle,
          branchName,
        }),
      });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>GitHub App • Automated PR Design & Accessibility Gate</span>
            </span>
            <h1 className="text-2xl font-extrabold text-white">
              Automated GitHub Pull Request UX Review
            </h1>
          </div>
        </div>

        {/* Trigger PR UX Check */}
        {canEdit && (
          <form
            onSubmit={handleRunPrCheck}
            className="p-5 rounded-2xl bg-[#111827] border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                GitHub Repository
              </label>
              <input
                type="text"
                required
                value={repoFullName}
                onChange={(e) => setRepoFullName(e.target.value)}
                data-testid="pr-repo-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">PR Number</label>
              <input
                type="number"
                required
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                data-testid="pr-number-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">PR Title</label>
              <input
                type="text"
                required
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                data-testid="pr-title-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={running}
              data-testid="run-pr-review-btn"
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{running ? "Scanning PR Diff..." : "Run PR UX & Token Audit"}</span>
            </button>
          </form>
        )}

        {/* PR Review Runs List */}
        <div className="space-y-4">
          {prRuns.map((pr) => (
            <div
              key={pr.id}
              data-testid={`pr-run-card-${pr.id}`}
              className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-400 font-semibold">
                      {pr.repoFullName} #{pr.prNumber}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {pr.branchName}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{pr.prTitle}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>UX Score: {pr.score}/100</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300">{pr.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pr.findings.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-indigo-300 flex items-center gap-1 truncate">
                        <Code2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {f.file}:{f.line}
                        </span>
                      </span>
                      <span className="uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-semibold">
                        {f.rule}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {f.comment ||
                          (f as unknown as { message?: string }).message ||
                          "Design system compliance notice"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
