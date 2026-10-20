"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import { PenTool, Globe, Image, FileCode2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

const IMPORT_SOURCES = [
  {
    id: "figma",
    title: "Figma Plugin & Variables",
    desc: "Import Figma color styles, typography variables, and Auto-Layout component tokens.",
    icon: PenTool,
  },
  {
    id: "url",
    title: "Live Website URL",
    desc: "Extract CSS custom properties, font stacks, and button radii from any live URL.",
    icon: Globe,
  },
  {
    id: "screenshots",
    title: "Product Screenshots",
    desc: "Synthesize a cohesive palette and component library from reference UI screenshots.",
    icon: Image,
  },
  {
    id: "design-md",
    title: "DESIGN.md / Tokens JSON",
    desc: "Import W3C Design Tokens JSON or a structured DESIGN.md specification.",
    icon: FileCode2,
  },
] as const;

export default function DesignSystemImportPage() {
  const router = useRouter();
  const { data, loading, refresh } = useWorkspace();

  const [sourceType, setSourceType] = useState<string>("url");
  const [name, setName] = useState("Acme Cloud Design System v2");
  const [sourceUrl, setSourceUrl] = useState("https://acme-design.example.com");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [headingFont, setHeadingFont] = useState("Plus Jakarta Sans");
  const [submitting, setSubmitting] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/design-systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sourceType,
          sourceUrl,
          primaryColor,
          secondaryColor,
          headingFont,
        }),
      });
      if (res.ok) {
        await refresh();
        router.push("/a/design-system");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/a/design-system"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Import Design System Wizard
            </h1>
            <p className="text-xs text-slate-400">
              Choose an import source to extract design tokens and reusable components for AI generation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IMPORT_SOURCES.map((src) => {
            const Icon = src.icon;
            const selected = sourceType === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => setSourceType(src.id)}
                data-testid={`import-source-${src.id}`}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                  selected
                    ? "bg-indigo-950/50 border-indigo-500 text-white"
                    : "bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{src.title}</span>
                    {selected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{src.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleImport}
          className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Design System Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="import-ds-name-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Source URL or Figma File Key
              </label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                data-testid="import-ds-url-input"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Primary Brand Token
              </label>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Secondary Brand Token
              </label>
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Heading Font Family
              </label>
              <input
                type="text"
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Link
              href="/a/design-system"
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              data-testid="submit-import-ds-btn"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              {submitting ? "Extracting Tokens..." : "Extract & Save Design System"}
            </button>
          </div>
        </form>
      </div>
    </WorkspaceShell>
  );
}
