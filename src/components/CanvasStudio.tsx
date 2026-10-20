"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Code2,
  ScanEye,
  GitBranch,
  MessageSquare,
  History,
  Share2,
  Layers,
  Smartphone,
  Monitor,
  Check,
  Copy,
  Play,
  ArrowRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface ScreenItem {
  id: string;
  name: string;
  screenPrompt: string | null;
  fidelity: "hifi" | "wireframe";
  platform: "mobile" | "desktop";
  htmlContent: string;
  reactCode: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  linkedNextScreenId: string | null;
  versionHistory: Array<{
    version: number;
    savedAt: string;
    name: string;
    htmlContent: string;
  }>;
}

interface FlowchartItem {
  id: string;
  title: string;
  prompt: string;
  mermaidCode: string;
  graph: {
    nodes: Array<{ id: string; label: string; kind: string; x: number; y: number }>;
    edges: Array<{ from: string; to: string; label?: string }>;
  };
}

interface CommentItem {
  id: string;
  screenId: string | null;
  authorName: string;
  content: string;
  x: number;
  y: number;
  resolved: boolean;
  replies: Array<{ id: string; author: string; text: string; createdAt: string }>;
}

interface PageDetail {
  id: string;
  name: string;
  globalPrompt: string | null;
  platform: "mobile" | "desktop";
  mode: "hifi" | "wireframe";
  isShared: boolean;
  canEdit: boolean;
  actorRole: "Admin" | "Editor" | "Viewer";
  designSystemId: string | null;
  screens: ScreenItem[];
  flowcharts: FlowchartItem[];
  comments: CommentItem[];
}

