import { useState, useEffect } from "react";
import { Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/lib/auth-context";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [showGuide, setShowGuide] = useState(false);

  const guideKey = user ? `tableicty_theme_guide_dismissed_${user.id}` : "tableicty_theme_guide_dismissed";

  useEffect(() => {
    function handleShowThemeGuide() {
      const dismissed = localStorage.getItem(guideKey);
      if (!dismissed) {
        setTimeout(() => setShowGuide(true), 400);
      }
    }
    window.addEventListener("tableicty-show-theme-guide", handleShowThemeGuide);
    return () => window.removeEventListener("tableicty-show-theme-guide", handleShowThemeGuide);
  }, [guideKey]);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem(guideKey, "true");
  };

  return (
    <div className="relative" style={{ overflow: "visible" }}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        data-testid="button-theme-toggle"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      {showGuide && (
        <div
          className="absolute top-full right-0 mt-2 w-64 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
          data-testid="card-guide-theme-toggle"
        >
          <div className="absolute -top-2 right-3 w-4 h-4 rotate-45 bg-primary" />
          <div className="relative rounded-lg shadow-lg border bg-card overflow-hidden">
            <div className="h-1 bg-primary" />
            <div className="p-4">
              <button
                onClick={dismissGuide}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-dismiss-theme-guide"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="text-sm leading-relaxed pr-4">
                Toggle between Daylight and Night mode here to customize your viewing experience.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
