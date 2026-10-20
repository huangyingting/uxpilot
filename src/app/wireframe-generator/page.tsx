"use client";

import React from "react";
import Link from "next/link";
import { Layers, Sparkles, ArrowRight } from "lucide-react";

export default function WireframeGeneratorLandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">UX Pilot Wireframe Generator</span>
        </Link>
        <Link
          href="/a/ui-design?pageId=page-telehealth-wireframe"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
        >
          Launch Wireframe Canvas
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Low-Fidelity Structural UX Architecture</span>
        </span>
        <h1 className="text-4xl font-extrabold text-white">
          AI Wireframe Generator for Rapid Information Architecture
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Generate clean structural wireframes for mobile and desktop product flows, validate navigation hierarchy, and convert to Hi-Fi UI in one click.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/a/ui-design?pageId=page-telehealth-wireframe"
            data-testid="launch-wireframe-studio-btn"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2"
          >
            <span>Open Telehealth Wireframe Flow</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
