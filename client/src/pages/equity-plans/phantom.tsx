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
import { Plus, Pencil, Trash2, DollarSign, X, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PhantomGrant, Stakeholder } from "@shared/schema";

const phantomFormSchema = z.object({
  grantName: z.string().min(1, "Grant name is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  grantDate: z.string().min(1, "Grant date is required"),
  sharesEquivalent: z.coerce.number().int().positive("Units must be greater than 0"),
  grantPricePerUnit: z.string().min(1, "Grant price is required"),
  planType: z.enum(["appreciation_only", "full_value"]),
  payoutTrigger: z.enum(["exit", "ipo", "milestone", "annual", "termination"]),
  vestingSchedule: z.string().optional(),
  cliffMonths: z.coerce.number().int().min(0).optional(),
  vestingMonths: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});

type PhantomFormValues = z.infer<typeof phantomFormSchema>;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  vested: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  paid_out: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  forfeited: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  appreciation_only: "Appreciation Only",
  full_value: "Full Value",
};

const TRIGGER_LABELS: Record<string, string> = {
  exit: "Exit",
  ipo: "IPO",
  milestone: "Milestone",
  annual: "Annual",
  termination: "Termination",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  vested: "Vested",
  paid_out: "Paid Out",
  forfeited: "Forfeited",
  cancelled: "Cancelled",
};

