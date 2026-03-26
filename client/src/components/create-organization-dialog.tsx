import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tenantSlug: string) => void;
}

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

const orgSizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

const timezones = [
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European" },
  { value: "Asia/Tokyo", label: "Japan Standard" },
  { value: "Asia/Shanghai", label: "China Standard" },
  { value: "Australia/Sydney", label: "Australian Eastern" },
];

export function CreateOrganizationDialog({ open, onOpenChange, onCreated }: CreateOrganizationDialogProps) {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [orgSize, setOrgSize] = useState("");
  const [timeZone, setTimeZone] = useState("America/Los_Angeles");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast({ title: "Required", description: "Organization name is required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/organizations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: orgName.trim(),
          phone,
          language,
          orgSize: orgSize || undefined,
          timeZone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to create organization.", variant: "destructive" });
        return;
      }

      toast({ title: "Organization Created", description: `"${data.tenantName}" has been created successfully.` });
      setOrgName("");
      setPhone("");
      setLanguage("en");
      setOrgSize("");
      setTimeZone("America/Los_Angeles");
      onCreated(data.tenantSlug);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle data-testid="text-create-org-dialog-title">Create Your Organization</DialogTitle>
          <DialogDescription>Set up your real cap table to start managing equity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-org-name">Organization Name *</Label>
            <Input
              id="dialog-org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., My Startup Inc."
              data-testid="input-dialog-org-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-phone">Phone Number</Label>
            <Input
              id="dialog-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              data-testid="input-dialog-phone"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger data-testid="select-dialog-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select value={orgSize} onValueChange={setOrgSize}>
                <SelectTrigger data-testid="select-dialog-org-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {orgSizes.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Time Zone</Label>
            <Select value={timeZone} onValueChange={setTimeZone}>
              <SelectTrigger data-testid="select-dialog-timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-testid="button-cancel-create-org"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !orgName.trim()}
              data-testid="button-submit-create-org"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
