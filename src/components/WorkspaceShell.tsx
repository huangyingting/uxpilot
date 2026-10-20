"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutGrid,
  FolderKanban,
  Sparkles,
  ScanEye,
  Palette,
  GitPullRequest,
  Globe,
  UserCheck,
  ShieldAlert,
  Cpu,
  PenTool,
  FlaskConical,
  LogOut,
  Plus,
  Menu,
  X,
  Check,
  Copy,
  Layers,
  ChevronRight,
  MessageSquare,
  FileText,
} from "lucide-react";

export interface WorkspaceBootstrapData {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "Admin" | "Editor" | "Viewer";
    status: string;
    planTier: string;
    creditsRemaining: number;
    creditsTotal: number;
  };
  aiStatus: {
    activeProvider: "copilot-sdk" | "azure-openai" | "deterministic";
    activeModel: string;
    copilotSdkAvailable: boolean;
    azureConfigured: boolean;
    providers: Array<{ id: string; label: string; ready: boolean; model: string }>;
  };
  pages: Array<{
    id: string;
    name: string;
    globalPrompt: string | null;
    platform: string;
    mode: string;
    isBookmarked: boolean;
    isShared: boolean;
    workstreamId: string | null;
    workstreamName: string | null;
    designSystemId: string | null;
    designSystemName: string | null;
    screenCount: number;
    commentCount: number;
    updatedAt: string;
    createdAt: string;
  }>;
  workstreams: Array<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    pageCount: number;
    updatedAt: string;
  }>;
  designSystems: Array<{
    id: string;
    name: string;
    sourceType: string;
    sourceUrl: string | null;
    tokens: Record<string, unknown>;
    components: Array<{ name: string; variants: string[]; status: string }>;
    designMd: string | null;
    isShared: boolean;
    updatedAt: string;
  }>;
  publishedSites: Array<{
    id: string;
    pageId: string;
    pageName: string;
    slug: string;
    title: string;
    status: string;
    viewCount: number;
    updatedAt: string;
  }>;
  mcpTokens: Array<{
    id: string;
    name: string;
    tokenPrefix: string;
    tokenValue: string;
    status: string;
    lastUsedAt: string | null;
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    screenId: string | null;
    title: string;
    reviewGoal: string | null;
    overallScore: number;
    metrics: {
      clarityScore: number;
      visualHierarchyScore: number;
      accessibilityScore: number;
      conversionFrictionScore: number;
    };
    findings: Array<{
      id: string;
      severity: "critical" | "warning" | "suggestion";
      category: string;
      title: string;
      recommendation: string;
    }>;
    heatmapPoints: Array<{ x: number; y: number; intensity: number; label: string }>;
    scanpath: Array<{ step: number; x: number; y: number; label: string; dwellMs: number }>;
    gazeFlow: Array<{ area: string; attentionPct: number }>;
    createdAt: string;
  }>;
  prRuns: Array<{
    id: string;
    repoFullName: string;
    prNumber: number;
    prTitle: string;
    branchName: string;
    status: string;
    score: number;
    summary: string;
    findings: Array<{
      file: string;
      line: number;
      severity: string;
      rule: string;
      comment: string;
    }>;
    createdAt: string;
  }>;
}

const FRAMEWORKS_LIST = [
  {
    id: "uxpilot-mcp",
    name: "Claude Code / Cursor MCP",
    badge: "Recommended",
    desc: "Stream UX Pilot screens & design tokens directly into Cursor, Windsurf, or Claude Code via Model Context Protocol.",
    snippet: `npx -y @uxpilot/mcp-server --token uxp_mcp_live_9f8a7b6c5d4e`,
  },
  {
    id: "shadcn-tailwind",
    name: "React 19 + Tailwind CSS + shadcn/ui",
    badge: "Production Ready",
    desc: "Export semantic React TSX components with Radix primitives and Tailwind utility tokens.",
    snippet: `npx shadcn@latest add https://uxpilot.local/r/fintech-command-hub.json`,
  },
  {
    id: "nextjs-app",
    name: "Next.js App Router Bundle",
    badge: "Full Stack",
    desc: "Download complete Next.js 16 route groups with responsive layouts and dark mode variables.",
    snippet: `npm create uxpilot-app@latest -- --page fintech-command-hub`,
  },
  {
    id: "html-css",
    name: "Zero-Dependency HTML5 + CSS Grid",
    badge: "Universal",
    desc: "Clean, accessible HTML5 markup ready for Vue, Svelte, Angular, or static hosting.",
    snippet: `<iframe src="https://uxpilot.local/s/fintech-command-hub-live" width="100%" height="800" />`,
  },
];

