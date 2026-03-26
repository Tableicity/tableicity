import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrivacyToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function PrivacyToggle({ enabled, onToggle }: PrivacyToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className={`gap-2 transition-all duration-300 ${
              enabled
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400"
                : "bg-transparent border-border text-muted-foreground hover:bg-muted"
            }`}
            data-testid="button-privacy-toggle"
          >
            <Shield className={`h-4 w-4 ${enabled ? "text-emerald-400" : ""}`} />
            {enabled ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Encrypted View</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Normal View</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px]">
          <p className="text-xs">
            {enabled
              ? "Showing hashed identifiers. Stakeholder names are obscured with SHA-256 hashes. Click to reveal."
              : "Showing real names. Click to switch to privacy-first encrypted view."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
