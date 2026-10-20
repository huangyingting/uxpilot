"use client";

import React, { useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import { ScanEye, Play, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

export default function UxDesignReviewPage() {
  const { data, loading, refresh } = useWorkspace();
  const [selectedReviewIdx, setSelectedReviewIdx] = useState(0);
  const [overlayTab, setOverlayTab] = useState<"heatmap" | "scanpath" | "gazeflow">("heatmap");
  const [reviewTitle, setReviewTitle] = useState("Mobile Checkout & Biometric Confirmation");
  const [reviewGoal, setReviewGoal] = useState(
    "Reduce drop-off at payment confirmation and ensure WCAG AA contrast"
  );
  const [running, setRunning] = useState(false);

  const canEdit = data?.user?.role === "Admin" || data?.user?.role === "Editor";
  const reviews = data?.reviews || [];
  const activeReview = reviews[selectedReviewIdx] || reviews[0] || null;

  const handleRunNewReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reviewTitle,
          reviewGoal,
          htmlContent: `<div style="padding:32px;background:#0f172a;color:#fff"><h1>${reviewTitle}</h1><button>Complete Payment</button></div>`,
        }),
      });
      if (res.ok) {
        await refresh();
        setSelectedReviewIdx(0);
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
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
              <ScanEye className="w-3.5 h-3.5" />
              <span>Predictive Eye-Tracking & Heuristic Lab</span>
            </span>
            <h1 className="text-2xl font-extrabold text-white">
              AI UX Design Review & Attention Heatmaps
            </h1>
          </div>
        </div>

        {canEdit && (
          <form
            onSubmit={handleRunNewReview}
            className="p-5 rounded-2xl bg-[#111827] border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Screen or Flow Title
              </label>
              <input
                type="text"
                required
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                data-testid="ux-review-title-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                UX Optimization Goal
              </label>
              <input
                type="text"
                value={reviewGoal}
                onChange={(e) => setReviewGoal(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={running}
              data-testid="launch-ux-review-btn"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{running ? "Analyzing Screen..." : "Run Predictive UX Audit"}</span>
            </button>
          </form>
        )}

        {activeReview && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white" data-testid="active-review-title">
                  {activeReview.title}
                </h2>
                <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  {(["heatmap", "scanpath", "gazeflow"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setOverlayTab(tab)}
                      data-testid={`review-tab-${tab}`}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                        overlayTab === tab ? "bg-purple-600 text-white" : "text-slate-400"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div
                data-testid="review-visual-stage"
                className="relative h-96 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0d1322] to-indigo-950/60 border border-slate-800 overflow-hidden p-6 flex flex-col justify-between"
              >
                <div className="space-y-4 opacity-55">
                  <div className="h-8 w-64 rounded-lg bg-slate-800" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 rounded-xl bg-indigo-900/40 border border-indigo-500/30" />
                    <div className="h-24 rounded-xl bg-slate-800/70" />
                    <div className="h-24 rounded-xl bg-slate-800/70" />
                  </div>
                  <div className="h-36 rounded-xl bg-slate-900 border border-slate-800" />
                </div>

                {overlayTab === "heatmap" &&
                  activeReview.heatmapPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      style={{
                        left: `${pt.x}%`,
                        top: `${pt.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className="absolute w-36 h-36 rounded-full bg-rose-500/45 blur-md border border-rose-400/50 flex items-center justify-center"
                    >
                      <span className="text-[11px] font-bold text-white bg-black/80 px-2 py-0.5 rounded-full">
                        {pt.label} • {Math.round(pt.intensity * 100)}%
                      </span>
                    </div>
                  ))}

                {overlayTab === "scanpath" &&
                  activeReview.scanpath.map((sp) => (
                    <div
                      key={sp.step}
                      style={{
                        left: `${sp.x}%`,
                        top: `${sp.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className="absolute flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white text-white font-extrabold text-xs flex items-center justify-center shadow-lg">
                        {sp.step}
                      </div>
                      <span className="text-xs font-semibold bg-slate-900/95 text-white px-2.5 py-1 rounded-lg border border-slate-700">
                        {sp.label} ({sp.dwellMs}ms)
                      </span>
                    </div>
                  ))}

                {overlayTab === "gazeflow" && (
                  <div className="relative z-10 p-4 rounded-xl bg-slate-900/95 border border-slate-700 space-y-3">
                    <div className="text-xs font-bold text-white">
                      Regional Attention Distribution
                    </div>
                    {activeReview.gazeFlow.map((gf) => (
                      <div key={gf.area} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>{gf.area}</span>
                          <span className="font-bold text-purple-300">{gf.attentionPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-400"
                            style={{ width: `${gf.attentionPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Overall UX Heuristic Score</div>
                    <div
                      data-testid="review-overall-score"
                      className="text-3xl font-extrabold text-white"
                    >
                      {activeReview.overallScore} / 100
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>High Clarity</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Visual Hierarchy</span>
                    <span className="text-base font-bold text-white">
                      {activeReview.metrics.visualHierarchyScore}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">WCAG Accessibility</span>
                    <span className="text-base font-bold text-white">
                      {activeReview.metrics.accessibilityScore}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Heuristic Findings ({activeReview.findings.length})
                  </h3>
                  {activeReview.findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>{f.title}</span>
                        </span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{f.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Recent Review Runs ({reviews.length})</span>
                </div>
                <div className="space-y-1">
                  {reviews.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReviewIdx(i)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                        i === selectedReviewIdx
                          ? "bg-purple-500/20 text-white border border-purple-500/40"
                          : "text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      <span className="truncate">{r.title}</span>
                      <span className="font-bold text-emerald-300">{r.overallScore}/100</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
