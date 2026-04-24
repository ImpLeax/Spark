import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function ThemeToggle({ isCollapsed = false }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-12 w-full" />;

  const isDark = theme === 'dark';

  const onColor = "from-slate-400 to-slate-100";
  const offColor = "from-amber-500 to-yellow-200";
  const onIconColor = "text-slate-700";
  const offIconColor = "text-amber-700";

  const containerWidth = isCollapsed ? "w-12" : "w-16";
  const thumbSize = isCollapsed ? 32 : 40;
  const thumbClass = isCollapsed ? "w-8 h-8" : "w-10 h-10";

  return (
    <div
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "flex items-center w-full h-12 rounded-xl transition-colors cursor-pointer group",
        isCollapsed ? "justify-center" : "px-3 hover:bg-secondary"
      )}
    >
      <div className={cn("relative h-8 flex items-center shrink-0", containerWidth)}>

        <div className="absolute w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full top-1/2 -translate-y-1/2" />

        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 ease-in-out z-10 border-2 border-background",
            thumbClass,
            isDark ? `bg-linear-to-tr ${onColor} rotate-[360deg]` : `bg-linear-to-tr ${offColor} rotate-0`
          )}
          style={{
            left: isDark ? `calc(100% - ${thumbSize}px)` : '0px'
          }}
        >
          {isDark ? (
            <Moon size={isCollapsed ? 18 : 22} fill="currentColor" className={onIconColor} />
          ) : (
            <Sun size={isCollapsed ? 18 : 24} fill="currentColor" className={offIconColor} />
          )}
        </div>
      </div>

      {!isCollapsed && (
        <span className="ml-4 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
          {isDark ? t('theme_toggle.dark_mode') : t('theme_toggle.light_mode')}
        </span>
      )}
    </div>
  );
}