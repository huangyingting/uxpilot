"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical, Sparkles, Grid, ArrowRight, Layers } from "lucide-react";

export default function LabsIndexPage() {
  const tools = [
    {
      href: "/labs/gradient-generator",
      title: "Shader Gradient Generator",
      badge: "WebGL / Mesh / Aurora",
      desc: "Interactive multi-stop mesh, fluid, aurora, and grain gradient synthesizer with React TSX, HTML/CSS, and direct Canvas export.",
      gradient: "from-indigo-600 via-purple-600 to-pink-500",
      icon: Sparkles,
    },
    {
      href: "/labs/dither-generator",
      title: "Retro Dither & Halftone Shader",
      badge: "Bayer 4x4 / Floyd-Steinberg",
      desc: "Procedural retro dithering, ASCII halftone matrices, and duotone pixel shaders ready to embed in hero sections.",
      gradient: "from-emerald-600 via-teal-600 to-cyan-600",
      icon: Grid,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">UX Pilot Labs</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/a/ui-list"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Back to Workspace
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Experimental Visual Shaders & Micro-Tools</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            UX Pilot Labs — Interactive Shaders for Modern UI
          </h1>
          <p className="text-sm text-slate-400">
            Craft procedural mesh gradients and retro dither textures, copy production React or HTML code, or send directly onto your AI Canvas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                data-testid={`labs-card-${tool.href}`}
                className="group rounded-3xl bg-[#111827] border border-slate-800 hover:border-indigo-500/60 overflow-hidden transition shadow-xl flex flex-col justify-between"
              >
                <div className={`h-48 bg-gradient-to-br ${tool.gradient} p-6 flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white">
                      {tool.badge}
                    </span>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">{tool.title}</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">{tool.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                    <span>Launch Interactive Generator</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
