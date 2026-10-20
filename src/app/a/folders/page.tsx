"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import { FolderKanban, Plus, Trash2, Layers, ArrowRight } from "lucide-react";

function FoldersContent() {
  const searchParams = useSearchParams();
  const selectedFolderId = searchParams.get("folderId");
  const { data, loading, refresh } = useWorkspace();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const canEdit = data?.user?.role === "Admin" || data?.user?.role === "Editor";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workstreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color: "#8b5cf6" }),
      });
      if (res.ok) {
        setName("");
        setDescription("");
        refresh();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    await fetch(`/api/workstreams?id=${id}`, { method: "DELETE" });
    refresh();
  };

  const folders = data?.workstreams || [];
  const filteredPages = selectedFolderId
    ? (data?.pages || []).filter((p) => p.workstreamId === selectedFolderId)
    : data?.pages || [];

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <FolderKanban className="w-6 h-6 text-indigo-400" />
              <span>Folders & Workstreams</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Organize design files, wireframes, and UX reviews into structured product workstreams.
            </p>
          </div>
        </div>

        {canEdit && (
          <form
            onSubmit={handleCreate}
            className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Folder Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Enterprise Checkout Redesign"
                data-testid="folder-page-name-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-converting payment & invoice flows"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              data-testid="folder-page-create-btn"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? "Creating..." : "Create Folder"}</span>
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {folders.map((folder) => {
            const active = selectedFolderId === folder.id;
            return (
              <div
                key={folder.id}
                data-testid={`folder-card-${folder.id}`}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                  active
                    ? "bg-indigo-950/40 border-indigo-500"
                    : "bg-[#111827] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-sm text-white">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span>{folder.name}</span>
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {folder.pageCount} files
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {folder.description || "Product design workstream folder"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <Link
                    href={active ? "/a/folders" : `/a/folders?folderId=${folder.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>{active ? "Show All Files" : "Filter Files"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-200">
            {selectedFolderId ? "Files in Selected Folder" : "All Workspace Files"} (
            {filteredPages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map((p) => (
              <Link
                key={p.id}
                href={`/a/ui-design?pageId=${p.id}`}
                className="p-4 rounded-2xl bg-[#111827] border border-slate-800 hover:border-indigo-500/50 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                    {p.mode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{p.screenCount} screens</span>
                  </span>
                  {p.workstreamName && <span>• {p.workstreamName}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}

export default function FoldersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-xs">Loading folders...</div>}>
      <FoldersContent />
    </Suspense>
  );
}
