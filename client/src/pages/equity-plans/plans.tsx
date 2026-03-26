import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Info, ArrowRight, ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/format";
import type { EsopPlan, EsopPool } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  poolId: z.string().min(1, "Pool is required"),
  approvedDate: z.string().min(1, "Date is required"),
  grantType: z.string().min(1, "Grant type is required"),
  grantPresets: z.string().optional(),
  documents: z.string().optional(),
  internalNote: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const grantTypeLabels: Record<string, string> = {
  stock_options: "Stock Options",
  phantom: "Phantom",
  stock: "Stock",
  sars: "SARs",
  warrants: "Warrants",
};

const grantTypeColors: Record<string, string> = {
  stock_options: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  phantom: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  stock: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  sars: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  warrants: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
};

function GrantPresetsSection({ formControl, prefix, presetsOpen, setPresetsOpen, grantType, bannerVariant = "add" }: {
  formControl: any;
  prefix: string;
  presetsOpen: boolean;
  setPresetsOpen: (v: boolean) => void;
  grantType: string;
  bannerVariant?: "add" | "edit";
}) {
  const [pricesOpen, setPricesOpen] = useState(false);
  const [vestingOpen, setVestingOpen] = useState(false);
  const [definitionsOpen, setDefinitionsOpen] = useState(false);
  const [terminationOpen, setTerminationOpen] = useState(false);

  return (
    <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2">
        {presetsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Grant Presets
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pl-1">
        <div className={`rounded-md p-3 ${bannerVariant === "edit" ? "bg-teal-100 dark:bg-teal-950/40" : "bg-purple-100 dark:bg-purple-950/40"}`}>
          <p className={`text-sm ${bannerVariant === "edit" ? "text-teal-800 dark:text-teal-200" : "text-purple-800 dark:text-purple-200"}`}>
            These presets will be applied to all new grants from this plan
          </p>
        </div>

        <Collapsible open={pricesOpen} onOpenChange={setPricesOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2 pl-2">
            {pricesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Prices
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4">
            <FormField control={formControl} name="grantPresets" render={({ field }) => {
              const parsed = safeParsePresets(field.value);
              const update = (patch: Partial<PresetData>) => field.onChange(JSON.stringify({ ...parsed, ...patch }));

              if (grantType === "phantom") {
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Purchase price <span className="text-xs text-muted-foreground font-normal">optional</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={parsed.purchasePrice}
                          onChange={(e) => update({ purchasePrice: e.target.value })}
                          placeholder="Purchase price"
                          data-testid={`${prefix}input-purchase-price`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD / SHARE</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (grantType === "sars") {
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1">
                        Price per share on grant day
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            The fair market value of a share on the day the SAR is granted
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <div className="relative">
                        <Input
                          value={parsed.strikePrice}
                          onChange={(e) => update({ strikePrice: e.target.value })}
                          placeholder="0.00"
                          data-testid={`${prefix}input-strike-price`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD / SHARE</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Purchase price <span className="text-xs text-muted-foreground font-normal">optional</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={parsed.purchasePrice}
                          onChange={(e) => update({ purchasePrice: e.target.value })}
                          placeholder="Purchase price"
                          data-testid={`${prefix}input-purchase-price`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD / SHARE</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Strike price
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          The price employee will have to pay to exercise the option to acquire a share
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-muted-foreground font-normal">optional</span>
                    </label>
                    <div className="relative">
                      <Input
                        value={parsed.strikePrice}
                        onChange={(e) => update({ strikePrice: e.target.value })}
                        placeholder="Strike price"
                        data-testid={`${prefix}input-strike-price`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD / SHARE</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Purchase price <span className="text-xs text-muted-foreground font-normal">optional</span>
                    </label>
                    <div className="relative">
                      <Input
                        value={parsed.purchasePrice}
                        onChange={(e) => update({ purchasePrice: e.target.value })}
                        placeholder="Purchase price"
                        data-testid={`${prefix}input-purchase-price`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD / SHARE</span>
                    </div>
                  </div>
                </div>
              );
            }} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={vestingOpen} onOpenChange={setVestingOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2 pl-2">
            {vestingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Vesting
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4">
            <FormField control={formControl} name="grantPresets" render={({ field }) => {
              const parsed = safeParsePresets(field.value);
              const update = (patch: Partial<PresetData>) => field.onChange(JSON.stringify({ ...parsed, ...patch }));
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Type</label>
                      <Select value={parsed.vestingType || "time_simple"} onValueChange={(v) => update({ vestingType: v })}>
                        <SelectTrigger data-testid={`${prefix}select-vesting-type`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time_simple">Time (simple)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Start date <span className="text-xs text-muted-foreground font-normal">optional</span>
                      </label>
                      <Input
                        type="date"
                        value={parsed.vestingStartDate}
                        onChange={(e) => update({ vestingStartDate: e.target.value })}
                        data-testid={`${prefix}input-vesting-start-date`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Duration</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={parsed.vestingDuration}
                          onChange={(e) => update({ vestingDuration: e.target.value })}
                          data-testid={`${prefix}input-vesting-duration`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">MONTHS</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Vest every</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={parsed.vestEvery}
                          onChange={(e) => update({ vestEvery: e.target.value })}
                          data-testid={`${prefix}input-vest-every`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">MONTHS</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Cliff</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={parsed.vestingCliff}
                          onChange={(e) => update({ vestingCliff: e.target.value })}
                          data-testid={`${prefix}input-vesting-cliff`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">MONTHS</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={definitionsOpen} onOpenChange={setDefinitionsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2 pl-2">
            {definitionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Definitions
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Good leaver, bad leaver, and liquidation event definitions. Stockholders will be able to see these.
              </TooltipContent>
            </Tooltip>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4">
            <FormField control={formControl} name="grantPresets" render={({ field }) => {
              const parsed = safeParsePresets(field.value);
              return (
                <FormItem>
                  <FormControl>
                    <Textarea
                      value={parsed.definitions}
                      onChange={(e) => field.onChange(JSON.stringify({ ...parsed, definitions: e.target.value }))}
                      placeholder="Good leaver, bad leaver, liquidation event definitions..."
                      rows={3}
                      data-testid={`${prefix}input-preset-definitions`}
                    />
                  </FormControl>
                </FormItem>
              );
            }} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={terminationOpen} onOpenChange={setTerminationOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2 pl-2">
            {terminationOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Termination Periods
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Exercise windows and deadlines after employment termination for different leaver categories.
              </TooltipContent>
            </Tooltip>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4">
            <FormField control={formControl} name="grantPresets" render={({ field }) => {
              const parsed = safeParsePresets(field.value);
              return (
                <FormItem>
                  <FormControl>
                    <Textarea
                      value={parsed.terminationPeriods}
                      onChange={(e) => field.onChange(JSON.stringify({ ...parsed, terminationPeriods: e.target.value }))}
                      placeholder="Exercise periods after termination for good leaver, bad leaver..."
                      rows={3}
                      data-testid={`${prefix}input-preset-termination`}
                    />
                  </FormControl>
                </FormItem>
              );
            }} />
          </CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface PresetData {
  strikePrice: string;
  purchasePrice: string;
  vestingType: string;
  vestingStartDate: string;
  vestingDuration: string;
  vestEvery: string;
  vestingCliff: string;
  definitions: string;
  terminationPeriods: string;
}

function safeParsePresets(value: string | undefined): PresetData {
  const empty: PresetData = { strikePrice: "", purchasePrice: "", vestingType: "time_simple", vestingStartDate: "", vestingDuration: "48", vestEvery: "1", vestingCliff: "12", definitions: "", terminationPeriods: "" };
  if (!value) return empty;
  try {
    const parsed = JSON.parse(value);
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

export default function PlansPage() {
  const initialPoolId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("poolId") || "" : "";
  const [addOpen, setAddOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EsopPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EsopPlan | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [editPresetsOpen, setEditPresetsOpen] = useState(false);
  const [editDocsOpen, setEditDocsOpen] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [poolFilter, setPoolFilter] = useState<string>(initialPoolId);
  const [showTestDrive, setShowTestDrive] = useState(() => {
    return localStorage.getItem("plans-test-drive-dismissed") !== "true";
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: plans = [], isLoading } = useQuery<EsopPlan[]>({ queryKey: ["/api/esop-plans"] });
  const { data: pools = [] } = useQuery<EsopPool[]>({ queryKey: ["/api/esop-pools"] });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      poolId: "",
      approvedDate: new Date().toISOString().split("T")[0],
      grantType: "stock_options",
      grantPresets: "",
      documents: "",
      internalNote: "",
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      poolId: "",
      approvedDate: "",
      grantType: "stock_options",
      grantPresets: "",
      documents: "",
      internalNote: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/esop-plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-plans"] });
      setAddOpen(false);
      form.reset();
      setPresetsOpen(false);
      setDocsOpen(false);
      setNoteOpen(false);
      toast({ title: "Plan created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormValues> }) => {
      const res = await apiRequest("PATCH", `/api/esop-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-plans"] });
      setEditingPlan(null);
      toast({ title: "Plan updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/esop-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-plans"] });
      setDeleteTarget(null);
      toast({ title: "Plan deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function openEdit(plan: EsopPlan) {
    setEditingPlan(plan);
    editForm.reset({
      name: plan.name,
      poolId: plan.poolId,
      approvedDate: plan.approvedDate,
      grantType: plan.grantType,
      grantPresets: plan.grantPresets || "",
      documents: plan.documents || "",
      internalNote: plan.internalNote || "",
    });
    setEditPresetsOpen(false);
    setEditDocsOpen(false);
    setEditNoteOpen(false);
  }

  const poolMap = new Map(pools.map((p) => [p.id, p]));
  const filteredPlans = poolFilter && poolFilter !== "all"
    ? plans.filter((p) => p.poolId === poolFilter)
    : plans;

  return (
    <div className="p-6 space-y-6" data-testid="plans-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/equity-plans/pools")} data-testid="button-back-to-pools">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Equity Plans — Plans</h1>
          <p className="text-muted-foreground mt-1">Define the conditions and rules for your ESOP grants</p>
        </div>
      </div>

      {showTestDrive && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40" data-testid="card-test-drive-plans">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" role="img" aria-label="car">🚗</span>
                <div>
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Take a Test Drive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Before going live, explore every Plans feature using our pre-loaded test data. Walk through adding, editing, and managing your Plan — then check off each step as you go.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Do not proceed to the next section until all checklist items are marked complete.
                  </p>
                  <Link href="/data-room?category=test_drives">
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-start-test-drive-plans">
                      Start Test Drive
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 shrink-0"
                onClick={() => { setShowTestDrive(false); localStorage.setItem("plans-test-drive-dismissed", "true"); }}
                data-testid="button-dismiss-test-drive-plans"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">How to Create a Plan</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm text-muted-foreground">
            <p>
              Once the pool has been created, it's time to create the plan. The plan defines the conditions that will apply to the grants issued under it, including key terms such as vesting, strike price or leaver definitions. These conditions will automatically apply to all grants linked to the plan, although they can be customized for specific grants if exceptions are needed.
            </p>
            <div className="border-t pt-4">
              <p className="font-semibold text-foreground mb-2">5 Types of Financial Instruments</p>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground">Stock Options</p>
                  <p>Companies use stock options for compensation plans. When granted, employees receive equity upon exercising under several conditions. Employees pay only the strike price (a discount on fair market value) and hold shares until deciding to sell.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Stock</p>
                  <p>When stocks are granted, employees receive shares at the moment of the grant. These can be exercised right away without waiting for vesting. Employees become shareholders immediately.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Phantom Shares</p>
                  <p>Also known as virtual stock options. Upon exercising or when a liquidity event happens, employees receive cash directly rather than equity. Employees are granted the right to a payment at a prespecified time or during particular circumstances.</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="font-semibold text-foreground">SARs (Stock Appreciation Rights)</p>
                <p>SARs allow employees to benefit from the appreciation of a company's stock price. Owners are compensated with cash distributions equal to the increase in stock price over a particular period. No upfront costs required.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Warrants</p>
                <p>Agreements that give the holder the right to purchase shares at a specified price. Primarily issued to investors. They have an expiration date and can include a vesting schedule.</p>
              </div>
            </div>

            <div className="border-t pt-4 bg-amber-50 dark:bg-amber-950/30 rounded-md p-3">
              <p className="text-amber-800 dark:text-amber-200 font-medium text-xs">⚠ If in doubt about grant type</p>
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                Review your legal documents or ask your lawyer. The grant type has important implications for the cap table and tax treatment.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Plans</p>
                <Select value={poolFilter} onValueChange={setPoolFilter}>
                  <SelectTrigger className="h-8 w-[200px] text-xs" data-testid="select-pool-filter">
                    <SelectValue placeholder="All Pools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pools</SelectItem>
                    {pools.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={() => { form.reset(); setAddOpen(true); setPresetsOpen(false); setDocsOpen(false); setNoteOpen(false); }}
                disabled={pools.length === 0}
                data-testid="button-add-plan"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Plan
              </Button>
            </div>

            {pools.length === 0 && (
              <div className="px-5 py-3">
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-md p-3">
                  <p className="text-amber-800 dark:text-amber-200 text-xs font-medium">
                    You need to create at least one Pool before creating a Plan.{" "}
                    <span className="underline cursor-pointer" onClick={() => navigate("/equity-plans/pools")} data-testid="link-go-to-pools">
                      Go to Pools
                    </span>
                  </p>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Plan Name</TableHead>
                  <TableHead>From Pool</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Grant Type</TableHead>
                  <TableHead className="text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2].map((i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        {plans.length === 0
                          ? "No plans yet. Click ADD PLAN to create your first plan."
                          : "No plans found for the selected pool."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => {
                    const pool = poolMap.get(plan.poolId);
                    return (
                      <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`}>
                        <TableCell className="pl-5 font-medium text-sm">{plan.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{pool?.name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(plan.approvedDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${grantTypeColors[plan.grantType] || ""}`}>
                            {grantTypeLabels[plan.grantType] || plan.grantType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(plan)} data-testid={`button-delete-plan-${plan.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {plans.length > 0 && (
              <div className="px-5 py-4 border-t flex justify-end">
                <Button onClick={() => navigate("/equity-plans/grants")} data-testid="button-next-grants">
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Plan</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="IT Phantoms, Options pool, ..." autoComplete="off" data-testid="input-plan-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="poolId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>From pool</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-plan-pool">
                          <SelectValue placeholder="Select pool" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pools.map((pool) => (
                          <SelectItem key={pool.id} value={pool.id}>{pool.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="approvedDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-plan-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="grantType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Grant type
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Choose the type of equity instrument. This affects cap table calculations and tax treatment.
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-grant-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stock_options">Stock Options</SelectItem>
                        <SelectItem value="stock">Stock (RSUs / Direct Grants)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <GrantPresetsSection formControl={form.control} prefix="" presetsOpen={presetsOpen} setPresetsOpen={setPresetsOpen} grantType={form.watch("grantType")} />

              <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2">
                  {docsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Documents
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <FormField control={form.control} name="documents" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Reference documents, board resolutions, legal agreements..." rows={3} data-testid="input-plan-documents" />
                      </FormControl>
                    </FormItem>
                  )} />
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={noteOpen} onOpenChange={setNoteOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2">
                  {noteOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Internal Note
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Internal notes are only visible to admins
                    </TooltipContent>
                  </Tooltip>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <FormField control={form.control} name="internalNote" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Internal notes about this plan..." rows={3} data-testid="input-plan-internal-note" />
                      </FormControl>
                    </FormItem>
                  )} />
                </CollapsibleContent>
              </Collapsible>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Close</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-plan">
                  {createMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPlan} onOpenChange={(v) => { if (!v) setEditingPlan(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: editingPlan!.id, data }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="IT Phantoms, Options pool, ..." autoComplete="off" data-testid="input-edit-plan-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="poolId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>From pool</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-plan-pool">
                          <SelectValue placeholder="Select pool" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pools.map((pool) => (
                          <SelectItem key={pool.id} value={pool.id}>{pool.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="approvedDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-edit-plan-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="grantType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Grant type
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Choose the type of equity instrument. This affects cap table calculations and tax treatment.
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-grant-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stock_options">Stock Options</SelectItem>
                        <SelectItem value="stock">Stock (RSUs / Direct Grants)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <GrantPresetsSection formControl={editForm.control} prefix="edit-" presetsOpen={editPresetsOpen} setPresetsOpen={setEditPresetsOpen} grantType={editForm.watch("grantType")} bannerVariant="edit" />

              <Collapsible open={editDocsOpen} onOpenChange={setEditDocsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2">
                  {editDocsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Documents
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <FormField control={editForm.control} name="documents" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Reference documents, board resolutions, legal agreements..." rows={3} data-testid="input-edit-plan-documents" />
                      </FormControl>
                    </FormItem>
                  )} />
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={editNoteOpen} onOpenChange={setEditNoteOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide w-full py-2">
                  {editNoteOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Internal Note
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Internal notes are only visible to admins
                    </TooltipContent>
                  </Tooltip>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <FormField control={editForm.control} name="internalNote" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Internal notes about this plan..." rows={3} data-testid="input-edit-plan-internal-note" />
                      </FormControl>
                    </FormItem>
                  )} />
                </CollapsibleContent>
              </Collapsible>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>Close</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-plan">
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the plan "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-plan">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete-plan"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
