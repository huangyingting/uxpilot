"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import { Palette, Upload, CheckCircle2, FileCode2, Layers } from "lucide-react";

export default function DesignSystemPage() {
  const { data, loading, refresh } = useWorkspace();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const systems = data?.designSystems || [];
  const active = systems[selectedIdx] || systems[0] || null;
  const colors = (active?.tokens?.colors || {}) as Record<string, string>;
  const typography = (active?.tokens?.typography || {}) as Record<string, string>;

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Palette className="w-6 h-6 text-indigo-400" />
              <span>Design Systems & Token Libraries</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage semantic color tokens, typography scales, component variants, and DESIGN.md specs.
            </p>
          </div>
          <Link
            href="/a/design-system/import"
            data-testid="goto-import-design-system-btn"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg"
          >
            <Upload className="w-4 h-4" />
            <span>Import Design System</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {systems.map((ds, idx) => (
            <button
              key={ds.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              data-testid={`select-ds-${idx}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                idx === selectedIdx
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-[#111827] text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
            >
              {ds.name} ({ds.sourceType})
            </button>
          ))}
        </div>

        {active && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <h2 className="text-sm font-bold text-white">Semantic Color Tokens</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(colors).map(([key, hex]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                    >
                      <div
                        className="h-12 rounded-lg border border-white/10"
                        style={{ backgroundColor: String(hex) }}
                      />
                      <div className="text-xs font-semibold text-white capitalize">{key}</div>
                      <div className="text-[11px] font-mono text-slate-400">{String(hex)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Extracted Component Catalog ({active.components.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {active.components.map((comp) => {
                    const c = comp as unknown as Record<string, unknown>;
                    const variantsList = Array.isArray(c.variants)
                      ? (c.variants as string[]).join(", ")
                      : String(c.category || c.description || "Default, Active, Disabled");
                    const statusLabel = String(c.status || "Synced");
                    return (
                      <div
                        key={comp.name}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{comp.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Variants: {variantsList}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{statusLabel}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
                <h2 className="text-sm font-bold text-white">Typography Scale</h2>
                <div className="space-y-2 text-xs">
                  {Object.entries(typography).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between py-2 border-b border-slate-800/80 text-slate-300"
                    >
                      <span className="capitalize text-slate-400">{k}</span>
                      <span className="font-semibold text-white">
                        {Array.isArray(v) ? v.join(" • ") : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <span>Generated DESIGN.md Specification</span>
                </h2>
                <pre
                  data-testid="design-system-md-preview"
                  className="p-4 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap"
                >
                  {active.designMd}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