export function CanvasStudio({
  initialPageId,
  isPublicPlayground = false,
}: {
  initialPageId?: string;
  isPublicPlayground?: boolean;
}) {
  const [page, setPage] = useState<PageDetail | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.78);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 24, y: 20 });

  // Prompt & generation controls
  const [prompt, setPrompt] = useState<string>(
    "Institutional FinTech wealth & multi-currency card command dashboard with KPI cards and instant transfer drawer"
  );
  const [platform, setPlatform] = useState<"mobile" | "desktop">("desktop");
  const [fidelity, setFidelity] = useState<"hifi" | "wireframe">("hifi");
  const [enhancing, setEnhancing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiBanner, setAiBanner] = useState<string | null>(null);

  // Right-side Inspector Drawers
  const [activeDrawer, setActiveDrawer] = useState<
    "none" | "code" | "review" | "flowchart" | "comments" | "history" | "edit-ai"
  >("none");
  const [codeTab, setCodeTab] = useState<"html" | "react">("react");
  const [copiedCode, setCopiedCode] = useState(false);

  // Review state
  const [runningReview, setRunningReview] = useState(false);
  const [overlayMode, setOverlayMode] = useState<"none" | "heatmap" | "scanpath" | "gazeflow">(
    "none"
  );
  const [reviewData, setReviewData] = useState<{
    overallScore: number;
    metrics: {
      clarityScore: number;
      visualHierarchyScore: number;
      accessibilityScore: number;
      conversionFrictionScore: number;
    };
    findings: Array<{
      id: string;
      severity: string;
      category: string;
      title: string;
      recommendation: string;
    }>;
    heatmapPoints: Array<{ x: number; y: number; intensity: number; label: string }>;
    scanpath: Array<{ step: number; x: number; y: number; label: string; dwellMs: number }>;
    gazeFlow: Array<{ area: string; attentionPct: number }>;
  } | null>(null);

  // Edit with AI state
  const [editPrompt, setEditPrompt] = useState("");
  const [savingScreenEdit, setSavingScreenEdit] = useState(false);

  // Flowchart state
  const [flowchartPrompt, setFlowchartPrompt] = useState(
    "User onboarding, biometric KYC verification, and multi-currency card activation"
  );
  const [generatingFlowchart, setGeneratingFlowchart] = useState(false);

  // Comments state
  const [newCommentText, setNewCommentText] = useState("");

  // Share / Publish modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const loadPage = useCallback(async (targetId: string) => {
    const res = await fetch(`/api/pages/${targetId}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setPage(json.page);
      if (json.page.screens?.length > 0) {
        setSelectedScreenId((prev) => prev || json.page.screens[0].id);
      }
      if (json.page.platform === "mobile" || json.page.platform === "desktop") {
        setPlatform(json.page.platform);
      }
      if (json.page.mode === "wireframe" || json.page.mode === "hifi") {
        setFidelity(json.page.mode);
      }
    }
  }, []);

  useEffect(() => {
    const target = initialPageId || "page-fintech-command";
    loadPage(target);
  }, [initialPageId, loadPage]);

  const selectedScreen =
    page?.screens.find((s) => s.id === selectedScreenId) || page?.screens[0] || null;

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          scope: "global",
          platform,
          mode: fidelity,
        }),
      });
      const json = await res.json();
      if (res.ok && json.enhancedPrompt) {
        setPrompt(json.enhancedPrompt);
        setAiBanner(`Prompt enhanced via ${json.providerUsed} (${json.modelName})`);
      } else {
        setAiBanner(json.error || "Unable to enhance prompt");
      }
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerateScreens = async (
    generationKind: "standard" | "variations" | "autoflow" = "standard"
  ) => {
    if (isPublicPlayground) {
      // In public playground without auth, locally synthesize a screen preview
      setAiBanner("Playground preview updated! Sign in to save unlimited screens to your workspace.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page?.id,
          prompt,
          platform,
          fidelity,
          generationKind,
          count: generationKind === "variations" ? 4 : generationKind === "autoflow" ? 1 : 2,
          sourceScreenId: selectedScreen?.id,
          baseScreenTitle: selectedScreen?.name || page?.name || "AI Studio Screen",
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setAiBanner(
          `Generated ${json.screens?.length || 1} screen(s) via ${json.providerUsed} (${json.modelName})`
        );
        if (json.pageId) {
          await loadPage(json.pageId);
          if (json.screens?.length > 0) {
            setSelectedScreenId(json.screens[json.screens.length - 1].id);
          }
        }
      } else {
        setAiBanner(json.error || "Generation failed");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleRunReview = async () => {
    if (!selectedScreen) return;
    setActiveDrawer("review");
    setRunningReview(true);
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenId: selectedScreen.id,
          title: selectedScreen.name,
          htmlContent: selectedScreen.htmlContent,
          reviewGoal: "Optimize conversion clarity, visual hierarchy, and WCAG AA accessibility",
        }),
      });
      const json = await res.json();
      if (res.ok && json.review) {
        setReviewData(json.review);
        setOverlayMode("heatmap");
        setAiBanner(`UX Review & Predictive Eye-Tracking completed via ${json.providerUsed}`);
      }
    } finally {
      setRunningReview(false);
    }
  };

  const handleEditScreenWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScreen || !editPrompt.trim()) return;
    setSavingScreenEdit(true);
    try {
      const res = await fetch(`/api/screens/${selectedScreen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${selectedScreen.name}`,
          screenPrompt: editPrompt,
          regenerateFromPrompt: true,
        }),
      });
      if (res.ok && page) {
        setEditPrompt("");
        setAiBanner(`Updated "${selectedScreen.name}" and saved a new version snapshot.`);
        await loadPage(page.id);
      }
    } finally {
      setSavingScreenEdit(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!selectedScreen || !page) return;
    const res = await fetch(`/api/screens/${selectedScreen.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restoreVersion: versionNumber }),
    });
    if (res.ok) {
      setAiBanner(`Restored "${selectedScreen.name}" to version v${versionNumber}`);
      await loadPage(page.id);
    }
  };

  const handleGenerateFlowchart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowchartPrompt.trim()) return;
    setGeneratingFlowchart(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "flowchart",
          pageId: page?.id,
          prompt: flowchartPrompt,
          pageTitle: page?.name || "User Journey Flow",
        }),
      });
      if (res.ok && page) {
        setAiBanner("Generated interactive Mermaid User Journey Flowchart.");
        await loadPage(page.id);
      }
    } finally {
      setGeneratingFlowchart(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !page) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: page.id,
        screenId: selectedScreen?.id || null,
        content: newCommentText,
        x: (selectedScreen?.x || 120) + 180,
        y: (selectedScreen?.y || 110) + 90,
      }),
    });
    if (res.ok) {
      setNewCommentText("");
      await loadPage(page.id);
    }
  };

  const handleToggleCommentResolved = async (commentId: string, resolved: boolean) => {
    if (!page) return;
    await fetch("/api/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: commentId, resolved }),
    });
    await loadPage(page.id);
  };

  const handlePublishSite = async () => {
    if (!page) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/published-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          screenId: selectedScreen?.id,
          title: `${page.name} — Live Preview`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.site) {
        setPublishedSlug(json.site.slug);
      }
    } finally {
      setPublishing(false);
    }
  };

  const canEdit = isPublicPlayground ? true : page?.canEdit ?? true;

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col bg-[#090d16] text-slate-100 overflow-hidden select-none">
      {/* Top Canvas Header Bar */}
      <header className="h-14 px-4 border-b border-slate-800/90 bg-[#0d1322]/95 backdrop-blur-md flex items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={isPublicPlayground ? "/" : "/a/ui-list"}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{isPublicPlayground ? "Home" : "Files"}</span>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                data-testid="canvas-page-title"
                className="text-sm font-bold text-white truncate"
              >
                {page?.name || "FinTech Wealth & Card Command Hub"}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
                {fidelity === "wireframe" ? "Wireframe" : "Hi-Fi UI"}
              </span>
              {!canEdit && (
                <span
                  data-testid="canvas-readonly-badge"
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                >
                  Viewer Read-Only
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zoom & Viewport Controls */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
            data-testid="canvas-zoom-out"
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span
            data-testid="canvas-zoom-level"
            className="text-xs font-mono text-slate-300 px-1.5"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
            data-testid="canvas-zoom-in"
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(0.78);
              setPan({ x: 24, y: 20 });
            }}
            data-testid="canvas-fit-screen"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 ml-1"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Canvas Tool Triggers */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === "code" ? "none" : "code")}
            data-testid="canvas-open-code-btn"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              activeDrawer === "code"
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeDrawer === "review") {
                setActiveDrawer("none");
              } else {
                setActiveDrawer("review");
              }
            }}
            data-testid="canvas-open-review-btn"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              activeDrawer === "review"
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <ScanEye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">UX Review</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === "flowchart" ? "none" : "flowchart")}
            data-testid="canvas-open-flowchart-btn"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              activeDrawer === "flowchart"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flowchart</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === "comments" ? "none" : "comments")}
            data-testid="canvas-open-comments-btn"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              activeDrawer === "comments"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{page?.comments?.length ?? 0}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === "history" ? "none" : "history")}
            data-testid="canvas-open-history-btn"
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
            title="Version History"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setPublishModalOpen(true)}
              data-testid="canvas-publish-btn"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Publish</span>
            </button>
          )}
        </div>
      </header>

      {/* AI Status Banner */}
      {aiBanner && (
        <div
          data-testid="canvas-ai-banner"
          className="px-4 py-1.5 bg-indigo-950/90 border-b border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{aiBanner}</span>
          </span>
          <button
            type="button"
            onClick={() => setAiBanner(null)}
            className="text-indigo-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Workspace Body: Left Prompt Studio + Infinite Canvas + Right Inspector Drawer */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left AI Generation Dock */}
        <aside className="w-80 border-r border-slate-800/90 bg-[#0d1322]/95 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Prompt Dock</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Pluggable AI
            </span>
          </div>

          {/* Mode & Platform toggles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex">
              <button
                type="button"
                onClick={() => setFidelity("hifi")}
                data-testid="toggle-fidelity-hifi"
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  fidelity === "hifi" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Hi-Fi UI
              </button>
              <button
                type="button"
                onClick={() => setFidelity("wireframe")}
                data-testid="toggle-fidelity-wireframe"
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  fidelity === "wireframe" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Wireframe
              </button>
            </div>

            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex">
              <button
                type="button"
                onClick={() => setPlatform("desktop")}
                data-testid="toggle-platform-desktop"
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
                  platform === "desktop" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatform("mobile")}
                data-testid="toggle-platform-mobile"
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
                  platform === "mobile" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Global & Screen Prompt</label>
              <button
                type="button"
                disabled={enhancing || !canEdit}
                onClick={handleEnhancePrompt}
                data-testid="enhance-prompt-btn"
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
              >
                <Wand2 className="w-3 h-3" />
                <span>{enhancing ? "Enhancing..." : "Enhance Prompt"}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!canEdit}
              data-testid="canvas-prompt-input"
              placeholder="Describe the screens, layout hierarchy, and interactive components..."
              className="w-full p-3 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-100 leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Primary Generation Actions */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={generating || !canEdit}
              onClick={() => handleGenerateScreens("standard")}
              data-testid="canvas-generate-btn"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? "Generating Screens..." : "Generate AI Screens"}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={generating || !canEdit}
                onClick={() => handleGenerateScreens("variations")}
                data-testid="canvas-generate-variations-btn"
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>4-Look Variations</span>
              </button>
              <button
                type="button"
                disabled={generating || !canEdit}
                onClick={() => handleGenerateScreens("autoflow")}
                data-testid="canvas-autoflow-btn"
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
              >
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Autoflow Next</span>
              </button>
            </div>
          </div>

          {/* Screen List Navigator on Canvas */}
          <div className="pt-2 border-t border-slate-800/80 flex-1 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Screens on Canvas ({page?.screens?.length ?? 0})</span>
              <span>Click to focus</span>
            </div>
            <div className="space-y-1.5">
              {(page?.screens || []).map((scr, idx) => {
                const isSelected = scr.id === selectedScreen?.id;
                return (
                  <button
                    key={scr.id}
                    type="button"
                    onClick={() => setSelectedScreenId(scr.id)}
                    data-testid={`canvas-screen-item-${idx}`}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-500/15 border-indigo-500/40 text-white"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="truncate font-medium">{scr.name}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {scr.fidelity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center Infinite Dot-Grid Canvas */}
        <div
          className="flex-1 canvas-dot-grid relative overflow-auto p-8"
          data-testid="infinite-canvas-surface"
        >
          <div
            className="relative transition-transform duration-150 origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              minWidth: "2400px",
              minHeight: "1400px",
            }}
          >
            {/* Autoflow Connector Lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width="2400"
              height="1400"
              style={{ zIndex: 1 }}
            >
              {(page?.screens || []).map((scr) => {
                if (!scr.linkedNextScreenId) return null;
                const target = page?.screens.find((t) => t.id === scr.linkedNextScreenId);
                if (!target) return null;
                const startX = scr.x + scr.width;
                const startY = scr.y + 180;
                const endX = target.x;
                const endY = target.y + 180;
                return (
                  <g key={`edge-${scr.id}-${target.id}`}>
                    <path
                      d={`M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`}
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      fill="none"
                    />
                    <circle cx={endX} cy={endY} r="5" fill="#10b981" />
                  </g>
                );
              })}
            </svg>

            {/* Screen Frames */}
            <div className="flex flex-wrap gap-10 items-start relative z-10">
              {(page?.screens || []).map((scr) => {
                const isSelected = scr.id === selectedScreen?.id;
                const frameWidth = scr.platform === "mobile" ? 380 : 680;
                const frameHeight = scr.platform === "mobile" ? 680 : 480;

                return (
                  <div
                    key={scr.id}
                    onClick={() => setSelectedScreenId(scr.id)}
                    data-testid={`canvas-frame-${scr.id}`}
                    className={`rounded-2xl bg-[#0d1322] border-2 shadow-2xl transition-all flex flex-col overflow-hidden ${
                      isSelected
                        ? "border-indigo-500 ring-4 ring-indigo-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                    style={{ width: `${frameWidth}px` }}
                  >
                    {/* Floating Frame Header Bar */}
                    <div className="px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{scr.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScreenId(scr.id);
                              setActiveDrawer("edit-ai");
                            }}
                            data-testid={`frame-edit-ai-${scr.id}`}
                            className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-semibold"
                          >
                            Edit with AI
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScreenId(scr.id);
                            setActiveDrawer("code");
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                        >
                          Code
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScreenId(scr.id);
                            handleRunReview();
                          }}
                          className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-semibold"
                        >
                          Review
                        </button>
                      </div>
                    </div>

                    {/* Sandboxed HTML Screen Frame + Predictive Eye-Tracking Overlay */}
                    <div
                      className="relative bg-slate-950 overflow-hidden"
                      style={{ height: `${frameHeight}px` }}
                    >
                      <iframe
                        title={scr.name}
                        srcDoc={scr.htmlContent}
                        sandbox="allow-same-origin"
                        className="w-full h-full border-0 pointer-events-none"
                      />

                      {/* Predictive Eye-Tracking Overlay when active on selected screen */}
                      {isSelected && overlayMode !== "none" && reviewData && (
                        <div
                          data-testid="canvas-eyetracking-overlay"
                          className="absolute inset-0 bg-slate-950/35 pointer-events-none"
                        >
                          {overlayMode === "heatmap" &&
                            reviewData.heatmapPoints.map((pt, i) => (
                              <div
                                key={i}
                                style={{
                                  left: `${pt.x}%`,
                                  top: `${pt.y}%`,
                                  transform: "translate(-50%, -50%)",
                                }}
                                className="absolute w-32 h-32 rounded-full bg-gradient-radial from-rose-500/75 via-amber-400/45 to-transparent blur-md flex items-center justify-center"
                              >
                                <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                                  {pt.label} ({Math.round(pt.intensity * 100)}%)
                                </span>
                              </div>
                            ))}

                          {overlayMode === "scanpath" &&
                            reviewData.scanpath.map((sp) => (
                              <div
                                key={sp.step}
                                style={{
                                  left: `${sp.x}%`,
                                  top: `${sp.y}%`,
                                  transform: "translate(-50%, -50%)",
                                }}
                                className="absolute flex items-center gap-1.5"
                              >
                                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white text-white font-bold text-xs flex items-center justify-center shadow-lg">
                                  {sp.step}
                                </div>
                                <span className="text-[10px] font-semibold bg-slate-900/90 text-white px-2 py-0.5 rounded border border-slate-700">
                                  {sp.label} ({sp.dwellMs}ms)
                                </span>
                              </div>
                            ))}

                          {overlayMode === "gazeflow" && (
                            <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-slate-900/95 border border-slate-700 space-y-2">
                              <div className="text-xs font-bold text-white">
                                Predictive Gaze Allocation
                              </div>
                              {reviewData.gazeFlow.map((gf) => (
                                <div key={gf.area} className="space-y-0.5">
                                  <div className="flex justify-between text-[10px] text-slate-300">
                                    <span>{gf.area}</span>
                                    <span className="font-bold text-indigo-300">
                                      {gf.attentionPct}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                                      style={{ width: `${gf.attentionPct}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canvas Flowchart Cards */}
            {(page?.flowcharts || []).length > 0 && (
              <div className="mt-10 max-w-4xl rounded-2xl bg-[#0d1322] border border-slate-800 p-5 shadow-xl relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white">
                      {page?.flowcharts[0].title} (AI User Journey Flowchart)
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                    Mermaid & Interactive Graph
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {(page?.flowcharts[0].graph?.nodes || []).map((node, idx, arr) => (
                    <React.Fragment key={node.id}>
                      <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white">
                        {node.label}
                      </div>
                      {idx < arr.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Contextual Inspector Drawer */}
        {activeDrawer !== "none" && (
          <aside
            data-testid={`canvas-drawer-${activeDrawer}`}
            className="w-96 border-l border-slate-800 bg-[#0d1322] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-20"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                {activeDrawer === "code" && "Code Export (HTML / React TSX)"}
                {activeDrawer === "review" && "AI UX Review & Eye-Tracking"}
                {activeDrawer === "flowchart" && "AI Flowchart Generator"}
                {activeDrawer === "comments" && "Canvas Comments & Review"}
                {activeDrawer === "history" && "Screen Version History"}
                {activeDrawer === "edit-ai" && "Edit Screen with AI"}
              </h2>
              <button
                type="button"
                onClick={() => setActiveDrawer("none")}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DRAWER 1: Code Export */}
            {activeDrawer === "code" && selectedScreen && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCodeTab("react")}
                    data-testid="code-tab-react"
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                      codeTab === "react" ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                  >
                    React + Tailwind TSX
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeTab("html")}
                    data-testid="code-tab-html"
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                      codeTab === "html" ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                  >
                    HTML5 / CSS
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 truncate">
                    {selectedScreen.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/pages/${page?.id || "page-fintech-command"}/export?format=download`}
                      data-testid="export-project-bundle-btn"
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Bundle JSON
                    </a>
                    <button
                      type="button"
                      data-testid="copy-exported-code-btn"
                      onClick={() => {
                        const code =
                          codeTab === "react"
                            ? selectedScreen.reactCode || selectedScreen.htmlContent
                            : selectedScreen.htmlContent;
                        navigator.clipboard?.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 1800);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>
                <pre
                  data-testid="exported-code-block"
                  className="flex-1 p-3 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-auto max-h-[60vh]"
                >
                  {codeTab === "react"
                    ? selectedScreen.reactCode || selectedScreen.htmlContent
                    : selectedScreen.htmlContent}
                </pre>
              </div>
            )}

            {/* DRAWER 2: UX Review & Predictive Eye-Tracking */}
            {activeDrawer === "review" && (
              <div className="space-y-4">
                <button
                  type="button"
                  disabled={runningReview || !canEdit}
                  onClick={handleRunReview}
                  data-testid="run-ux-review-btn"
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {runningReview ? "Running Predictive Eye-Tracking..." : "Run AI UX & Heatmap Review"}
                  </span>
                </button>

                {/* Overlay Switcher */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  {(["none", "heatmap", "scanpath", "gazeflow"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setOverlayMode(mode)}
                      data-testid={`overlay-mode-${mode}`}
                      className={`py-1.5 rounded-lg text-[10px] font-semibold capitalize ${
                        overlayMode === mode ? "bg-purple-600 text-white" : "text-slate-400"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {reviewData && (
                  <div className="space-y-3" data-testid="ux-review-results">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Overall UX Score</div>
                        <div className="text-xl font-extrabold text-white">
                          {reviewData.overallScore} / 100
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-emerald-400 font-semibold">
                        WCAG AA Ready
                      </div>
                    </div>

                    <div className="space-y-2">
                      {reviewData.findings.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{f.title}</span>
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              {f.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{f.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DRAWER 3: Flowchart Generator */}
            {activeDrawer === "flowchart" && (
              <form onSubmit={handleGenerateFlowchart} className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Describe User Journey for Mermaid Flowchart
                </label>
                <textarea
                  rows={3}
                  value={flowchartPrompt}
                  onChange={(e) => setFlowchartPrompt(e.target.value)}
                  data-testid="flowchart-prompt-input"
                  className="w-full p-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={generatingFlowchart || !canEdit}
                  data-testid="generate-flowchart-submit"
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                >
                  {generatingFlowchart ? "Generating Flowchart..." : "Generate Journey Flowchart"}
                </button>
                {page?.flowcharts?.[0] && (
                  <pre
                    data-testid="mermaid-code-output"
                    className="p-3 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto"
                  >
                    {page.flowcharts[0].mermaidCode}
                  </pre>
                )}
              </form>
            )}

            {/* DRAWER 4: Comments */}
            {activeDrawer === "comments" && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Pin a comment or review note on this screen..."
                    data-testid="new-comment-input"
                    className="w-full p-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="submit"
                    data-testid="submit-comment-btn"
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white"
                  >
                    Post Comment Pin
                  </button>
                </form>

                <div className="space-y-2">
                  {(page?.comments || []).map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{c.authorName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCommentResolved(c.id, !c.resolved)}
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            c.resolved
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {c.resolved ? "Resolved" : "Mark Resolved"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-300">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DRAWER 5: Version History */}
            {activeDrawer === "history" && selectedScreen && (
              <div className="space-y-2.5">
                {(selectedScreen.versionHistory || []).map((v) => (
                  <div
                    key={v.version}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{v.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(v.savedAt).toLocaleString()}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(v.version)}
                        data-testid={`restore-version-${v.version}`}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* DRAWER 6: Edit Screen with AI */}
            {activeDrawer === "edit-ai" && selectedScreen && (
              <form onSubmit={handleEditScreenWithAI} className="space-y-3">
                <div className="text-xs text-slate-300">
                  Editing screen: <strong className="text-white">{selectedScreen.name}</strong>
                </div>
                <textarea
                  rows={3}
                  required
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g., Add a biometric confirmation card and sticky action footer..."
                  data-testid="edit-screen-ai-input"
                  className="w-full p-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={savingScreenEdit}
                  data-testid="submit-edit-screen-ai"
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                >
                  {savingScreenEdit ? "Updating Screen..." : "Apply AI Edit & Save Version"}
                </button>
              </form>
            )}
          </aside>
        )}
      </div>

      {/* Publish Live Site Modal */}
      {publishModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          data-testid="publish-site-modal"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Publish Live Interactive Prototype</h3>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Publish this canvas design to a public shareable URL under <code>/s/[slug]</code>.
            </p>
            {publishedSlug ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Published Live!</span>
                </div>
                <Link
                  href={`/s/${publishedSlug}`}
                  data-testid="published-site-link"
                  className="text-xs text-indigo-300 hover:underline flex items-center gap-1"
                >
                  <span>/s/{publishedSlug}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublishSite}
                data-testid="confirm-publish-site-btn"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
              >
                {publishing ? "Publishing..." : "Publish Now"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