export function WorkspaceShell({
  children,
  data,
  loading,
  refresh,
}: {
  children: React.ReactNode;
  data: WorkspaceBootstrapData | null;
  loading?: boolean;
  refresh?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [frameworksModalOpen, setFrameworksModalOpen] = useState(false);
  const [figmaModalOpen, setFigmaModalOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [figmaScreenChoice, setFigmaScreenChoice] = useState<string>("");
  const [figmaCopied, setFigmaCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" && !loading && !data) {
      router.push("/sign-in");
    }
  }, [status, loading, data, router]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/workstreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName, description: folderDesc }),
      });
      if (res.ok) {
        setFolderName("");
        setFolderDesc("");
        setNewFolderModalOpen(false);
        refresh?.();
      }
    } finally {
      setCreatingFolder(false);
    }
  };

  const navItems = [
    { href: "/a/ui-list", label: "Design files", icon: LayoutGrid },
    { href: "/a/folders", label: "Folders", icon: FolderKanban },
    { href: "/a/ui-design", label: "AI Canvas Studio", icon: Sparkles },
    { href: "/a/ux-design-review", label: "UX Review & Heatmap", icon: ScanEye },
    { href: "/a/design-system", label: "Design Systems", icon: Palette },
    { href: "/a/pr-review", label: "PR Review", icon: GitPullRequest, badge: "Alpha" },
    { href: "/a/chat", label: "AI UX Chat", icon: MessageSquare },
    { href: "/a/ux-document", label: "UX Documents", icon: FileText },
    { href: "/a/published-sites", label: "Published Sites", icon: Globe },
    { href: "/a/account", label: "Account & MCP", icon: UserCheck },
  ];

  if (data?.user?.role === "Admin") {
    navItems.push({
      href: "/a/admin",
      label: "Admin & Invites",
      icon: ShieldAlert,
      badge: "RBAC",
    });
  }

  const user = data?.user;
  const creditsPct = user
    ? Math.min(100, Math.round((user.creditsRemaining / Math.max(1, user.creditsTotal)) * 100))
    : 70;

  return (
    <div className="min-h-screen flex bg-[#0b0f19] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 xl:w-68 flex-col border-r border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-xl shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <Link href="/a/ui-list" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">UX Pilot</span>
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Studio
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Action CTA */}
        <div className="p-3.5">
          <Link
            href="/a/ui-design"
            data-testid="sidebar-new-canvas-btn"
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New AI Canvas Design</span>
          </Link>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-1 flex-1 overflow-y-auto space-y-5">
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </div>
            <nav className="space-y-0.5" aria-label="Workspace Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/a/ui-list" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                      active
                        ? "bg-indigo-500/15 text-white border border-indigo-500/30"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Folders Section */}
          <div>
            <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Folders</span>
              {user?.role !== "Viewer" && (
                <button
                  type="button"
                  onClick={() => setNewFolderModalOpen(true)}
                  data-testid="sidebar-create-folder-btn"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  title="Create Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {(data?.workstreams || []).slice(0, 5).map((ws) => (
                <Link
                  key={ws.id}
                  href={`/a/folders?folderId=${ws.id}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ws.color || "#6366f1" }}
                    />
                    <span className="truncate">{ws.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{ws.pageCount}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Ecosystem & Plugins */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Integrations & Labs
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setFrameworksModalOpen(true)}
                data-testid="sidebar-frameworks-btn"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition"
              >
                <span className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Frameworks & MCP</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => setFigmaModalOpen(true)}
                data-testid="sidebar-figma-btn"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition"
              >
                <span className="flex items-center gap-2.5">
                  <PenTool className="w-4 h-4 text-pink-400" />
                  <span>Figma Plugin</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <Link
                href="/labs"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition"
              >
                <span className="flex items-center gap-2.5">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>UX Pilot Labs</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Shaders
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer: AI Provider + Credits + User */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#090d18]">
          {/* Active Pluggable AI Engine Pill */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Engine:</span>
            </span>
            <span
              data-testid="active-ai-provider-badge"
              className="font-semibold text-indigo-300 truncate max-w-[120px]"
            >
              {data?.aiStatus?.activeProvider || "copilot-sdk"}
            </span>
          </div>

          {/* Credits meter */}
          <div className="px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">AI Credits</span>
              <span className="font-semibold text-white">
                {user?.creditsRemaining ?? 840} / {user?.creditsTotal ?? 1200}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                style={{ width: `${creditsPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>{user?.planTier || "Pro"} Plan</span>
              <Link href="/plans" className="text-indigo-400 hover:underline font-medium">
                Upgrade
              </Link>
            </div>
          </div>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.name || user.email}
                  </p>
                  <span
                    data-testid="sidebar-user-role"
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      user.role === "Admin"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : user.role === "Editor"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
                data-testid="sign-out-button"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1322]">
          <Link href="/a/ui-list" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">UX Pilot Studio</span>
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                {user.role}
              </span>
            )}
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              data-testid="mobile-menu-toggle"
              aria-label="Toggle Menu"
              className="p-2 rounded-lg bg-slate-800/80 text-slate-200"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-[#0d1322] px-4 py-3 space-y-1 z-40">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setFrameworksModalOpen(true);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 text-xs text-slate-200"
              >
                Frameworks & MCP
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setFigmaModalOpen(true);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 text-xs text-slate-200"
              >
                Figma Plugin
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>

      {/* Modal 1: Frameworks & MCP Export Modal */}
      {frameworksModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          data-testid="frameworks-modal"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-slate-700/80 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    Frameworks, Code Export & MCP Server
                  </h2>
                  <p className="text-xs text-slate-400">
                    Connect UX Pilot screens directly to your IDE or export production component code.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFrameworksModalOpen(false)}
                data-testid="close-frameworks-modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {FRAMEWORKS_LIST.map((fw) => (
                <div
                  key={fw.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">{fw.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {fw.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{fw.desc}</p>
                  <div className="flex items-center justify-between gap-2 bg-[#090d16] px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300">
                    <span className="truncate">{fw.snippet}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(fw.id, fw.snippet)}
                      className="shrink-0 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] font-sans"
                    >
                      {copiedId === fw.id ? (
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Figma Plugin Bidirectional Sync Modal */}
      {figmaModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          data-testid="figma-plugin-modal"
        >
          <div className="w-full max-w-xl rounded-2xl bg-[#111827] border border-slate-700/80 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PenTool className="w-5 h-5 text-pink-400" />
                <div>
                  <h2 className="text-base font-bold text-white">UX Pilot Figma Plugin Sync</h2>
                  <p className="text-xs text-slate-400">
                    Export Auto-Layout Figma frames or import variables from your Figma Design System.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFigmaModalOpen(false)}
                data-testid="close-figma-modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  1. Select Design File to Bundle for Figma Auto-Layout
                </label>
                <select
                  value={figmaScreenChoice}
                  onChange={(e) => setFigmaScreenChoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-slate-700 text-xs text-white"
                >
                  {(data?.pages || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.platform} • {p.mode})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  data-testid="copy-figma-clipboard-btn"
                  onClick={() => {
                    const selected =
                      data?.pages?.find((p) => p.id === figmaScreenChoice) || data?.pages?.[0];
                    navigator.clipboard?.writeText(
                      JSON.stringify({
                        plugin: "uxpilot-figma-auto-layout-v2",
                        pageId: selected?.id || "page-fintech-command",
                        name: selected?.name || "FinTech Wealth & Card Command Hub",
                        exportedAt: new Date().toISOString(),
                      })
                    );
                    setFigmaCopied(true);
                    setTimeout(() => setFigmaCopied(false), 2000);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  {figmaCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Auto-Layout Payload for Figma Plugin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Frame Payload to Paste in Figma</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">How to use in Figma:</p>
                <p>1. Open the UX Pilot plugin inside Figma Desktop or Web.</p>
                <p>2. Click &ldquo;Paste from UX Pilot Studio&rdquo; to generate editable Auto-Layout layers.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Create New Folder (Workstream) Modal */}
      {newFolderModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          data-testid="create-folder-modal"
        >
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-700/80 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Create Workspace Folder</h2>
              <button
                type="button"
                onClick={() => setNewFolderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Q3 Mobile Onboarding Flow"
                  data-testid="new-folder-name-input"
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-slate-700 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  placeholder="Screens and reviews for Q3 release"
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-slate-700 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewFolderModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  data-testid="submit-create-folder-btn"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                >
                  {creatingFolder ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
