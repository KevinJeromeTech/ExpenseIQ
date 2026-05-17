import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { insightsApi, ApiError } from "../services/api";
import type { Insight } from "../types";

type Options = { token: string | null; onUnauthorized: () => void };

export function useInsights({ token, onUnauthorized }: Options) {
  const [insights, setInsights] = useState<Insight[]>([]);

  const fetchInsights = useCallback(async () => {
    if (!token) return;
    try {
      const data = await insightsApi.get(token);
      setInsights(Array.isArray(data?.insights) ? data.insights : []);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      toast.error("Failed to load insights.");
      setInsights([]);
    }
  }, [token, onUnauthorized]);

  return { insights, fetchInsights };
}
