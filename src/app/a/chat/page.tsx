"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  MessageSquare,
  Send,
  Sparkles,
  Plus,
  Layers,
  Cpu,
  ArrowRight,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  providerUsed?: string;
  suggestedCanvasPrompt?: string;
}

interface ChatThread {
  id: string;
  title: string;
  contextType: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export default function UxChatPage() {
  const router = useRouter();
  const { data, loading, refresh } = useWorkspace();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [contextType, setContextType] = useState<string>("ux-research");
  const [message, setMessage] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [launchingCanvas, setLaunchingCanvas] = useState<boolean>(false);

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/chat", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const list = (json.threads || []) as ChatThread[];
      setThreads(list);
      if (list.length > 0) {
        setSelectedThreadId((prev) => prev || list[0].id);
      }
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const activeThread =
    threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const handleSendMessage = async (
    e: React.FormEvent,
    startNewThread = false
  ) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: startNewThread ? null : activeThread?.id,
          contextType,
          message,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessage("");
        await loadThreads();
        if (json.thread?.id) {
          setSelectedThreadId(json.thread.id);
        }
      }
    } finally {
      setSending(false);
    }
  };

  const handleMaterializeInCanvas = async (promptText: string) => {
    setLaunchingCanvas(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: promptText.slice(0, 44),
          globalPrompt: promptText,
          platform: "desktop",
          mode: "hifi",
        }),
      });
      const json = await res.json();
      if (res.ok && json.page) {
        router.push(`/a/ui-design?pageId=${json.page.id}`);
      }
    } finally {
      setLaunchingCanvas(false);
    }
  };

  return (
    <WorkspaceShell data={data} loading={loading} refresh={refresh}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI UX Research & Flow Architecture Copilot</span>
            </span>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <span>AI UX Copilot Chat</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedThreadId(null);
              setMessage(
                "Design a B2B SaaS multi-tenant role & permission matrix with audit trail drawer"
              );
            }}
            data-testid="new-chat-thread-btn"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Research Thread</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Thread History */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Saved UX Research Threads ({threads.length})
              </div>
              {threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedThreadId(t.id)}
                  data-testid={`chat-thread-item-${t.id}`}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    activeThread?.id === t.id
                      ? "bg-indigo-950/60 border-indigo-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold truncate">{t.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="uppercase">{t.contextType}</span>
                    <span>{t.messages.length} msgs</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Active Conversation & Prompt Composer */}
          <div className="lg:col-span-8 flex flex-col rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden min-h-[540px]">
            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60">
              <div>
                <div
                  data-testid="chat-active-title"
                  className="text-sm font-bold text-white"
                >
                  {activeThread?.title || "New UX Research Session"}
                </div>
                <div className="text-[11px] text-slate-400">
                  Powered by {data?.aiStatus?.activeProvider || "copilot-sdk"} (
                  {data?.aiStatus?.activeModel || "gpt-4.1"})
                </div>
              </div>

              <select
                value={contextType}
                onChange={(e) => setContextType(e.target.value)}
                data-testid="chat-context-select"
                className="px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs text-slate-200"
              >
                <option value="ux-research">UX Research & Personas</option>
                <option value="flow-critique">User Flow Critique</option>
                <option value="copywriting">UX Microcopy & CTA</option>
                <option value="design-tokens">Design System Architecture</option>
              </select>
            </div>

            <div
              data-testid="chat-messages-list"
              className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[420px]"
            >
              {(activeThread?.messages || []).map((m) => (
                <div
                  key={m.id}
                  data-testid={`chat-msg-${m.role}`}
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    m.role === "user"
                      ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 ml-8"
                      : "bg-slate-900 border border-slate-800 text-slate-200 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>
                      {m.role === "user" ? "You (Designer)" : "UX Pilot AI Copilot"}
                    </span>
                    {m.providerUsed && (
                      <span className="font-mono text-indigo-300">{m.providerUsed}</span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.suggestedCanvasPrompt && (
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={launchingCanvas}
                        onClick={() =>
                          handleMaterializeInCanvas(m.suggestedCanvasPrompt!)
                        }
                        data-testid="chat-materialize-canvas-btn"
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>
                          {launchingCanvas
                            ? "Creating Canvas Screens..."
                            : "Generate in AI Canvas"}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => handleSendMessage(e, false)}
              className="p-4 border-t border-slate-800 bg-[#0d1322] flex items-center gap-2.5"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask UX Copilot for user flows, heuristic critiques, or screen architectures..."
                data-testid="chat-input"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={sending}
                data-testid="chat-send-btn"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{sending ? "Synthesizing..." : "Ask Copilot"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
