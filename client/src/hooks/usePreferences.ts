import { useState, useCallback } from "react";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "JPY";

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar",      symbol: "$"   },
  { code: "EUR", label: "Euro",           symbol: "€"   },
  { code: "GBP", label: "British Pound",  symbol: "£"   },
  { code: "CAD", label: "Canadian Dollar",symbol: "CA$" },
  { code: "JPY", label: "Japanese Yen",   symbol: "¥"   },
];

export type Preferences = {
  currency: CurrencyCode;
  defaultPage: "/dashboard" | "/transactions" | "/analytics";
  budgetAlertPct: number;
  weeklyDigest: boolean;
};

const STORAGE_KEY = "expenseiq_prefs";

const DEFAULT_PREFS: Preferences = {
  currency: "USD",
  defaultPage: "/dashboard",
  budgetAlertPct: 75,
  weeklyDigest: false,
};

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function usePreferences() {
  const [prefs, setPrefsState] = useState<Preferences>(load);

  const setPrefs = useCallback((patch: Partial<Preferences>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const currencySymbol =
    CURRENCY_OPTIONS.find((c) => c.code === prefs.currency)?.symbol ?? "$";

  const fmt = useCallback(
    (n: number) => `${currencySymbol}${n.toFixed(2)}`,
    [currencySymbol]
  );

  return { prefs, setPrefs, currencySymbol, fmt };
}
