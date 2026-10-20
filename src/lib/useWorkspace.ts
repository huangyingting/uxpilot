"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspaceBootstrapData } from "@/components/WorkspaceShell";

export function useWorkspace() {
  const [data, setData] = useState<WorkspaceBootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workspace/bootstrap", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setData(null);
        setError(res.status === 403 ? "Account revoked" : "Unauthenticated");
        return;
      }
      if (!res.ok) {
        throw new Error(`Bootstrap failed (${res.status})`);
      }
      const json = (await res.json()) as WorkspaceBootstrapData;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
