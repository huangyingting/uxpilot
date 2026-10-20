"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Shuffle, Copy, Check, Send, ArrowLeft } from "lucide-react";

const PRESETS = [
  {
    name: "Cyber Aurora",
    mode: "Aurora",
    c1: "#6366f1",
    c2: "#a855f7",
    c3: "#ec4899",
    c4: "#090d16",
    angle: 135,
    noise: 18,
  },
  {
    name: "Emerald Liquidity",
    mode: "Fluid",
    c1: "#10b981",
    c2: "#06b6d4",
    c3: "#3b82f6",
    c4: "#06131f",
    angle: 110,
    noise: 12,
  },
  {
    name: "Solar Flare Mesh",
    mode: "Mesh",
    c1: "#f97316",
    c2: "#ef4444",
    c3: "#8b5cf6",
    c4: "#0f172a",
    angle: 160,
    noise: 24,
  },
];

export default function GradientGeneratorPage() {
  const router = useRouter();
  const [shaderMode, setShaderMode] = useState("Aurora");
  const [c1, setC1] = useState("#6366f1");
  const [c2, setC2] = useState("#a855f7");
  const [c3, setC3] = useState("#ec4899");
  const [c4, setC4] = useState("#090d16");
  const [angle, setAngle] = useState(135);
  const [noise, setNoise] = useState(18);
  const [codeFormat, setCodeFormat] = useState<"react" | "css">("react");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const cssBackground = `radial-gradient(circle at 20% 25%, ${c1} 0%, transparent 55%), radial-gradient(circle at 80% 30%, ${c2} 0%, transparent 55%), radial-gradient(circle at 50% 80%, ${c3} 0%, transparent 60%), linear-gradient(${angle}deg, ${c1}, ${c4})`;

  const exportedSnippet =
    codeFormat === "react"
      ? `export function UXWaveGradientHero() {\n  return (\n    <div\n      className="min-h-[480px] rounded-3xl p-12 text-white"\n      style={{ background: \`${cssBackground}\` }}\n    >\n      <h1 className="text-4xl font-extrabold">${shaderMode} Shader Hero</h1>\n    </div>\n  );\n}`
      : `.uxpilot-shader-bg {\n  background: ${cssBackground};\n  /* grain intensity: ${noise}% */\n}`;

  const handleRandomize = () => {
    const pick = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    setShaderMode(pick.mode);
    setC1(pick.c1);
    setC2(pick.c2);
    setC3(pick.c3);
    setC4(pick.c4);
    setAngle(Math.floor(45 + Math.random() * 270));
  };

  const handleSendToCanvas = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/labs/send-to-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${shaderMode} Mesh Gradient Hero`,
          cssBackground,
          shaderCode: exportedSnippet,
        }),
      });
      const json = await res.json();
      if (res.ok && json.pageId) {
        router.push(`/a/ui-design?pageId=${json.pageId}`);
      } else {
        router.push("/sign-in");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <header className="h-14 px-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/labs"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-bold text-sm text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>UX Pilot Labs — Shader Gradient Generator</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomize}
            data-testid="gradient-randomize-btn"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-400" />
            <span>Randomize</span>
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={handleSendToCanvas}
            data-testid="gradient-send-to-canvas-btn"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? "Sending..." : "Send to AI Canvas"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Interactive Preview Surface */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div
            data-testid="gradient-live-preview"
            className="flex-1 min-h-[420px] rounded-3xl border border-white/15 shadow-2xl p-10 flex flex-col justify-between relative overflow-hidden"
            style={{ background: cssBackground }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-semibold text-white w-fit border border-white/15">
              <span>Mode: {shaderMode}</span>
              <span>•</span>
              <span>Angle: {angle}°</span>
              <span>•</span>
              <span>Grain: {noise}%</span>
            </div>
            <div className="max-w-lg space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow">
                {shaderMode} Multi-Stop Mesh Shader
              </h1>
              <p className="text-sm text-white/85">
                Real-time procedural CSS & WebGL-ready gradient surface crafted in UX Pilot Labs.
              </p>
            </div>
          </div>

          {/* Code Output Box */}
          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCodeFormat("react")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    codeFormat === "react" ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}
                >
                  React TSX
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat("css")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    codeFormat === "css" ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}
                >
                  CSS Variables
                </button>
              </div>
              <button
                type="button"
                data-testid="gradient-copy-code-btn"
                onClick={() => {
                  navigator.clipboard?.writeText(exportedSnippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Snippet"}</span>
              </button>
            </div>
            <pre
              data-testid="gradient-code-output"
              className="p-3 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto"
            >
              {exportedSnippet}
            </pre>
          </div>
        </div>

        {/* Right Controls Inspector */}
        <aside className="lg:col-span-4 rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-5 h-fit">
          <h2 className="text-sm font-bold text-white">Shader Parameters</h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Shader Algorithm</label>
            <div className="grid grid-cols-2 gap-2">
              {["Aurora", "Fluid", "Mesh", "Grain"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setShaderMode(m)}
                  data-testid={`gradient-mode-${m.toLowerCase()}`}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    shaderMode === m
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stop 1</label>
              <input
                type="text"
                value={c1}
                onChange={(e) => setC1(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stop 2</label>
              <input
                type="text"
                value={c2}
                onChange={(e) => setC2(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stop 3</label>
              <input
                type="text"
                value={c3}
                onChange={(e) => setC3(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Deep Base</label>
              <input
                type="text"
                value={c4}
                onChange={(e) => setC4(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Flow Angle</span>
              <span>{angle}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Film Grain Intensity</span>
              <span>{noise}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={noise}
              onChange={(e) => setNoise(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
