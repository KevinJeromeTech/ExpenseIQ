import { createContext, useContext } from "react";
import type { Theme } from "../hooks/useTheme";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}
