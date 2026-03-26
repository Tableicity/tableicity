import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FilePlus2,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  DollarSign,
  User,
  FileText,
  Save,
  Search,
  Info,
  FolderLock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatCurrencyFull, getInitials, getAvatarColor } from "@/lib/format";
import type { Stakeholder, InvestmentRound } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

interface WizardData {
  stakeholderId: string;
  stakeholderName: string;
  stakeholderEmail: string;
  stakeholderAddress: string;
  investmentAmount: string;
  valuationCap: string;
  discountRate: string;
  safeType: string;
  investmentRoundId: string;
  investmentRoundName: string;
  raiseGoal: string;
  endDate: string;
  issueDate: string;
  notes: string;
}

const defaultWizardData: WizardData = {
  stakeholderId: "",
  stakeholderName: "",
  stakeholderEmail: "",
  stakeholderAddress: "",
  investmentAmount: "",
  valuationCap: "",
  discountRate: "",
  safeType: "post-money",
  investmentRoundId: "",
  investmentRoundName: "",
  raiseGoal: "",
  endDate: "",
  issueDate: new Date().toISOString().split("T")[0],
  notes: "",
};

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Investor Details", icon: User },
    { num: 2, label: "SAFE Details", icon: DollarSign },
    { num: 3, label: "Finalize", icon: FileText },
  ];

  return (
    <div className="flex items-center justify-center mb-8" data-testid="wizard-step-indicator">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                currentStep >= step.num
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
              data-testid={`step-indicator-${step.num}`}
            >
              {currentStep > step.num ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                currentStep >= step.num ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-20 h-0.5 mx-2 mb-5 ${
                currentStep > step.num ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1InvestorDetails({
  data,
  onUpdate,
  onNext,
  getDisplayName,
  privacyEnabled,
}: {
  data: WizardData;
  onUpdate: (d: Partial<WizardData>) => void;
  onNext: () => void;
  getDisplayName: (id: string, name: string) => string;
  privacyEnabled: boolean;
}) {
  const [search, setSearch] = useState("");

  const { data: stakeholders = [], isLoading } = useQuery<Stakeholder[]>({
    queryKey: ["/api/stakeholders"],
  });

  const investors = stakeholders.filter(
    (s) => s.type === "investor"
  );

  const filtered = search
    ? investors.filter((s) =>
        getDisplayName(s.id, s.name).toLowerCase().includes(search.toLowerCase())
      )
    : investors;

  const selectedStakeholder = stakeholders.find(
    (s) => s.id === data.stakeholderId
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Select Investor</h3>
        <p className="text-sm text-muted-foreground">
          Choose the stakeholder who is making this SAFE investment
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search investors and founders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-investor-search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No investors found</p>
          <p className="text-xs mt-1">Add stakeholders with type "investor" first</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto" data-testid="investor-list">
          {filtered.map((s) => {
            const isSelected = data.stakeholderId === s.id;
            const displayName = getDisplayName(s.id, s.name);
            return (
              <button
                key={s.id}
                onClick={() =>
                  onUpdate({
                    stakeholderId: s.id,
                    stakeholderName: s.name,
                    stakeholderEmail: s.email,
                    stakeholderAddress: s.address || "",
                  })
                }
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
                data-testid={`investor-option-${s.id}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    style={{ backgroundColor: privacyEnabled ? "#374151" : getAvatarColor(s.name), color: "#FFFFFF" }}
                    className={`text-sm font-medium ${privacyEnabled ? "font-mono" : ""}`}
                  >
                    {privacyEnabled ? "#" : getInitials(s.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {privacyEnabled ? "••••@••••" : (s.email || "No email")} · {s.type}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedStakeholder && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 px-4">
            <p className="text-sm font-medium">
              Selected: <span className="text-primary">{getDisplayName(selectedStakeholder.id, selectedStakeholder.name)}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!data.stakeholderId}
          data-testid="button-next-step"
        >
          Next: SAFE Details
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function Step2SafeDetails({
  data,
  onUpdate,
  onNext,
  onBack,
}: {
  data: WizardData;
  onUpdate: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [showNewRound, setShowNewRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const { toast } = useToast();

  const { data: rounds = [] } = useQuery<InvestmentRound[]>({
    queryKey: ["/api/investment-rounds"],
  });

  const createRound = useMutation({
    mutationFn: async (roundName: string) => {
      const res = await apiRequest("POST", "/api/investment-rounds", { roundName });
      return res.json();
    },
    onSuccess: (round: InvestmentRound) => {
      queryClient.invalidateQueries({ queryKey: ["/api/investment-rounds"] });
      onUpdate({
        investmentRoundId: round.id,
        investmentRoundName: round.roundName,
      });
      setShowNewRound(false);
      setNewRoundName("");
      toast({ title: "Investment round created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isValid =
    data.investmentAmount && parseFloat(data.investmentAmount) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">SAFE Details</h3>
        <p className="text-sm text-muted-foreground">
          Configure the terms for this SAFE agreement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="investmentAmount">Investment Amount *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="investmentAmount"
              type="number"
              placeholder="100000"
              value={data.investmentAmount}
              onChange={(e) => onUpdate({ investmentAmount: e.target.value })}
              className="pl-9"
              data-testid="input-investment-amount"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valuationCap">Valuation Cap</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="valuationCap"
              type="number"
              placeholder="10000000"
              value={data.valuationCap}
              onChange={(e) => onUpdate({ valuationCap: e.target.value })}
              className="pl-9"
              data-testid="input-valuation-cap"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountRate">Discount Rate (%)</Label>
          <Input
            id="discountRate"
            type="number"
            placeholder="20"
            value={data.discountRate}
            onChange={(e) => onUpdate({ discountRate: e.target.value })}
            data-testid="input-discount-rate"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="safeType">SAFE Type</Label>
          <Select
            value={data.safeType}
            onValueChange={(v) => onUpdate({ safeType: v })}
          >
            <SelectTrigger data-testid="select-safe-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="post-money">Post-Money</SelectItem>
              <SelectItem value="pre-money">Pre-Money</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            value={data.issueDate}
            onChange={(e) => onUpdate({ issueDate: e.target.value })}
            data-testid="input-issue-date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="raiseGoal">Raise Goal</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="raiseGoal"
              type="number"
              placeholder="1000000"
              value={data.raiseGoal}
              onChange={(e) => onUpdate({ raiseGoal: e.target.value })}
              className="pl-9"
              data-testid="input-raise-goal"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={data.endDate}
            onChange={(e) => onUpdate({ endDate: e.target.value })}
            data-testid="input-end-date"
          />
        </div>

        <div className="space-y-2">
          <Label>Investment Round</Label>
          <div className="flex gap-2">
            <Select
              value={data.investmentRoundId}
              onValueChange={(v) => {
                const round = rounds.find((r) => r.id === v);
                onUpdate({
                  investmentRoundId: v,
                  investmentRoundName: round?.roundName || "",
                });
              }}
            >
              <SelectTrigger className="flex-1" data-testid="select-investment-round">
                <SelectValue placeholder="Select round (optional)" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.roundName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNewRound(true)}
              data-testid="button-new-round"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4" data-testid="safe-terms-info">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium mb-1">About SAFE Terms</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A valuation cap establishes the maximum company valuation at which the SAFE will convert into equity, while a discount provides the investor with a reduced price per share relative to the next priced equity round.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back-step">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} data-testid="button-next-step">
          Next: Finalize
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <Dialog open={showNewRound} onOpenChange={setShowNewRound}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Investment Round</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newRoundName">Round Name</Label>
              <Input
                id="newRoundName"
                placeholder="e.g. Seed, Series A"
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                data-testid="input-new-round-name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewRound(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createRound.mutate(newRoundName)}
                disabled={!newRoundName.trim() || createRound.isPending}
                data-testid="button-create-round"
              >
                {createRound.isPending ? "Creating..." : "Create Round"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Step3Finalize({
  data,
  onBack,
  onImportToTemplate,
  isSaving,
  getDisplayName,
}: {
  data: WizardData;
  onBack: () => void;
  onImportToTemplate: () => void;
  isSaving: boolean;
  getDisplayName: (id: string, name: string) => string;
}) {
  const reviewItems = [
    { label: "Investor", value: getDisplayName(data.stakeholderId, data.stakeholderName) },
    {
      label: "Investment Amount",
      value: formatCurrencyFull(parseFloat(data.investmentAmount) || 0),
    },
    {
      label: "Valuation Cap",
      value: data.valuationCap
        ? formatCurrencyFull(parseFloat(data.valuationCap))
        : "Not set",
    },
    {
      label: "Discount Rate",
      value: data.discountRate ? `${data.discountRate}%` : "Not set",
    },
    {
      label: "SAFE Type",
      value: data.safeType === "post-money" ? "Post-Money" : "Pre-Money",
    },
    { label: "Issue Date", value: data.issueDate || "Not set" },
    {
      label: "Raise Goal",
      value: data.raiseGoal
        ? formatCurrencyFull(parseFloat(data.raiseGoal))
        : "Not set",
    },
    { label: "End Date", value: data.endDate || "Not set" },
    {
      label: "Investment Round",
      value: data.investmentRoundName || "None",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Review & Finalize</h3>
        <p className="text-sm text-muted-foreground">
          Review the SAFE agreement details before saving
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {reviewItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-2 border-b last:border-0"
                data-testid={`review-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
          {data.notes && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{data.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back-step">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onImportToTemplate}
            disabled={isSaving}
            data-testid="button-import-template"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isSaving ? "Preparing..." : "Prepare Document"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SafeCreateWizard({ onCancel, privacy }: { onCancel: () => void; privacy: ReturnType<typeof usePrivacyMode> }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(defaultWizardData);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const update = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const saveMutation = useMutation({
    mutationFn: async ({ status, redirectToTemplate }: { status: string; redirectToTemplate?: boolean }) => {
      const templateVariables: Record<string, string> = {
        investor_name: data.stakeholderName,
        investor_email: data.stakeholderEmail || "",
        investor_address: data.stakeholderAddress || "",
        purchase_amount: data.investmentAmount ? `$${parseFloat(data.investmentAmount).toLocaleString("en-US")}` : "",
        investment_round: data.investmentRoundName || "",
        valuation_cap: data.valuationCap ? `$${parseFloat(data.valuationCap).toLocaleString("en-US")}` : "",
        pre_post_money: data.safeType === "post-money" ? "Post" : "Pre",
        discount_percentage: data.discountRate ? `${data.discountRate}%` : "",
        raise_goal: data.raiseGoal ? `$${parseFloat(data.raiseGoal).toLocaleString("en-US")}` : "",
        end_date: data.endDate || "",
        effective_date: data.issueDate || new Date().toISOString().split("T")[0],
        notes: "",
      };
      const payload: Record<string, unknown> = {
        stakeholderId: data.stakeholderId,
        investmentAmount: data.investmentAmount,
        safeType: data.safeType,
        status,
        issueDate: data.issueDate || null,
        notes: data.notes || null,
        valuationCap: data.valuationCap || null,
        discountRate: data.discountRate || null,
        investmentRoundId: data.investmentRoundId || null,
        investmentRoundName: data.investmentRoundName || null,
        raiseGoal: data.raiseGoal || null,
        endDate: data.endDate || null,
        templateVariables: status === "sent_to_template" ? templateVariables : null,
      };
      const res = await apiRequest("POST", "/api/safes", payload);
      return res.json();
    },
    onSuccess: (result, { status, redirectToTemplate }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/safes"] });
      if (redirectToTemplate) {
        toast({
          title: "Variables imported to Template",
          description: `Review and download your SAFE agreement for ${data.stakeholderName}.`,
        });
        navigate(`/financing/safe-template?safeId=${result.id}`);
      } else {
        toast({
          title: "Sent for signing",
          description: `SAFE agreement for ${data.stakeholderName} has been sent for signing.`,
        });
        navigate("/safes");
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-2xl mx-auto" data-testid="safe-create-wizard">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel} data-testid="button-cancel-wizard">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Create SAFE Agreement</h2>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>
        <PrivacyToggle enabled={privacy.enabled} onToggle={privacy.toggle} />
      </div>

      <StepIndicator currentStep={step} />

      <Card>
        <CardContent className="pt-6">
          {step === 1 && (
            <Step1InvestorDetails
              data={data}
              onUpdate={update}
              onNext={() => setStep(2)}
              getDisplayName={privacy.getDisplayName}
              privacyEnabled={privacy.enabled}
            />
          )}
          {step === 2 && (
            <Step2SafeDetails
              data={data}
              onUpdate={update}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3Finalize
              data={data}
              onBack={() => setStep(2)}
              onImportToTemplate={() => saveMutation.mutate({ status: "sent_to_template", redirectToTemplate: true })}
              isSaving={saveMutation.isPending}
              getDisplayName={privacy.getDisplayName}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SafeCreatePage() {
  const [showWizard, setShowWizard] = useState(false);
  const [, navigate] = useLocation();
  const privacy = usePrivacyMode();

  const { data: safes = [] } = useQuery<any[]>({
    queryKey: ["/api/safes"],
  });

  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({
    queryKey: ["/api/stakeholders"],
  });

  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  const recentDrafts = safes.filter((s) => s.status === "draft" || s.status === "sent_to_template").slice(0, 5);

  if (showWizard) {
    return (
      <div className="p-6">
        <SafeCreateWizard onCancel={() => setShowWizard(false)} privacy={privacy} />
        <PlatformDisclaimer />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="safe-create-landing">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">SAFE Create</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage SAFE agreements for your investors
          </p>
        </div>
        <PrivacyToggle enabled={privacy.enabled} onToggle={privacy.toggle} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total SAFEs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-safes">{safes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-draft-safes">
              {safes.filter((s) => s.status === "draft").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-invested">
              {formatCurrency(
                safes.reduce(
                  (sum, s) => sum + (parseFloat(s.investmentAmount) || 0),
                  0
                )
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
          <CardDescription>
            Create a new SAFE agreement using our step-by-step wizard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 p-4 rounded-lg border border-dashed">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <FilePlus2 className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">New SAFE Agreement</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Walk through 3 simple steps: select investor, configure terms,
                and finalize the agreement.
              </p>
            </div>
            <Button onClick={() => setShowWizard(true)} data-testid="button-start-wizard">
              Start Wizard
            </Button>
          </div>
        </CardContent>
      </Card>

      {recentDrafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Drafts</CardTitle>
            <CardDescription>
              Continue working on your draft SAFE agreements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`draft-item-${draft.id}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {privacy.getDisplayName(draft.stakeholderId, stakeholderMap.get(draft.stakeholderId)?.name || "Unknown Investor")} · {formatCurrency(draft.investmentAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {draft.safeType} · {draft.issueDate || "No date"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/data-room")}
                      data-testid={`button-dataroom-draft-${draft.id}`}
                      title="View in Data Room"
                    >
                      <FolderLock className="h-3.5 w-3.5" />
                    </Button>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <PlatformDisclaimer />
    </div>
  );
}
