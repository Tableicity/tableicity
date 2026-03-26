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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Play, X, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Warrant, Stakeholder, ShareClass } from "@shared/schema";

const warrantFormSchema = z.object({
  name: z.string().min(1, "Warrant name is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  underlyingShareClass: z.string().min(1, "Share class is required"),
  shares: z.coerce.number().int().positive("Shares must be greater than 0"),
  exercisePrice: z.string().min(1, "Exercise price is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  vestingSchedule: z.string().optional(),
  notes: z.string().optional(),
});

type WarrantFormValues = z.infer<typeof warrantFormSchema>;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  exercised: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function WarrantsPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warrant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warrant | null>(null);
  const [exerciseTarget, setExerciseTarget] = useState<Warrant | null>(null);
  const [showTestDrive, setShowTestDrive] = useState(() => {
    return localStorage.getItem("warrants-test-drive-dismissed") !== "true";
  });

  const { data: warrants = [], isLoading } = useQuery<Warrant[]>({ queryKey: ["/api/warrants"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });
  const { data: shareClasses = [] } = useQuery<ShareClass[]>({ queryKey: ["/api/share-classes"] });

  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  const form = useForm<WarrantFormValues>({
    resolver: zodResolver(warrantFormSchema),
    defaultValues: {
      name: "",
      stakeholderId: "",
      underlyingShareClass: "Common",
      shares: 0,
      exercisePrice: "",
      issueDate: new Date().toISOString().split("T")[0],
      expirationDate: "",
      vestingSchedule: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: WarrantFormValues) => apiRequest("POST", "/api/warrants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warrants"] });
      setAddOpen(false);
      form.reset();
      toast({ title: "Warrant created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarrantFormValues> }) => apiRequest("PATCH", `/api/warrants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warrants"] });
      setEditTarget(null);
      toast({ title: "Warrant updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/warrants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warrants"] });
      setDeleteTarget(null);
      toast({ title: "Warrant deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const exerciseMutation = useMutation({
    mutationFn: (warrant: Warrant) =>
      apiRequest("PATCH", `/api/warrants/${warrant.id}`, {
        status: "exercised",
        exercisedDate: new Date().toISOString().split("T")[0],
        exercisedShares: warrant.shares,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warrants"] });
      setExerciseTarget(null);
      toast({ title: "Warrant exercised", description: "Shares have been converted." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openEdit(warrant: Warrant) {
    form.reset({
      name: warrant.name,
      stakeholderId: warrant.stakeholderId,
      underlyingShareClass: warrant.underlyingShareClass,
      shares: warrant.shares,
      exercisePrice: warrant.exercisePrice,
      issueDate: warrant.issueDate,
      expirationDate: warrant.expirationDate,
      vestingSchedule: warrant.vestingSchedule || "",
      notes: warrant.notes || "",
    });
    setEditTarget(warrant);
  }

  function onSubmit(values: WarrantFormValues) {
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

  const investorStakeholders = stakeholders.filter((s) => ["investor", "advisor", "board_member"].includes(s.type));

  return (
    <div className="p-6 space-y-6" data-testid="page-warrants">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-warrants-title">Warrants</h1>
          <p className="text-sm text-muted-foreground mt-1">Rights to purchase shares at a fixed price, typically issued to investors or lenders.</p>
        </div>
        <Button onClick={() => { form.reset({ name: "", stakeholderId: "", underlyingShareClass: "Common", shares: 0, exercisePrice: "", issueDate: new Date().toISOString().split("T")[0], expirationDate: "", vestingSchedule: "", notes: "" }); setAddOpen(true); }} data-testid="button-add-warrant">
          <Plus className="h-4 w-4 mr-2" />
          ADD WARRANT
        </Button>
      </div>

      {showTestDrive && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40" data-testid="card-test-drive-warrants">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" role="img" aria-label="car">🚗</span>
                <div>
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Take a Test Drive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Before going live, explore every Warrants feature using our pre-loaded test data. Walk through adding, editing, and managing your Warrant — then check off each step as you go.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Do not proceed to the next section until all checklist items are marked complete.
                  </p>
                  <Link href="/data-room?category=test_drives">
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-start-test-drive-warrants">
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
                onClick={() => { setShowTestDrive(false); localStorage.setItem("warrants-test-drive-dismissed", "true"); }}
                data-testid="button-dismiss-test-drive-warrants"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-warrants-table">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Warrants</CardTitle>
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
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Share Class</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Exercise Price</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warrants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <p className="text-sm text-muted-foreground" data-testid="text-no-warrants">No warrants yet. Click ADD WARRANT to issue your first warrant.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  warrants.map((w) => {
                    const holder = stakeholderMap.get(w.stakeholderId);
                    return (
                      <TableRow key={w.id} data-testid={`row-warrant-${w.id}`}>
                        <TableCell className="pl-5 font-medium text-sm">{w.name}</TableCell>
                        <TableCell className="text-sm">{holder?.name || "Unknown"}</TableCell>
                        <TableCell className="text-sm">{w.underlyingShareClass}</TableCell>
                        <TableCell className="text-right text-sm">{w.shares.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">${Number(w.exercisePrice).toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{formatDate(w.issueDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(w.expirationDate)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${STATUS_COLORS[w.status] || ""}`} variant="secondary" data-testid={`badge-status-${w.id}`}>
                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {w.status === "active" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExerciseTarget(w)}
                                className="text-blue-600"
                                data-testid={`button-exercise-warrant-${w.id}`}
                                title="Exercise warrant"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {w.status !== "exercised" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(w)}
                                data-testid={`button-edit-warrant-${w.id}`}
                                title="Edit warrant"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {w.status !== "exercised" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(w)}
                                className="text-destructive"
                                data-testid={`button-delete-warrant-${w.id}`}
                                title="Delete warrant"
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="dialog-warrant-form">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Warrant" : "Add Warrant"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warrant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Series A Warrant" {...field} data-testid="input-warrant-name" />
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
                        {investorStakeholders.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="underlyingShareClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Share Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-share-class">
                          <SelectValue placeholder="Select share class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shareClasses.length > 0 ? (
                          shareClasses.map((sc) => (
                            <SelectItem key={sc.id} value={sc.name}>{sc.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="Common">Common</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shares"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Shares</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} data-testid="input-shares" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exercisePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Price ($)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} data-testid="input-exercise-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-issue-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expiration-date" />
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
                      <Input placeholder="e.g. 4-year with 1-year cliff" {...field} data-testid="input-vesting" />
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
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-warrant">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editTarget ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent data-testid="dialog-delete-warrant">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warrant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
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

      <AlertDialog open={!!exerciseTarget} onOpenChange={(open) => { if (!open) setExerciseTarget(null); }}>
        <AlertDialogContent data-testid="dialog-exercise-warrant">
          <AlertDialogHeader>
            <AlertDialogTitle>Exercise Warrant</AlertDialogTitle>
            <AlertDialogDescription>
              Exercise "{exerciseTarget?.name}" and convert {exerciseTarget?.shares.toLocaleString()} shares at ${exerciseTarget ? Number(exerciseTarget.exercisePrice).toFixed(2) : "0.00"} per share? This will update the cap table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-exercise">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => exerciseTarget && exerciseMutation.mutate(exerciseTarget)}
              data-testid="button-confirm-exercise"
            >
              {exerciseMutation.isPending ? "Processing..." : "Exercise Warrant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
