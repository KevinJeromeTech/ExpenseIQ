import { ThemeContext } from "../contexts/ThemeContext";
import { useTheme } from "../hooks/useTheme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useTheme();
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
