"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Layers, Check, Sparkles } from "lucide-react";

const CURRENCIES = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.92 },
  GBP: { symbol: "£", rate: 0.79 },
  INR: { symbol: "₹", rate: 83 },
} as const;

export default function PlansPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [currency, setCurrency] = useState<keyof typeof CURRENCIES>("USD");

  const curr = CURRENCIES[currency];
  const discount = billing === "yearly" ? 0.8 : 1;

  const tiers = [
    {
      name: "Free",
      baseMonthly: 0,
      credits: "90 AI Credits",
      desc: "Explore the infinite canvas, wireframe generator, and shader labs.",
      features: [
        "Up to 3 design files",
        "Hi-Fi & Wireframe generation",
        "HTML5 / CSS code preview",
        "UX Pilot Labs access",
      ],
    },
    {
      name: "Standard",
      baseMonthly: 15,
      credits: "420 AI Credits / mo",
      desc: "For product designers and indie builders shipping web & mobile apps.",
      features: [
        "Unlimited design files & folders",
        "React 19 + Tailwind TSX export",
        "Figma Plugin Auto-Layout sync",
        "Version history snapshots",
      ],
    },
    {
      name: "Pro",
      baseMonthly: 29,
      popular: true,
      credits: "1,200 AI Credits / mo",
      desc: "Full power with Predictive Eye-Tracking heatmaps, Design System import, and MCP.",
      features: [
        "Predictive Heatmap, Scanpath & Gaze Flow",
        "Design System import (Figma, URL, DESIGN.md)",
        "Claude Code / Cursor MCP Server token",
        "Automated GitHub PR UX Reviews",
      ],
    },
    {
      name: "Enterprise",
      baseMonthly: 79,
      credits: "Custom / Unlimited Pool",
      desc: "Invite-only RBAC governance, audit logs, and pluggable Copilot SDK / Azure OpenAI.",
      features: [
        "Single-use expiring invitation codes",
        "Admin, Editor & Viewer RBAC enforcement",
        "Pluggable Copilot SDK & Azure OpenAI BYOK",
        "Immutable security & operational audit logs",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">UX Pilot Studio</span>
        </Link>
        <Link
          href="/a/ui-list"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
        >
          Back to Workspace
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Flexible AI Credit Plans</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Plans Built for Fast-Moving Product Teams
          </h1>

          {/* Billing & Currency Switchers */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <div className="p-1 rounded-xl bg-[#111827] border border-slate-800 flex items-center">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                data-testid="billing-toggle-monthly"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                  billing === "monthly" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                data-testid="billing-toggle-yearly"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                  billing === "yearly" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>

            <div className="p-1 rounded-xl bg-[#111827] border border-slate-800 flex items-center gap-1">
              {(Object.keys(CURRENCIES) as Array<keyof typeof CURRENCIES>).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  data-testid={`currency-toggle-${c}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold ${
                    currency === c ? "bg-slate-800 text-white" : "text-slate-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((tier) => {
            const price = Math.round(tier.baseMonthly * curr.rate * discount);
            return (
              <div
                key={tier.name}
                data-testid={`plan-card-${tier.name.toLowerCase()}`}
                className={`rounded-3xl p-6 border flex flex-col justify-between gap-6 ${
                  tier.popular
                    ? "bg-gradient-to-b from-indigo-950/60 to-[#111827] border-indigo-500 shadow-2xl"
                    : "bg-[#111827] border-slate-800"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-white">{tier.name}</h2>
                    {tier.popular && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500 text-white">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      data-testid={`plan-price-${tier.name.toLowerCase()}`}
                      className="text-3xl font-extrabold text-white"
                    >
                      {curr.symbol}
                      {price}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-300">{tier.credits}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{tier.desc}</p>
                  <ul className="space-y-2 pt-2 border-t border-slate-800">
                    {tier.features.map((f) => (
                      <li key={f} className="text-xs text-slate-300 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/a/ui-list"
                  className={`w-full py-2.5 rounded-xl text-center text-xs font-semibold ${
                    tier.popular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  Choose {tier.name}
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
