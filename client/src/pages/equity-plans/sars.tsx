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
import { Plus, Pencil, Trash2, TrendingUp, X, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Sar, Stakeholder, ShareClass } from "@shared/schema";

const sarFormSchema = z.object({
  grantName: z.string().min(1, "Grant name is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  grantDate: z.string().min(1, "Grant date is required"),
  units: z.coerce.number().int().positive("Units must be greater than 0"),
  basePrice: z.string().min(1, "Base price is required"),
  settlementType: z.enum(["cash", "stock", "choice"]),
  underlyingShareClass: z.string().optional(),
  vestingSchedule: z.string().optional(),
  cliffMonths: z.coerce.number().int().min(0).optional(),
  vestingMonths: z.coerce.number().int().min(0).optional(),
  expirationDate: z.string().optional(),
  exerciseTrigger: z.string().optional(),
  notes: z.string().optional(),
});

type SarFormValues = z.infer<typeof sarFormSchema>;

const defaultFormValues: SarFormValues = {
  grantName: "",
  stakeholderId: "",
  grantDate: new Date().toISOString().split("T")[0],
  units: 0,
  basePrice: "",
  settlementType: "cash",
  underlyingShareClass: "",
  vestingSchedule: "",
  cliffMonths: 12,
  vestingMonths: 48,
  expirationDate: "",
  exerciseTrigger: "",
  notes: "",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  vested: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  exercised: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  forfeited: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  vested: "Vested",
  exercised: "Exercised",
  forfeited: "Forfeited",
  cancelled: "Cancelled",
  expired: "Expired",
};

const SETTLEMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  stock: "Stock",
  choice: "Employee Choice",
};

