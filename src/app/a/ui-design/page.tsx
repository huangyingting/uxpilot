"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CanvasStudio } from "@/components/CanvasStudio";

function CanvasPageContent() {
  const searchParams = useSearchParams();
  const pageId = searchParams.get("pageId") || "page-fintech-command";
  return <CanvasStudio initialPageId={pageId} />;
}

export default function UiDesignCanvasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-xs">Loading AI Canvas...</div>}>
      <CanvasPageContent />
    </Suspense>
  );
}
