import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, Play, ArrowLeft, ArrowRight, X } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EsopGrant, EsopPool, EsopPlan, Stakeholder, ShareClass } from "@shared/schema";

const grantFormSchema = z.object({
  grantName: z.string().min(1, "Grant name is required"),
  poolId: z.string().min(1, "Pool is required"),
  planId: z.string().min(1, "Plan is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  grantDate: z.string().min(1, "Grant date is required"),
  shares: z.coerce.number().int().positive("Shares must be greater than 0"),
  exercisePrice: z.string().min(1, "Exercise price is required"),
  underlyingShareClass: z.string().min(1, "Share class is required"),
  vestingStartDate: z.string().optional(),
  vestingDurationMonths: z.coerce.number().int().min(0).optional(),
  cliffMonths: z.coerce.number().int().min(0).optional(),
  vestFrequencyMonths: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});

type GrantFormValues = z.infer<typeof grantFormSchema>;

const defaultFormValues: GrantFormValues = {
  grantName: "",
  poolId: "",
  planId: "",
  stakeholderId: "",
  grantDate: new Date().toISOString().split("T")[0],
  shares: 0,
  exercisePrice: "",
  underlyingShareClass: "",
  vestingStartDate: new Date().toISOString().split("T")[0],
  vestingDurationMonths: 48,
  cliffMonths: 12,
  vestFrequencyMonths: 1,
  notes: "",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partially_exercised: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  fully_exercised: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  forfeited: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  partially_exercised: "Partially Exercised",
  fully_exercised: "Fully Exercised",
  forfeited: "Forfeited",
  cancelled: "Cancelled",
  expired: "Expired",
};

function computeVestedShares(grant: EsopGrant): number {
  if (!grant.vestingStartDate || !grant.vestingDurationMonths) return grant.shares;
  const start = new Date(grant.vestingStartDate);
  const now = new Date();
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (grant.cliffMonths && monthsElapsed < grant.cliffMonths) return 0;
  if (monthsElapsed >= grant.vestingDurationMonths) return grant.shares;
  const freq = grant.vestFrequencyMonths || 1;
  const vestingPeriods = Math.floor(monthsElapsed / freq);
  const totalPeriods = Math.floor(grant.vestingDurationMonths / freq);
  if (totalPeriods === 0) return grant.shares;
  return Math.min(grant.shares, Math.floor((grant.shares * vestingPeriods) / totalPeriods));
}

function formatCurrency(val: string | number | null | undefined): string {
  if (val == null || val === "") return "$0.00";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export default function GrantsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<EsopGrant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EsopGrant | null>(null);
  const [exerciseTarget, setExerciseTarget] = useState<EsopGrant | null>(null);
  const [exerciseShares, setExerciseShares] = useState("");
  const [showTestDrive, setShowTestDrive] = useState(() => {
    return localStorage.getItem("grants-test-drive-dismissed") !== "true";
  });
  const { toast } = useToast();

  const { data: grants = [], isLoading } = useQuery<EsopGrant[]>({ queryKey: ["/api/esop-grants"] });
  const { data: pools = [] } = useQuery<EsopPool[]>({ queryKey: ["/api/esop-pools"] });
  const { data: plans = [] } = useQuery<EsopPlan[]>({ queryKey: ["/api/esop-plans"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });
  const { data: shareClasses = [] } = useQuery<ShareClass[]>({ queryKey: ["/api/share-classes"] });

  const form = useForm<GrantFormValues>({
    resolver: zodResolver(grantFormSchema),
    defaultValues: defaultFormValues,
  });

  const selectedPoolId = form.watch("poolId");
  const filteredPlans = plans.filter(p => p.poolId === selectedPoolId);

  const createMutation = useMutation({
    mutationFn: async (data: GrantFormValues) => {
      await apiRequest("POST", "/api/esop-grants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      setAddOpen(false);
      form.reset(defaultFormValues);
      toast({ title: "Grant created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GrantFormValues> }) => {
      await apiRequest("PATCH", `/api/esop-grants/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      setEditingGrant(null);
      toast({ title: "Grant updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/esop-grants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      setDeleteTarget(null);
      toast({ title: "Grant deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const exerciseMutation = useMutation({
    mutationFn: async ({ id, sharesToExercise }: { id: string; sharesToExercise: number }) => {
      await apiRequest("PATCH", `/api/esop-grants/${id}/exercise`, { sharesToExercise });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
      setExerciseTarget(null);
      setExerciseShares("");
      toast({ title: "Options exercised", description: "Securities have been issued to the cap table." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function openAdd() {
    form.reset(defaultFormValues);
    setAddOpen(true);
  }

  function openEdit(grant: EsopGrant) {
    form.reset({
      grantName: grant.grantName,
      poolId: grant.poolId,
      planId: grant.planId,
      stakeholderId: grant.stakeholderId,
      grantDate: grant.grantDate,
      shares: grant.shares,
      exercisePrice: grant.exercisePrice,
      underlyingShareClass: grant.underlyingShareClass,
      vestingStartDate: grant.vestingStartDate || "",
      vestingDurationMonths: grant.vestingDurationMonths || 48,
      cliffMonths: grant.cliffMonths || 12,
      vestFrequencyMonths: grant.vestFrequencyMonths || 1,
      notes: grant.notes || "",
    });
    setEditingGrant(grant);
  }

  function openExercise(grant: EsopGrant) {
    setExerciseTarget(grant);
    const computed = computeVestedShares(grant);
    const exercisable = computed - (grant.exercisedShares || 0);
    setExerciseShares(exercisable > 0 ? String(exercisable) : "");
  }

  function onSubmit(values: GrantFormValues) {
    if (editingGrant) {
      updateMutation.mutate({ id: editingGrant.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const stakeholderName = (id: string) => stakeholders.find(s => s.id === id)?.name || "Unknown";
  const poolName = (id: string) => pools.find(p => p.id === id)?.name || "Unknown";
  const planName = (id: string) => plans.find(p => p.id === id)?.name || "Unknown";

  const totalShares = grants.reduce((sum, g) => sum + g.shares, 0);
  const totalVested = grants.reduce((sum, g) => sum + computeVestedShares(g), 0);
  const totalExercised = grants.reduce((sum, g) => sum + (g.exercisedShares || 0), 0);

  const dialogOpen = addOpen || !!editingGrant;
  const setDialogOpen = (open: boolean) => {
    if (!open) {
      setAddOpen(false);
      setEditingGrant(null);
    }
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="grantName" render={({ field }) => (
          <FormItem>
            <FormLabel>Grant Name</FormLabel>
            <FormControl><Input {...field} placeholder="e.g. John Smith — Stock Option Grant" data-testid="input-grant-name" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="poolId" render={({ field }) => (
            <FormItem>
              <FormLabel>Pool</FormLabel>
              <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("planId", ""); }}>
                <FormControl><SelectTrigger data-testid="select-pool"><SelectValue placeholder="Select pool" /></SelectTrigger></FormControl>
                <SelectContent>
                  {pools.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="planId" render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={!selectedPoolId}>
                <FormControl><SelectTrigger data-testid="select-plan"><SelectValue placeholder={selectedPoolId ? "Select plan" : "Select pool first"} /></SelectTrigger></FormControl>
                <SelectContent>
                  {filteredPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="stakeholderId" render={({ field }) => (
            <FormItem>
              <FormLabel>Stakeholder</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger data-testid="select-stakeholder"><SelectValue placeholder="Select stakeholder" /></SelectTrigger></FormControl>
                <SelectContent>
                  {stakeholders.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="grantDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Grant Date</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-grant-date" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="shares" render={({ field }) => (
            <FormItem>
              <FormLabel>Shares</FormLabel>
              <FormControl><Input type="number" {...field} data-testid="input-shares" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="exercisePrice" render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Price</FormLabel>
              <FormControl><Input {...field} placeholder="0.0000" data-testid="input-exercise-price" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="underlyingShareClass" render={({ field }) => (
            <FormItem>
              <FormLabel>Share Class</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger data-testid="select-share-class"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  {shareClasses.map(sc => <SelectItem key={sc.id} value={sc.name}>{sc.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Vesting Schedule</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="vestingStartDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Vesting Start Date</FormLabel>
                <FormControl><Input type="date" {...field} data-testid="input-vesting-start" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="vestingDurationMonths" render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (months)</FormLabel>
                <FormControl><Input type="number" {...field} data-testid="input-vesting-duration" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <FormField control={form.control} name="cliffMonths" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliff (months)</FormLabel>
                <FormControl><Input type="number" {...field} data-testid="input-cliff" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="vestFrequencyMonths" render={({ field }) => (
              <FormItem>
                <FormLabel>Vest every (months)</FormLabel>
                <FormControl><Input type="number" {...field} data-testid="input-vest-frequency" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Textarea {...field} placeholder="Additional notes..." rows={2} data-testid="input-notes" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <DialogFooter>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-grant">
            {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingGrant ? "Update Grant" : "Create Grant"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="p-6 space-y-6" data-testid="grants-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/equity-plans/plans">
            <Button variant="ghost" size="icon" data-testid="button-back-to-plans">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Equity Plans — Grants</h1>
            <p className="text-muted-foreground mt-1">Issue individual option grants to employees and advisors</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/equity-plans/exercising">
            <Button variant="outline" size="sm" data-testid="button-go-exercising">
              Exercising <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Button onClick={openAdd} data-testid="button-add-grant">
            <Plus className="h-4 w-4 mr-2" /> Add Grant
          </Button>
        </div>
      </div>

      {showTestDrive && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40" data-testid="card-test-drive-grants">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" role="img" aria-label="car">🚗</span>
                <div>
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Take a Test Drive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Before going live, explore every Grants feature using our pre-loaded test data. Walk through adding, editing, and managing your Grant — then check off each step as you go.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Do not proceed to the next section until all checklist items are marked complete.
                  </p>
                  <Link href="/data-room?category=test_drives">
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-start-test-drive-grants">
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
                onClick={() => { setShowTestDrive(false); localStorage.setItem("grants-test-drive-dismissed", "true"); }}
                data-testid="button-dismiss-test-drive-grants"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Granted</p>
            <p className="text-2xl font-bold mt-1" data-testid="text-total-granted">{totalShares.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vested</p>
            <p className="text-2xl font-bold mt-1" data-testid="text-total-vested">{totalVested.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Exercised</p>
            <p className="text-2xl font-bold mt-1" data-testid="text-total-exercised">{totalExercised.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">All Grants</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : grants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No grants yet. Click "Add Grant" to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grant Name</TableHead>
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Exercise Price</TableHead>
                  <TableHead>Vesting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grants.map(grant => {
                  const computed = computeVestedShares(grant);
                  const exercisable = computed - (grant.exercisedShares || 0);
                  const vestingPct = grant.shares > 0 ? Math.round((computed / grant.shares) * 100) : 0;
                  const canExercise = exercisable > 0 && grant.status !== "fully_exercised" && grant.status !== "cancelled" && grant.status !== "forfeited";

                  return (
                    <TableRow key={grant.id} data-testid={`row-grant-${grant.id}`}>
                      <TableCell className="font-medium">{grant.grantName}</TableCell>
                      <TableCell>{stakeholderName(grant.stakeholderId)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{planName(grant.planId)}</TableCell>
                      <TableCell className="text-right">{grant.shares.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(grant.exercisePrice)}</TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <Progress value={vestingPct} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {computed.toLocaleString()} / {grant.shares.toLocaleString()} ({vestingPct}%)
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[grant.status] || ""}>
                          {STATUS_LABELS[grant.status] || grant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canExercise && (
                            <Button variant="ghost" size="icon" onClick={() => openExercise(grant)} data-testid={`button-exercise-${grant.id}`}>
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(grant)} data-testid={`button-edit-${grant.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(grant)} data-testid={`button-delete-${grant.id}`}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGrant ? "Edit Grant" : "Add Grant"}</DialogTitle>
            <DialogDescription>
              {editingGrant ? "Update the grant details below." : "Issue a new option grant from a pool and plan."}
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.grantName}"? This will return {deleteTarget?.shares.toLocaleString()} shares to the pool. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!exerciseTarget} onOpenChange={(open) => { if (!open) { setExerciseTarget(null); setExerciseShares(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Options</DialogTitle>
            <DialogDescription>
              Convert vested options into shares on the cap table.
            </DialogDescription>
          </DialogHeader>
          {exerciseTarget && (() => {
            const computed = computeVestedShares(exerciseTarget);
            const exercisable = computed - (exerciseTarget.exercisedShares || 0);
            const sharesToEx = parseInt(exerciseShares) || 0;
            const totalCost = sharesToEx * parseFloat(exerciseTarget.exercisePrice || "0");

            return (
              <div className="space-y-4">
                <div className="rounded-md bg-muted p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Grant</span>
                    <span className="font-medium">{exerciseTarget.grantName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Shares</span>
                    <span>{exerciseTarget.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vested</span>
                    <span>{computed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Already Exercised</span>
                    <span>{(exerciseTarget.exercisedShares || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Exercisable Now</span>
                    <span className="text-green-600">{exercisable.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Shares to Exercise</label>
                  <Input
                    type="number"
                    value={exerciseShares}
                    onChange={(e) => setExerciseShares(e.target.value)}
                    max={exercisable}
                    min={1}
                    data-testid="input-exercise-shares"
                  />
                </div>

                {sharesToEx > 0 && (
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Exercise Preview</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 dark:text-blue-300">Shares to Issue</span>
                      <span className="font-medium">{sharesToEx.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 dark:text-blue-300">Exercise Price</span>
                      <span>{formatCurrency(exerciseTarget.exercisePrice)}/share</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t border-blue-200 dark:border-blue-800 pt-2">
                      <span className="text-blue-800 dark:text-blue-200">Total Exercise Cost</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 dark:text-blue-300">Share Class</span>
                      <span>{exerciseTarget.underlyingShareClass}</span>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    onClick={() => exerciseTarget && exerciseMutation.mutate({ id: exerciseTarget.id, sharesToExercise: sharesToEx })}
                    disabled={sharesToEx <= 0 || sharesToEx > exercisable || exerciseMutation.isPending}
                    data-testid="button-confirm-exercise"
                  >
                    {exerciseMutation.isPending ? "Exercising..." : `Exercise ${sharesToEx > 0 ? sharesToEx.toLocaleString() : 0} Options`}
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
