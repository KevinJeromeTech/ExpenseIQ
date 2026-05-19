import { PreferencesContext } from "../contexts/PreferencesContext";
import { usePreferences } from "../hooks/usePreferences";

export default function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const value = usePreferences();
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
