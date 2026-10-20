"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Layers, Eye, ExternalLink } from "lucide-react";

export default function SharedPublishedSitePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [site, setSite] = useState<{
    id: string;
    slug: string;
    title: string;
    htmlSnapshot: string;
    viewCount: number;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/published-sites?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        setSite(json.site);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">Published Prototype Not Found</h1>
        <p className="text-xs text-slate-400">
          This site may have been unpublished by its owner or the slug is invalid.
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <header className="h-12 px-4 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-white" data-testid="shared-site-title">
            {site?.title || "Loading Published Prototype..."}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {site && (
            <span className="text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>{site.viewCount} views</span>
            </span>
          )}
          <Link
            href="/a/ui-design"
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1"
          >
            <span>Open in UX Pilot Studio</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>
      <main className="flex-1 flex">
        {site && (
          <iframe
            title={site.title}
            srcDoc={site.htmlSnapshot}
            sandbox="allow-same-origin"
            data-testid="shared-site-iframe"
            className="w-full flex-1 border-0 bg-slate-950"
          />
        )}
      </main>
    </div>
  );
}
