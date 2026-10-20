import React from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

export default function NotFound() {
  return (
    <div
      data-testid="not-found-page"
      className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Layers className="w-6 h-6 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-white">404 — Canvas or Route Not Found</h1>
      <p className="text-xs text-slate-400 max-w-md">
        The design file, published prototype, or workspace route you requested does not exist.
      </p>
      <div className="flex gap-3 pt-2">
        <Link
          href="/a/ui-list"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
        >
          Go to Workspace
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          Landing Page
        </Link>
      </div>
    </div>
  );
}
