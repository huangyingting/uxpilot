"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import { Globe, ExternalLink, Eye, Power, Trash2, Plus } from "lucide-react";

export default function PublishedSitesPage() {
  const { data, loading, refresh } = useWorkspace();
  const [selectedPageId, setSelectedPageId] = useState("");
  const [publishing, setPublishing] = useState(false);

  const canEdit = data?.user?.role === "Admin" || data?.user?.role === "Editor";
  const sites = data?.publishedSites || [];
  const pages = data?.pages || [];

  const handlePublishNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedPageId || pages[0]?.id;
    if (!targetId) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/published-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: targetId }),
      });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "published" ? "unpublished" : "published";
    await fetch("/api/published-sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    refresh();
  };

  const handleDeleteSite = async (id: string) => {
    await fetch(`/api/published-sites?id=${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-indigo-400" />
              <span>Published Sites & Interactive Previews</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage public share links (`/s/[slug]`), monitor live traffic views, or unpublish links.
            </p>
          </div>
        </div>

        {canEdit && (
          <form
            onSubmit={handlePublishNew}
            className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-wrap items-end gap-4"
          >
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Design File to Publish Live
              </label>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                data-testid="publish-page-select"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.platform} • {p.mode})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={publishing}
              data-testid="publish-new-site-btn"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{publishing ? "Publishing..." : "Publish New Site Link"}</span>
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site) => (
            <div
              key={site.id}
              data-testid={`published-site-card-${site.slug}`}
              className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{site.title}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                      site.status === "published"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {site.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <Link
                    href={`/s/${site.slug}`}
                    className="font-mono text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>/s/{site.slug}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{site.viewCount} views</span>
                  </span>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(site.id, site.status)}
                    data-testid={`toggle-site-status-${site.slug}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <Power className="w-3.5 h-3.5 text-amber-400" />
                    <span>{site.status === "published" ? "Unpublish" : "Republish"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSite(site.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                    title="Delete Site"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
