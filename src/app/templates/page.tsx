"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Layers, ArrowUpRight } from "lucide-react";

const TEMPLATES = [
  {
    id: "tpl-fintech",
    title: "FinTech Multi-Currency Treasury Hub",
    category: "FinTech",
    mode: "Hi-Fi UI",
    platform: "Desktop",
    pageId: "page-fintech-command",
  },
  {
    id: "tpl-telehealth",
    title: "Telehealth Patient Triage & Rx Wireframes",
    category: "Healthcare",
    mode: "Wireframe",
    platform: "Mobile",
    pageId: "page-telehealth-wireframe",
  },
  {
    id: "tpl-saas-ai",
    title: "Enterprise AI Agent Observability Console",
    category: "SaaS & AI",
    mode: "Hi-Fi UI",
    platform: "Desktop",
    pageId: "page-fintech-command",
  },
  {
    id: "tpl-commerce",
    title: "One-Tap Biometric Checkout & Loyalty Wallet",
    category: "E-Commerce",
    mode: "Hi-Fi UI",
    platform: "Mobile",
    pageId: "page-telehealth-wireframe",
  },
];

export default function TemplatesPage() {
  const [category, setCategory] = useState("All");
  const categories = ["All", "FinTech", "Healthcare", "SaaS & AI", "E-Commerce"];

  const filtered =
    category === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">UX Pilot Templates</span>
        </Link>
        <Link
          href="/a/ui-list"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
        >
          Open Workspace
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">
            Production UI & Wireframe Starter Templates
          </h1>
          <p className="text-xs text-slate-400">
            Clone curated multi-screen flows directly into the UX Pilot Infinite Canvas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              data-testid={`template-cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                category === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-[#111827] text-slate-400 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/a/ui-design?pageId=${tpl.pageId}`}
              data-testid={`template-card-${tpl.id}`}
              className="group p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-indigo-500/50 transition flex items-center justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-indigo-300">
                  <span>{tpl.category}</span>
                  <span>•</span>
                  <span>{tpl.mode}</span>
                  <span>•</span>
                  <span>{tpl.platform}</span>
                </div>
                <h2 className="text-base font-bold text-white group-hover:text-indigo-300">
                  {tpl.title}
                </h2>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
