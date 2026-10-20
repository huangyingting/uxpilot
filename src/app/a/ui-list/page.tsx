"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  Sparkles,
  Wand2,
  Bookmark,
  Search,
  Monitor,
  Smartphone,
  Trash2,
  FolderKanban,
  ArrowUpRight,
  Layers,
  MessageSquare,
} from "lucide-react";

export default function UiListPage() {
  const router = useRouter();
  const { data, loading, refresh } = useWorkspace();

  const [heroMode, setHeroMode] = useState<"hifi" | "wireframe" | "review">("hifi");
  const [heroPlatform, setHeroPlatform] = useState<"desktop" | "mobile">("desktop");
  const [heroDesignSystemId, setHeroDesignSystemId] = useState<string>("");
  const [heroPrompt, setHeroPrompt] = useState<string>("");
  const [enhancing, setEnhancing] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "mine" | "shared" | "bookmarked">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const canEdit = data?.user?.role === "Admin" || data?.user?.role === "Editor";

  const handleEnhance = async () => {
    if (!heroPrompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: heroPrompt,
          scope: "global",
          platform: heroPlatform,
          mode: heroMode === "wireframe" ? "wireframe" : "hifi",
        }),
      });
      const json = await res.json();
      if (res.ok && json.enhancedPrompt) {
        setHeroPrompt(json.enhancedPrompt);
      }
    } finally {
      setEnhancing(false);
    }
  };

  const handleHeroGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (heroMode === "review") {
      router.push("/a/ux-design-review");
      return;
    }
    const promptToUse =
      heroPrompt.trim() || "Enterprise AI Analytics & Revenue Forecasting Workspace";
    setCreatingPage(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: promptToUse.slice(0, 44),
          prompt: promptToUse,
          platform: heroPlatform,
          mode: heroMode,
          designSystemId: heroDesignSystemId || null,
          screenCount: 2,
        }),
      });
      const json = await res.json();
      if (res.ok && json.pageId) {
        router.push(`/a/ui-design?pageId=${json.pageId}`);
      }
    } finally {
      setCreatingPage(false);
    }
  };

  const handleToggleBookmark = async (pageId: string, current: boolean) => {
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBookmarked: !current }),
    });
    refresh();
  };

  const handleDeletePage = async (pageId: string) => {
    await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
    refresh();
  };

  const filteredPages = (data?.pages || []).filter((p) => {
    if (activeTab === "bookmarked" && !p.isBookmarked) return false;
    if (activeTab === "shared" && !p.isShared) return false;
    if (
      searchQuery.trim() &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(p.globalPrompt || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Hero Prompt Creation Studio */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-[#111827] to-purple-950/40 border border-indigo-500/25 p-6 lg:p-8 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Design & Wireframe Studio</span>
              </span>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                What would you like to design today?
              </h1>
            </div>

            {/* Mode Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setHeroMode("hifi")}
                data-testid="hero-mode-hifi"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  heroMode === "hifi"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                UI Design
              </button>
              <button
                type="button"
                onClick={() => setHeroMode("wireframe")}
                data-testid="hero-mode-wireframe"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  heroMode === "wireframe"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Wireframes
              </button>
              <button
                type="button"
                onClick={() => setHeroMode("review")}
                data-testid="hero-mode-review"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  heroMode === "review"
                    ? "bg-purple-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Design Review
              </button>
            </div>
          </div>

          <form onSubmit={handleHeroGenerate} className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={heroPrompt}
                onChange={(e) => setHeroPrompt(e.target.value)}
                disabled={!canEdit}
                data-testid="hero-prompt-input"
                placeholder={
                  canEdit
                    ? "Describe a mobile banking app, B2B SaaS analytics dashboard, or multi-step checkout flow..."
                    : "Viewer role has read-only access to workspace files."
                }
                className="w-full p-4 rounded-2xl bg-[#090d16]/90 border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHeroPlatform("desktop")}
                    data-testid="hero-platform-desktop"
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      heroPlatform === "desktop" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroPlatform("mobile")}
                    data-testid="hero-platform-mobile"
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      heroPlatform === "mobile" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>

                <select
                  value={heroDesignSystemId}
                  onChange={(e) => setHeroDesignSystemId(e.target.value)}
                  data-testid="hero-design-system-select"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="">Default UX Pilot System</option>
                  {(data?.designSystems || []).map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name}
                    </option>
                  ))}
                </select>

                {canEdit && (
                  <button
                    type="button"
                    disabled={enhancing || !heroPrompt.trim()}
                    onClick={handleEnhance}
                    data-testid="hero-enhance-prompt-btn"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{enhancing ? "Enhancing..." : "Enhance Prompt"}</span>
                  </button>
                )}
              </div>

              {canEdit && (
                <button
                  type="submit"
                  disabled={creatingPage}
                  data-testid="hero-generate-submit-btn"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {creatingPage ? "Creating Canvas..." : "Generate in AI Canvas"}
                  </span>
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Filter Bar & Search */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "all", label: "All files" },
                  { id: "mine", label: "My files" },
                  { id: "shared", label: "Shared with me" },
                  { id: "bookmarked", label: "Bookmarked" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-filter-${tab.id}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search design files..."
                data-testid="file-search-input"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Design Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPages.map((p) => (
              <div
                key={p.id}
                data-testid={`design-file-card-${p.id}`}
                className="group rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-indigo-500/50 transition overflow-hidden flex flex-col justify-between shadow-lg"
              >
                <Link
                  href={`/a/ui-design?pageId=${p.id}`}
                  className="p-5 bg-gradient-to-br from-slate-900 via-[#0d1322] to-indigo-950/40 border-b border-slate-800/80 block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {p.mode === "wireframe" ? "Wireframe" : "Hi-Fi UI"} • {p.platform}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
                  </div>
                  <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                    {p.name}
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem]">
                    {p.globalPrompt || "Interactive AI design canvas with multi-screen flows."}
                  </p>
                </Link>

                <div className="px-5 py-3.5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{p.screenCount} screens</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>{p.commentCount}</span>
                    </span>
                    {p.workstreamName && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-300">
                        <FolderKanban className="w-3 h-3 text-purple-400" />
                        <span className="truncate max-w-[90px]">{p.workstreamName}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(p.id, p.isBookmarked)}
                          data-testid={`bookmark-btn-${p.id}`}
                          className={`p-1.5 rounded-lg hover:bg-slate-800 ${
                            p.isBookmarked ? "text-amber-400" : "text-slate-400"
                          }`}
                          title="Bookmark"
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(p.id)}
                          data-testid={`delete-page-btn-${p.id}`}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
