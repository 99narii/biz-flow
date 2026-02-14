import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "indigo" | "pink" | "purple" | "mint";

interface SettingsState {
  theme: ThemeMode;
  accent: AccentColor;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      accent: "indigo",
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
    }),
    {
      name: "bizflow-settings",
    }
  )
);
