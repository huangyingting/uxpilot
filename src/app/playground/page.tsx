"use client";

import React from "react";
import { CanvasStudio } from "@/components/CanvasStudio";

export default function PlaygroundPage() {
  return <CanvasStudio initialPageId="page-fintech-command" isPublicPlayground={true} />;
}
