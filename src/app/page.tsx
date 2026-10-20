"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Sparkles,
  ScanEye,
  Palette,
  GitPullRequest,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    "Multi-currency FinTech command dashboard with instant virtual card freeze and AI cashflow forecast"
  );

  const features = [
    {
      href: "/a/ui-design",
      title: "Infinite AI UI Canvas",
      desc: "Generate Hi-Fi screens, wireframes, 4-Look variations, and linked Autoflow journeys with HTML & React TSX export.",
      icon: Sparkles,
      badge: "Core Studio",
    },
    {
      href: "/a/ux-design-review",
      title: "Predictive Eye-Tracking & UX Review",
      desc: "Simulate visual attention heatmaps, numbered gaze scanpaths, and regional gaze flow before writing code.",
      icon: ScanEye,
      badge: "Heatmap AI",
    },
    {
      href: "/a/design-system",
      title: "Design System Import & Tokens",
      desc: "Extract color tokens, typography scales, and DESIGN.md specs from Figma, live URLs, or screenshots.",
      icon: Palette,
      badge: "Figma & URL",
    },
    {
      href: "/a/pr-review",
      title: "Automated GitHub PR UX Gate",
      desc: "Audit pull requests for WCAG AA contrast, focus traps, and design token drift automatically.",
      icon: GitPullRequest,
      badge: "GitHub App",
    },
    {
      href: "/labs",
      title: "UX Pilot Shader Labs",
      desc: "Interactive WebGL mesh gradient and retro Bayer/Floyd-Steinberg dither generators with 1-click Canvas export.",
      icon: FlaskConical,
      badge: "Shaders",
    },
    {
      href: "/a/admin",
      title: "Invite-Only RBAC & Pluggable AI",
      desc: "Single-use expiring invitation codes, Admin/Editor/Viewer roles, instant revocation, and Copilot SDK / Azure OpenAI switching.",
      icon: ShieldCheck,
      badge: "Enterprise",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 px-6 border-b border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">UX Pilot Studio</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <Link href="/ui-design-generator" className="hover:text-white">
              UI Generator
            </Link>
            <Link href="/wireframe-generator" className="hover:text-white">
              Wireframe Generator
            </Link>
            <Link href="/templates" className="hover:text-white">
              Templates
            </Link>
            <Link href="/labs" className="hover:text-white">
              Labs
            </Link>
            <Link href="/plans" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/playground" className="hover:text-white">
              Playground
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/sign-in"
              data-testid="landing-signin-link"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200"
            >
              Sign In
            </Link>
            <Link
              href="/a/ui-list"
              data-testid="landing-open-workspace-link"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-14 space-y-16">
        <section className="text-center max-w-4xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by Pluggable GitHub Copilot SDK & Azure OpenAI</span>
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
            Superfast AI UI/UX Design, Wireframing & Predictive Heatmaps
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Turn product requirements into multi-screen Hi-Fi interfaces, interactive wireframes, design system tokens, and eye-tracking UX reviews in seconds.
          </p>

          {/* Interactive Prompt Launcher */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/a/ui-design");
            }}
            className="max-w-2xl mx-auto p-3 rounded-2xl bg-[#111827] border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              data-testid="landing-hero-prompt"
              className="flex-1 px-4 py-3 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              data-testid="landing-hero-generate-btn"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate UI Canvas</span>
            </button>
          </form>
        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.href}
                href={feat.href}
                className="group p-6 rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-indigo-500/50 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {feat.badge}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {feat.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="pt-2 text-xs font-semibold text-indigo-400 flex items-center gap-1">
                  <span>Explore Capability</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
