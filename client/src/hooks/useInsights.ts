import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { insightsApi, ApiError } from "../services/api";
import type { Insight } from "../types";

type Options = { token: string | null; onUnauthorized: () => void };

export function useInsights({ token, onUnauthorized }: Options) {
  const { data, error } = useQuery({
    queryKey: ["insights", token],
    queryFn: () => insightsApi.get(token!),
    enabled: !!token,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!error) return;
    if (error instanceof ApiError && error.status === 401) onUnauthorized();
    else toast.error("Failed to load insights.");
  }, [error, onUnauthorized]);

  const insights: Insight[] = Array.isArray(data?.insights) ? data.insights : [];

  return { insights };
}
