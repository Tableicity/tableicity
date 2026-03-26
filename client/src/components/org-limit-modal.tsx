import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface OrgLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgLimitModal({ open, onOpenChange }: OrgLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle data-testid="text-org-limit-title">Organization Limit Reached</DialogTitle>
          </div>
          <DialogDescription>
            Your current plan allows 1 organization. Upgrade to Pro to manage
            multiple cap tables for serial entrepreneurs and portfolio companies.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-limit-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              window.location.href = "/launch/create-organization";
            }}
            data-testid="button-view-pricing"
          >
            Create Organization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
