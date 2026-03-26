import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Layers, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatShares, formatCurrency, formatDate } from "@/lib/format";
import type { ShareClass, Security } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShareClassSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const shareClassTypeColors: Record<string, string> = {
  common: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
  preferred: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  options: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800",
};

const formSchema = insertShareClassSchema.extend({
  name: z.string().min(1, "Name is required"),
  authorizedShares: z.coerce.number().min(1, "Must authorize at least 1 share"),
  pricePerShare: z.string().optional(),
  liquidationPreference: z.string().optional(),
  boardApprovalDate: z.string().optional(),
});

export default function ShareClassesPage() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ShareClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShareClass | null>(null);
  const { toast } = useToast();

  const { data: shareClasses = [], isLoading } = useQuery<ShareClass[]>({ queryKey: ["/api/share-classes"] });
  const { data: securities = [] } = useQuery<Security[]>({ queryKey: ["/api/securities"] });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "default",
      name: "",
      type: "common",
      pricePerShare: "0.0001",
      authorizedShares: 1000000,
      boardApprovalDate: "",
      liquidationPreference: "1.00",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/share-classes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/share-classes"] });
      setOpen(false);
      form.reset();
      toast({ title: "Share class created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<z.infer<typeof formSchema>>) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/share-classes/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/share-classes"] });
      setEditOpen(false);
      setEditingClass(null);
      toast({ title: "Share class updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/share-classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/share-classes"] });
      setDeleteTarget(null);
      toast({ title: "Share class deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const issuedByClass = new Map<string, number>();
  for (const sec of securities.filter((s) => s.status === "active")) {
    const current = issuedByClass.get(sec.shareClassId) || 0;
    issuedByClass.set(sec.shareClassId, current + sec.shares);
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-share-classes-title">Share Classes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define and manage your company's share classes
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-share-class">
              <Plus className="h-4 w-4 mr-1" />
              Add Share Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Share Class</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4" autoComplete="off">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Series A Preferred" autoComplete="off" data-testid="input-class-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-class-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="preferred">Preferred</SelectItem>
                          <SelectItem value="options">Options</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="authorizedShares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorized Shares</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value))} autoComplete="off" data-testid="input-authorized-shares" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pricePerShare"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Per Share</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="0.0001" autoComplete="off" data-testid="input-price-per-share" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="boardApprovalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board Approval Date (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" value={field.value || ""} autoComplete="off" data-testid="input-approval-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-share-class">
                  {createMutation.isPending ? "Creating..." : "Create Share Class"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Authorized</TableHead>
                <TableHead className="text-right">Issued</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Price/Share</TableHead>
                <TableHead className="text-right">Approval Date</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No share classes defined. Create your first share class.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                shareClasses.map((sc) => {
                  const issued = issuedByClass.get(sc.id) || 0;
                  const available = sc.authorizedShares - issued;
                  return (
                    <TableRow key={sc.id} data-testid={`row-share-class-${sc.id}`}>
                      <TableCell className="pl-5 font-medium text-sm">{sc.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${shareClassTypeColors[sc.type] || ""}`}>{sc.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatShares(sc.authorizedShares)}</TableCell>
                      <TableCell className="text-right text-sm">{formatShares(issued)}</TableCell>
                      <TableCell className="text-right text-sm">{formatShares(available)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(sc.pricePerShare)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{formatDate(sc.boardApprovalDate)}</TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingClass(sc);
                              setEditOpen(true);
                            }}
                            data-testid={`button-edit-share-class-${sc.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(sc)}
                            className="text-destructive"
                            data-testid={`button-delete-share-class-${sc.id}`}
                          >
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
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if (!val) setEditingClass(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Share Class</DialogTitle>
          </DialogHeader>
          {editingClass && (
            <EditShareClassForm
              shareClass={editingClass}
              onSubmit={(data) => updateMutation.mutate({ id: editingClass.id, ...data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(val) => { if (!val) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Share Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              {(issuedByClass.get(deleteTarget?.id || "") || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This share class has issued securities. Deleting it may cause data inconsistencies.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-share-class">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-share-class"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PlatformDisclaimer />
    </div>
  );
}

function EditShareClassForm({
  shareClass,
  onSubmit,
  isPending,
}: {
  shareClass: ShareClass;
  onSubmit: (data: Partial<z.infer<typeof formSchema>>) => void;
  isPending: boolean;
}) {
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: shareClass.companyId,
      name: shareClass.name,
      type: shareClass.type,
      pricePerShare: shareClass.pricePerShare || "0.0001",
      authorizedShares: shareClass.authorizedShares,
      boardApprovalDate: shareClass.boardApprovalDate || "",
      liquidationPreference: shareClass.liquidationPreference || "1.00",
    },
  });

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        <FormField
          control={editForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" data-testid="input-edit-class-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-class-type">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="preferred">Preferred</SelectItem>
                  <SelectItem value="options">Options</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={editForm.control}
            name="authorizedShares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Authorized Shares</FormLabel>
                <FormControl>
                  <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value))} autoComplete="off" data-testid="input-edit-authorized-shares" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="pricePerShare"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Per Share</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="0.0001" autoComplete="off" data-testid="input-edit-price-per-share" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={editForm.control}
          name="boardApprovalDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Board Approval Date (Optional)</FormLabel>
              <FormControl>
                <Input {...field} type="date" value={field.value || ""} autoComplete="off" data-testid="input-edit-approval-date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-edit-share-class">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
