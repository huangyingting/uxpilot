"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  FileText,
  Sparkles,
  Save,
  Layers,
  CheckCircle2,
  Download,
} from "lucide-react";

interface UxDocItem {
  id: string;
  title: string;
  docType: string;
  contentMd: string;
  status: string;
  updatedAt: string;
}

export default function UxDocumentPage() {
  const router = useRouter();
  const { data, loading, refresh } = useWorkspace();
  const [docs, setDocs] = useState<UxDocItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Generator state
  const [newTitle, setNewTitle] = useState("");
  const [newDocType, setNewDocType] = useState("PRD");
  const [newPrompt, setNewPrompt] = useState(
    "Enterprise Healthcare Patient Intake & Diagnostic Triage Portal with WCAG AAA Accessibility"
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDocs = useCallback(async () => {
    const res = await fetch("/api/ux-documents", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const list = (json.documents || []) as UxDocItem[];
      setDocs(list);
      if (list.length > 0) {
        setSelectedId((prev) => {
          const target = prev ? list.find((d) => d.id === prev) || list[0] : list[0];
          setEditContent(target.contentMd);
          return target.id;
        });
      }
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const activeDoc = docs.find((d) => d.id === selectedId) || docs[0] || null;

  const handleSelectDoc = (doc: UxDocItem) => {
    setSelectedId(doc.id);
    setEditContent(doc.contentMd);
    setSavedBanner(null);
  };

  const handleGenerateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/ux-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:
            newTitle.trim() || `${newDocType}: ${newPrompt.slice(0, 38)}`,
          docType: newDocType,
          prompt: newPrompt,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setNewTitle("");
        await loadDocs();
        if (json.document) {
          setSelectedId(json.document.id);
          setEditContent(json.document.contentMd);
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDoc = async () => {
    if (!activeDoc) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ux-documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeDoc.id,
          contentMd: editContent,
        }),
      });
      if (res.ok) {
        setSavedBanner("Specification saved to workspace database.");
        await loadDocs();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToScreens = async () => {
    if (!activeDoc) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: activeDoc.title.slice(0, 44),
        globalPrompt: editContent.slice(0, 300),
        platform: "desktop",
        mode: "hifi",
      }),
    });
    const json = await res.json();
    if (res.ok && json.page) {
      router.push(`/a/ui-design?pageId=${json.page.id}`);
    }
  };

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-indigo-400" />
              <span>AI PRD & UX Document Studio</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Synthesize Product Requirements (PRDs), UX Research Reports, Information Architecture specs, and convert them directly into Canvas screens.
            </p>
          </div>
        </div>

        {/* AI UX Spec Generator Bar */}
        <form
          onSubmit={handleGenerateDoc}
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
        >
          <div className="md:col-span-3">
            <label className="block text-xs text-slate-300 mb-1">Spec Type</label>
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value)}
              data-testid="uxdoc-type-select"
              className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
            >
              <option value="PRD">Product Requirements (PRD)</option>
              <option value="UX_RESEARCH">UX Research Synthesis</option>
              <option value="IA_SPEC">Information Architecture</option>
              <option value="USABILITY_PLAN">Usability Test Plan</option>
              <option value="A11Y_AUDIT">WCAG Accessibility Spec</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-slate-300 mb-1">Document Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="PRD: Enterprise AI Billing Hub"
              data-testid="uxdoc-title-input"
              className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs text-slate-300 mb-1">
              Product / Flow Prompt
            </label>
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              data-testid="uxdoc-prompt-input"
              className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={generating}
              data-testid="generate-uxdoc-btn"
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? "Writing..." : "Generate Spec"}</span>
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Document List */}
          <div className="lg:col-span-4 space-y-2.5">
            {docs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleSelectDoc(doc)}
                data-testid={`uxdoc-item-${doc.id}`}
                className={`w-full text-left p-4 rounded-2xl border transition space-y-1.5 ${
                  activeDoc?.id === doc.id
                    ? "bg-indigo-950/60 border-indigo-500 text-white"
                    : "bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {doc.docType}
                  </span>
                  <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{doc.status}</span>
                  </span>
                </div>
                <div className="text-xs font-bold text-white line-clamp-1">
                  {doc.title}
                </div>
                <div className="text-[11px] text-slate-400">
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          {/* Markdown Editor & Actions */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  data-testid="uxdoc-active-title"
                  className="text-sm font-bold text-white"
                >
                  {activeDoc?.title || "Select a UX Specification"}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Markdown specification synchronized with AI Canvas & Design System
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDoc}
                  disabled={saving}
                  data-testid="save-uxdoc-btn"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{saving ? "Saving..." : "Save Spec"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([editContent], {
                      type: "text/markdown;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${(activeDoc?.title || "ux-spec")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}.md`;
                    a.click();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>
                <button
                  type="button"
                  onClick={handleConvertToScreens}
                  data-testid="uxdoc-to-canvas-btn"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Generate UI Screens from Spec</span>
                </button>
              </div>
            </div>

            {savedBanner && (
              <div
                data-testid="uxdoc-saved-banner"
                className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300"
              >
                {savedBanner}
              </div>
            )}

            <textarea
              rows={16}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              data-testid="uxdoc-editor-textarea"
              className="w-full p-4 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
