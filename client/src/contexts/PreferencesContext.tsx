import { createContext, useContext } from "react";
import type { Preferences, CurrencyCode, DateFormat } from "../hooks/usePreferences";

type PreferencesContextValue = {
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
  currencySymbol: string;
  fmt: (n: number) => string;
};

export const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: { currency: "USD", defaultPage: "/dashboard", budgetAlertPct: 75, budgetAlertsEnabled: true, weeklyDigest: false, avatarUrl: "", dateFormat: "MM/DD/YYYY" },
  setPrefs: () => {},
  currencySymbol: "$",
  fmt: (n) => `$${n.toFixed(2)}`,
});

export function usePreferencesContext() {
  return useContext(PreferencesContext);
}

// re-export type so consumers don't need to import from two places
export type { CurrencyCode, Preferences, DateFormat };
