import { createContext, useContext } from "react";
import type { Preferences, CurrencyCode } from "../hooks/usePreferences";

type PreferencesContextValue = {
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
  currencySymbol: string;
  fmt: (n: number) => string;
};

export const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: { currency: "USD", defaultPage: "/dashboard", budgetAlertPct: 75, weeklyDigest: false, avatarUrl: "" },
  setPrefs: () => {},
  currencySymbol: "$",
  fmt: (n) => `$${n.toFixed(2)}`,
});

export function usePreferencesContext() {
  return useContext(PreferencesContext);
}

// re-export type so consumers don't need to import from two places
export type { CurrencyCode, Preferences };