export default function PhantomSharesPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PhantomGrant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhantomGrant | null>(null);
  const [payoutTarget, setPayoutTarget] = useState<PhantomGrant | null>(null);
  const [currentSharePrice, setCurrentSharePrice] = useState("");
  const [showTestDrive, setShowTestDrive] = useState(() => {
    return localStorage.getItem("phantom-test-drive-dismissed") !== "true";
  });

  const { data: grants = [], isLoading } = useQuery<PhantomGrant[]>({ queryKey: ["/api/phantom-grants"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });

  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  const form = useForm<PhantomFormValues>({
    resolver: zodResolver(phantomFormSchema),
    defaultValues: {
      grantName: "",
      stakeholderId: "",
      grantDate: new Date().toISOString().split("T")[0],
      sharesEquivalent: 0,
      grantPricePerUnit: "",
      planType: "full_value",
      payoutTrigger: "exit",
      vestingSchedule: "",
      cliffMonths: 12,
      vestingMonths: 48,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PhantomFormValues) => apiRequest("POST", "/api/phantom-grants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phantom-grants"] });
      setAddOpen(false);
      form.reset();
      toast({ title: "Phantom grant created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PhantomFormValues> }) => apiRequest("PATCH", `/api/phantom-grants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phantom-grants"] });
      setEditTarget(null);
      toast({ title: "Phantom grant updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/phantom-grants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phantom-grants"] });
      setDeleteTarget(null);
      toast({ title: "Phantom grant deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const payoutMutation = useMutation({
    mutationFn: ({ id, currentSharePrice }: { id: string; currentSharePrice: string }) =>
      apiRequest("PATCH", `/api/phantom-grants/${id}/payout`, { currentSharePrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phantom-grants"] });
      setPayoutTarget(null);
      setCurrentSharePrice("");
      toast({ title: "Payout recorded", description: "Cash payout has been recorded. No shares were issued." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openEdit(grant: PhantomGrant) {
    form.reset({
      grantName: grant.grantName,
      stakeholderId: grant.stakeholderId,
      grantDate: grant.grantDate,
      sharesEquivalent: grant.sharesEquivalent,
      grantPricePerUnit: grant.grantPricePerUnit,
      planType: grant.planType as "appreciation_only" | "full_value",
      payoutTrigger: grant.payoutTrigger as "exit" | "ipo" | "milestone" | "annual" | "termination",
      vestingSchedule: grant.vestingSchedule || "",
      cliffMonths: grant.cliffMonths || 0,
      vestingMonths: grant.vestingMonths || 0,
      notes: grant.notes || "",
    });
    setEditTarget(grant);
  }

  function onSubmit(values: PhantomFormValues) {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  function formatDate(d: string | null | undefined) {
    if (!d) return "—";
    const parts = d.split("T")[0].split("-");
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }

  function calculatePayout(grant: PhantomGrant, price: number): number {
    const grantPrice = parseFloat(grant.grantPricePerUnit || "0");
    if (grant.planType === "appreciation_only") {
      return Math.max((price - grantPrice) * grant.sharesEquivalent, 0);
    }
    return price * grant.sharesEquivalent;
  }

  const payoutPreview = payoutTarget && currentSharePrice
    ? calculatePayout(payoutTarget, parseFloat(currentSharePrice))
    : 0;

  return (
    <div className="p-6 space-y-6" data-testid="page-phantom">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-phantom-title">Phantom Shares</h1>
          <p className="text-sm text-muted-foreground mt-1">Cash-settled equity equivalent — employees receive cash payouts based on share value without actual share ownership.</p>
        </div>
        <Button onClick={() => { form.reset({ grantName: "", stakeholderId: "", grantDate: new Date().toISOString().split("T")[0], sharesEquivalent: 0, grantPricePerUnit: "", planType: "full_value", payoutTrigger: "exit", vestingSchedule: "", cliffMonths: 12, vestingMonths: 48, notes: "" }); setAddOpen(true); }} data-testid="button-add-phantom">
          <Plus className="h-4 w-4 mr-2" />
          ADD PHANTOM GRANT
        </Button>
      </div>

      {showTestDrive && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40" data-testid="card-test-drive-phantom">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" role="img" aria-label="car">🚗</span>
                <div>
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Take a Test Drive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Before going live, explore every Phantom Shares feature using our pre-loaded test data. Walk through adding, editing, and managing your Phantom Grant — then check off each step as you go.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Do not proceed to the next section until all checklist items are marked complete.
                  </p>
                  <Link href="/data-room?category=test_drives">
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-start-test-drive-phantom">
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
                onClick={() => { setShowTestDrive(false); localStorage.setItem("phantom-test-drive-dismissed", "true"); }}
                data-testid="button-dismiss-test-drive-phantom"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-phantom-table">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Phantom Grants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Grant Name</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Plan Type</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Grant Price</TableHead>
                  <TableHead>Payout Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <p className="text-sm text-muted-foreground" data-testid="text-no-phantom">No phantom grants yet. Click ADD PHANTOM GRANT to create your first grant.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  grants.map((g) => {
                    const holder = stakeholderMap.get(g.stakeholderId);
                    return (
                      <TableRow key={g.id} data-testid={`row-phantom-${g.id}`}>
                        <TableCell className="pl-5 font-medium text-sm">{g.grantName}</TableCell>
                        <TableCell className="text-sm">{holder?.name || "Unknown"}</TableCell>
                        <TableCell className="text-sm">{PLAN_TYPE_LABELS[g.planType] || g.planType}</TableCell>
                        <TableCell className="text-right text-sm">{g.sharesEquivalent.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">${Number(g.grantPricePerUnit).toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{TRIGGER_LABELS[g.payoutTrigger] || g.payoutTrigger}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${STATUS_COLORS[g.status] || ""}`} variant="secondary" data-testid={`badge-status-${g.id}`}>
                            {STATUS_LABELS[g.status] || g.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {g.payoutAmount ? `$${Number(g.payoutAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(g.status === "active" || g.status === "vested") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setPayoutTarget(g); setCurrentSharePrice(""); }}
                                className="text-blue-600"
                                data-testid={`button-payout-phantom-${g.id}`}
                                title="Record payout"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {g.status !== "paid_out" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(g)}
                                data-testid={`button-edit-phantom-${g.id}`}
                                title="Edit grant"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {g.status !== "paid_out" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(g)}
                                className="text-destructive"
                                data-testid={`button-delete-phantom-${g.id}`}
                                title="Delete grant"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen || !!editTarget} onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditTarget(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="dialog-phantom-form">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Phantom Grant" : "Add Phantom Grant"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="grantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Executive Phantom Plan" {...field} data-testid="input-grant-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stakeholderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holder (Stakeholder)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-stakeholder">
                          <SelectValue placeholder="Select stakeholder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stakeholders.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full_value">Full Value</SelectItem>
                          <SelectItem value="appreciation_only">Appreciation Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payoutTrigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Trigger</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payout-trigger">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="exit">Exit</SelectItem>
                          <SelectItem value="ipo">IPO</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="termination">Termination</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sharesEquivalent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units Granted</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} data-testid="input-units" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grantPricePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grant Price ($)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} data-testid="input-grant-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="grantDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grant Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-grant-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliffMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliff (months)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} data-testid="input-cliff" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vestingMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vesting Period (months)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} data-testid="input-vesting-months" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vestingSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vesting Schedule (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 4-year with 1-year cliff, monthly thereafter" {...field} data-testid="input-vesting" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details..." rows={3} {...field} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditTarget(null); }} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-phantom">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editTarget ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payoutTarget} onOpenChange={(open) => { if (!open) { setPayoutTarget(null); setCurrentSharePrice(""); } }}>
        <DialogContent className="max-w-md" data-testid="dialog-payout">
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
            <DialogDescription>
              Record a cash payout for "{payoutTarget?.grantName}". No shares will be issued — this is a cash obligation only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Plan Type</p>
                <p className="font-medium">{payoutTarget ? PLAN_TYPE_LABELS[payoutTarget.planType] : ""}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Units</p>
                <p className="font-medium">{payoutTarget?.sharesEquivalent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Grant Price</p>
                <p className="font-medium">${payoutTarget ? Number(payoutTarget.grantPricePerUnit).toFixed(2) : "0.00"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payout Trigger</p>
                <p className="font-medium">{payoutTarget ? TRIGGER_LABELS[payoutTarget.payoutTrigger] : ""}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Current Share Price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={currentSharePrice}
                onChange={(e) => setCurrentSharePrice(e.target.value)}
                data-testid="input-current-price"
                className="mt-1"
              />
            </div>

            {currentSharePrice && payoutTarget && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">
                  {payoutTarget.planType === "appreciation_only"
                    ? `(${currentSharePrice} - ${Number(payoutTarget.grantPricePerUnit).toFixed(2)}) × ${payoutTarget.sharesEquivalent.toLocaleString()} units`
                    : `${currentSharePrice} × ${payoutTarget.sharesEquivalent.toLocaleString()} units`}
                </p>
                <p className="text-lg font-bold" data-testid="text-payout-preview">
                  Payout: ${payoutPreview.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayoutTarget(null); setCurrentSharePrice(""); }} data-testid="button-cancel-payout">
              Cancel
            </Button>
            <Button
              onClick={() => payoutTarget && payoutMutation.mutate({ id: payoutTarget.id, currentSharePrice })}
              disabled={!currentSharePrice || payoutMutation.isPending}
              data-testid="button-confirm-payout"
            >
              {payoutMutation.isPending ? "Processing..." : "Record Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent data-testid="dialog-delete-phantom">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phantom Grant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.grantName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
