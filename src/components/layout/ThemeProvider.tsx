"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, accent } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // 액센트 컬러 적용
    root.setAttribute("data-accent", accent);

    // 테마 적용
    const applyTheme = (isDark: boolean) => {
      root.setAttribute("data-theme", isDark ? "dark" : "light");
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme, accent]);

  return <>{children}</>;
}