export default function SarsPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sar | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sar | null>(null);
  const [exerciseTarget, setExerciseTarget] = useState<Sar | null>(null);
  const [exercisePrice, setExercisePrice] = useState("");
  const [settleInStock, setSettleInStock] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(() => {
    return localStorage.getItem("sars-test-drive-dismissed") !== "true";
  });

  const { data: sarsList = [], isLoading } = useQuery<Sar[]>({ queryKey: ["/api/sars"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });
  const { data: shareClasses = [] } = useQuery<ShareClass[]>({ queryKey: ["/api/share-classes"] });
  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  const form = useForm<SarFormValues>({
    resolver: zodResolver(sarFormSchema),
    defaultValues: { ...defaultFormValues },
  });

  const createMutation = useMutation({
    mutationFn: (data: SarFormValues) => apiRequest("POST", "/api/sars", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sars"] });
      setAddOpen(false);
      form.reset(defaultFormValues);
      toast({ title: "SAR created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SarFormValues> }) => apiRequest("PATCH", `/api/sars/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sars"] });
      setEditTarget(null);
      toast({ title: "SAR updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sars/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sars"] });
      setDeleteTarget(null);
      toast({ title: "SAR deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const exerciseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/sars/${id}/exercise`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
      setExerciseTarget(null);
      setExercisePrice("");
      setSettleInStock(false);
      toast({ title: "SAR exercised successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openEdit(sar: Sar) {
    form.reset({
      grantName: sar.grantName,
      stakeholderId: sar.stakeholderId,
      grantDate: sar.grantDate,
      units: sar.units,
      basePrice: sar.basePrice || "",
      settlementType: (sar.settlementType as "cash" | "stock" | "choice") || "cash",
      underlyingShareClass: sar.underlyingShareClass || "",
      vestingSchedule: sar.vestingSchedule || "",
      cliffMonths: sar.cliffMonths ?? 12,
      vestingMonths: sar.vestingMonths ?? 48,
      expirationDate: sar.expirationDate || "",
      exerciseTrigger: sar.exerciseTrigger || "",
      notes: sar.notes || "",
    });
    setEditTarget(sar);
  }

  function onSubmit(values: SarFormValues) {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  function getExercisePreview() {
    if (!exerciseTarget || !exercisePrice) return null;
    const currentPrice = parseFloat(exercisePrice);
    const basePrice = parseFloat(exerciseTarget.basePrice || "0");
    const units = exerciseTarget.units;
    const appreciation = Math.max(currentPrice - basePrice, 0);
    const payoutAmount = appreciation * units;
    const sharesToIssue = currentPrice > 0 ? Math.floor(payoutAmount / currentPrice) : 0;
    return { currentPrice, basePrice, appreciation, payoutAmount, units, sharesToIssue };
  }

  const preview = getExercisePreview();
  const watchSettlement = form.watch("settlementType");

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" data-testid="loading-sars">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-sars">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-sars-title">Stock Appreciation Rights</h1>
          <p className="text-sm text-muted-foreground mt-1">SARs grant the right to receive the appreciation in stock value over a base price, settled in cash or stock.</p>
        </div>
        <Button onClick={() => { form.reset({ ...defaultFormValues, grantDate: new Date().toISOString().split("T")[0] }); setAddOpen(true); }} data-testid="button-add-sar">
          <Plus className="h-4 w-4 mr-2" />
          ADD SAR
        </Button>
      </div>

      {showTestDrive && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40" data-testid="card-test-drive-sars">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" role="img" aria-label="car">🚗</span>
                <div>
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Take a Test Drive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Before going live, explore every SARs feature using our pre-loaded test data. Walk through adding, editing, and managing your SAR — then check off each step as you go.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Do not proceed to the next section until all checklist items are marked complete.
                  </p>
                  <Link href="/data-room?category=test_drives">
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-start-test-drive-sars">
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
                onClick={() => { setShowTestDrive(false); localStorage.setItem("sars-test-drive-dismissed", "true"); }}
                data-testid="button-dismiss-test-drive-sars"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-sars-table">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All SARs</CardTitle>
        </CardHeader>
        <CardContent>
          {sarsList.length === 0 ? (
            <div className="text-center py-10" data-testid="empty-sars">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-sars">No SARs yet. Click ADD SAR to create your first stock appreciation right.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grant Name</TableHead>
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Settlement</TableHead>
                  <TableHead>Grant Date</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Exercise Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sarsList.map((sar) => {
                  const stakeholder = stakeholderMap.get(sar.stakeholderId);
                  return (
                    <TableRow key={sar.id} data-testid={`row-sar-${sar.id}`}>
                      <TableCell className="font-medium" data-testid={`text-sar-name-${sar.id}`}>{sar.grantName}</TableCell>
                      <TableCell data-testid={`text-sar-stakeholder-${sar.id}`}>{stakeholder?.name || "Unknown"}</TableCell>
                      <TableCell data-testid={`text-sar-units-${sar.id}`}>{sar.units.toLocaleString()}</TableCell>
                      <TableCell data-testid={`text-sar-base-price-${sar.id}`}>${parseFloat(sar.basePrice || "0").toFixed(2)}</TableCell>
                      <TableCell data-testid={`text-sar-settlement-${sar.id}`}>
                        <Badge variant="outline">{SETTLEMENT_LABELS[sar.settlementType] || sar.settlementType}</Badge>
                      </TableCell>
                      <TableCell data-testid={`text-sar-grant-date-${sar.id}`}>{sar.grantDate}</TableCell>
                      <TableCell data-testid={`text-sar-expiration-${sar.id}`}>{sar.expirationDate || "—"}</TableCell>
                      <TableCell data-testid={`text-sar-trigger-${sar.id}`}>
                        {sar.exerciseTrigger ? {anytime: "Anytime", exit: "Exit", ipo: "IPO", milestone: "Milestone", change_of_control: "Change of Control"}[sar.exerciseTrigger] || sar.exerciseTrigger : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[sar.status] || ""} data-testid={`badge-sar-status-${sar.id}`}>
                          {STATUS_LABELS[sar.status] || sar.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(sar.status === "active" || sar.status === "vested") && (
                            <Button size="sm" variant="outline" onClick={() => { setExerciseTarget(sar); setExercisePrice(""); setSettleInStock(false); }} data-testid={`button-exercise-sar-${sar.id}`}>
                              <TrendingUp className="h-3.5 w-3.5 mr-1" />
                              Exercise
                            </Button>
                          )}
                          {sar.status !== "exercised" && (
                            <Button size="icon" variant="ghost" onClick={() => openEdit(sar)} data-testid={`button-edit-sar-${sar.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {sar.status !== "exercised" && (
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(sar)} data-testid={`button-delete-sar-${sar.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      <Dialog open={addOpen || !!editTarget} onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditTarget(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="dialog-sar-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">{editTarget ? "Edit SAR" : "Add Stock Appreciation Right"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Update the SAR details below." : "Create a new SAR grant. SARs give the holder the right to the appreciation in value over the base price."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="grantName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Name</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Senior Engineer SAR" data-testid="input-grant-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stakeholderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stakeholder</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-stakeholder"><SelectValue placeholder="Select stakeholder" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {stakeholders.map((s) => (
                        <SelectItem key={s.id} value={s.id} data-testid={`option-stakeholder-${s.id}`}>{s.name} ({s.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="grantDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grant Date</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-grant-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expirationDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-expiration-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="units" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Units</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-units" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="basePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price ($)</FormLabel>
                    <FormControl><Input {...field} placeholder="0.00" data-testid="input-base-price" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="settlementType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settlement Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-settlement-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="choice">Employee Choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {(watchSettlement === "stock" || watchSettlement === "choice") && (
                  <FormField control={form.control} name="underlyingShareClass" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Share Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger data-testid="select-share-class"><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {shareClasses.map((sc) => (
                            <SelectItem key={sc.id} value={sc.name} data-testid={`option-share-class-${sc.id}`}>{sc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
              <FormField control={form.control} name="vestingSchedule" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vesting Schedule</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. 4-year with 1-year cliff" data-testid="input-vesting-schedule" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="cliffMonths" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliff (months)</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-cliff-months" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vestingMonths" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Vesting (months)</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-vesting-months" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="exerciseTrigger" render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Trigger</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-exercise-trigger"><SelectValue placeholder="Select trigger" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="anytime">Anytime</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                      <SelectItem value="ipo">IPO</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="change_of_control">Change of Control</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Additional details..." data-testid="input-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditTarget(null); }} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editTarget ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent data-testid="dialog-delete-sar">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SAR</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.grantName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!exerciseTarget} onOpenChange={(open) => { if (!open) { setExerciseTarget(null); setExercisePrice(""); setSettleInStock(false); } }}>
        <DialogContent className="max-w-md" data-testid="dialog-exercise-sar">
          <DialogHeader>
            <DialogTitle>Exercise SAR</DialogTitle>
            <DialogDescription>
              Enter the current share price to calculate the appreciation payout for "{exerciseTarget?.grantName}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Share Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={exercisePrice}
                onChange={(e) => setExercisePrice(e.target.value)}
                placeholder="0.00"
                data-testid="input-exercise-price"
              />
            </div>
            {exerciseTarget?.settlementType === "choice" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="settle-stock"
                  checked={settleInStock}
                  onChange={(e) => setSettleInStock(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-settle-stock"
                />
                <label htmlFor="settle-stock" className="text-sm">Settle in stock instead of cash</label>
              </div>
            )}
            {preview && (
              <Card className="bg-muted/50" data-testid="card-exercise-preview">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price:</span>
                    <span className="font-medium">${preview.basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Price:</span>
                    <span className="font-medium">${preview.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Appreciation / Unit:</span>
                    <span className="font-medium">${preview.appreciation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Units:</span>
                    <span className="font-medium">{preview.units.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total Payout:</span>
                    <span className="text-green-600">${preview.payoutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {(exerciseTarget?.settlementType === "stock" || (exerciseTarget?.settlementType === "choice" && settleInStock)) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shares to Issue:</span>
                      <span className="font-medium">{preview.sharesToIssue.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExerciseTarget(null); setExercisePrice(""); setSettleInStock(false); }} data-testid="button-cancel-exercise">Cancel</Button>
            <Button
              disabled={!exercisePrice || exerciseMutation.isPending}
              onClick={() => exerciseTarget && exerciseMutation.mutate({
                id: exerciseTarget.id,
                data: {
                  currentSharePrice: exercisePrice,
                  exerciseDate: new Date().toISOString().split("T")[0],
                  exercisedUnits: exerciseTarget.units,
                  settleInStock,
                },
              })}
              data-testid="button-confirm-exercise"
            >
              {exerciseMutation.isPending ? "Processing..." : "Confirm Exercise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
