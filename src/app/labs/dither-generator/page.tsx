"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Grid, Copy, Check, Send, ArrowLeft } from "lucide-react";

export default function DitherGeneratorPage() {
  const router = useRouter();
  const [algorithm, setAlgorithm] = useState<"Bayer 4x4" | "Floyd-Steinberg" | "Halftone" | "ASCII">(
    "Bayer 4x4"
  );
  const [pixelScale, setPixelScale] = useState(4);
  const [threshold, setThreshold] = useState(52);
  const [fgColor, setFgColor] = useState("#10b981");
  const [bgColor, setBgColor] = useState("#090d16");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const ditherCss = `radial-gradient(${fgColor} 1.25px, transparent 1.25px), radial-gradient(${fgColor} 1.25px, ${bgColor} 1.25px)`;
  const snippet = `/* UX Pilot Labs — ${algorithm} Dither Matrix (scale: ${pixelScale}px, threshold: ${threshold}%) */\n.uxpilot-dither-surface {\n  background-color: ${bgColor};\n  background-image: ${ditherCss};\n  background-size: ${pixelScale * 4}px ${pixelScale * 4}px;\n  background-position: 0 0, ${pixelScale * 2}px ${pixelScale * 2}px;\n}`;

  const handleSendToCanvas = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/labs/send-to-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${algorithm} Retro Dither Hero`,
          cssBackground: ditherCss,
          shaderCode: snippet,
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
            <Grid className="w-4 h-4 text-emerald-400" />
            <span>UX Pilot Labs — Retro Dither & Halftone Shader</span>
          </span>
        </div>

        <button
          type="button"
          disabled={sending}
          onClick={handleSendToCanvas}
          data-testid="dither-send-to-canvas-btn"
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sending ? "Sending..." : "Send to AI Canvas"}</span>
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div
            data-testid="dither-live-preview"
            className="flex-1 min-h-[420px] rounded-3xl border border-slate-800 p-10 flex flex-col justify-between"
            style={{
              backgroundColor: bgColor,
              backgroundImage: ditherCss,
              backgroundSize: `${pixelScale * 4}px ${pixelScale * 4}px`,
            }}
          >
            <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-xs font-mono text-emerald-300 w-fit">
              {algorithm} • Pixel Scale {pixelScale}x • Threshold {threshold}%
            </span>
            <div className="p-6 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 max-w-lg space-y-2">
              <h1 className="text-3xl font-extrabold text-white">{algorithm} Dither Matrix</h1>
              <p className="text-xs text-slate-300">
                Retro-futuristic ordered dithering & halftone shader for developer tools and AI landing pages.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Exported Dither CSS</span>
              <button
                type="button"
                data-testid="dither-copy-code-btn"
                onClick={() => {
                  navigator.clipboard?.writeText(snippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy CSS"}</span>
              </button>
            </div>
            <pre
              data-testid="dither-code-output"
              className="p-3 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto"
            >
              {snippet}
            </pre>
          </div>
        </div>

        <aside className="lg:col-span-4 rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-5 h-fit">
          <h2 className="text-sm font-bold text-white">Dither Matrix Controls</h2>

          <div className="grid grid-cols-2 gap-2">
            {(["Bayer 4x4", "Floyd-Steinberg", "Halftone", "ASCII"] as const).map((alg) => (
              <button
                key={alg}
                type="button"
                onClick={() => setAlgorithm(alg)}
                data-testid={`dither-alg-${alg.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border ${
                  algorithm === alg
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-slate-900 text-slate-300 border-slate-800"
                }`}
              >
                {alg}
              </button>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Pixel Matrix Scale</span>
              <span>{pixelScale}px</span>
            </div>
            <input
              type="range"
              min={2}
              max={12}
              value={pixelScale}
              onChange={(e) => setPixelScale(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Luminance Threshold</span>
              <span>{threshold}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Foreground Dot</label>
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Background</label>
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-mono text-white"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
