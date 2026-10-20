"use client";

import React from "react";
import Link from "next/link";
import { Layers, Sparkles, ArrowRight } from "lucide-react";

export default function UiDesignGeneratorLandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">UX Pilot UI Design Generator</span>
        </Link>
        <Link
          href="/a/ui-design?pageId=page-fintech-command"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
        >
          Launch Hi-Fi Canvas
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Grade Hi-Fi UI & React TSX Export</span>
        </span>
        <h1 className="text-4xl font-extrabold text-white">
          AI UI Design Generator with Custom Design System Tokens
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Synthesize responsive desktop and mobile interfaces, explore 4-Look aesthetic variations, and export clean React + Tailwind CSS code or Figma Auto-Layout frames.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/a/ui-design?pageId=page-fintech-command"
            data-testid="launch-hifi-studio-btn"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2"
          >
            <span>Open Hi-Fi FinTech Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
