import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Shield, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatShares, formatCurrency, formatDate, getInitials, getAvatarColor } from "@/lib/format";
import type { Security, Stakeholder, ShareClass } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSecuritySchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = insertSecuritySchema.extend({
  shares: z.coerce.number().min(1, "Must issue at least 1 share"),
  pricePerShare: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
});

const statusBadge: Record<string, string> = {
  active: "bg-chart-2/10 text-chart-2",
  cancelled: "bg-destructive/10 text-destructive",
  exercised: "bg-chart-4/10 text-chart-4",
  expired: "bg-muted text-muted-foreground",
};

export default function SecuritiesPage() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState<Security | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Security | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const privacy = usePrivacyMode();

  const { data: securities = [], isLoading } = useQuery<Security[]>({ queryKey: ["/api/securities"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });
  const { data: shareClasses = [] } = useQuery<ShareClass[]>({ queryKey: ["/api/share-classes"] });

  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));
  const classMap = new Map(shareClasses.map((c) => [c.id, c]));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "default",
      stakeholderId: "",
      shareClassId: "",
      shares: 0,
      pricePerShare: "0.0001",
      issueDate: new Date().toISOString().split("T")[0],
      status: "active",
      vestingSchedule: "",
      notes: "",
      certificateId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/securities", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
      setOpen(false);
      form.reset();
      toast({ title: "Security issued successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<z.infer<typeof formSchema>>) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/securities/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
      setEditOpen(false);
      setEditingSecurity(null);
      toast({ title: "Security updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/securities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
      setDeleteTarget(null);
      toast({ title: "Security deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filtered = securities.filter((s) => {
    const sh = stakeholderMap.get(s.stakeholderId);
    const sc = classMap.get(s.shareClassId);
    return (
      (sh?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (sc?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.certificateId || "").toLowerCase().includes(search.toLowerCase())
    );
  });

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
          <h1 className="text-2xl font-bold" data-testid="text-securities-title">Securities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Issue and track equity securities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyToggle enabled={privacy.enabled} onToggle={privacy.toggle} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-issue-security">
                <Plus className="h-4 w-4 mr-1" />
                Issue Security
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Security</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4" autoComplete="off">
                <FormField
                  control={form.control}
                  name="stakeholderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stakeholder</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-security-stakeholder">
                            <SelectValue placeholder="Select stakeholder" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stakeholders.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shareClassId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Share Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-security-class">
                            <SelectValue placeholder="Select share class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shareClasses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="shares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shares</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} autoComplete="off" data-testid="input-security-shares" />
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
                        <FormLabel>Price/Share</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="0.0001" autoComplete="off" data-testid="input-security-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" autoComplete="off" data-testid="input-security-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-security-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="exercised">Exercised</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Additional notes..." autoComplete="off" data-testid="input-security-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-security">
                  {createMutation.isPending ? "Issuing..." : "Issue Security"}
                </Button>
              </form>
            </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search securities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-securities"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Holder</TableHead>
                <TableHead>Share Class</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Price/Share</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No securities issued yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sec) => {
                  const sh = stakeholderMap.get(sec.stakeholderId);
                  const sc = classMap.get(sec.shareClassId);
                  const value = sec.shares * parseFloat(sec.pricePerShare || "0");
                  return (
                    <TableRow key={sec.id} data-testid={`row-security-${sec.id}`}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`text-xs font-medium text-white ${privacy.enabled ? "font-mono" : ""}`} style={{ backgroundColor: privacy.enabled ? "#374151" : (sh ? getAvatarColor(sh.name) : undefined) }}>{privacy.enabled ? "#" : (sh ? getInitials(sh.name) : "??")}</AvatarFallback>
                          </Avatar>
                          <span className={`text-sm font-medium ${privacy.enabled ? "font-mono text-emerald-500 dark:text-emerald-400" : ""}`}>{privacy.getDisplayName(sec.stakeholderId, sh?.name || "Unknown")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{sc?.name || "Unknown"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatShares(sec.shares)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(sec.pricePerShare)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(value)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(sec.issueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${statusBadge[sec.status]}`}>{sec.status}</Badge>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSecurity(sec);
                              setEditOpen(true);
                            }}
                            data-testid={`button-edit-security-${sec.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(sec)}
                            className="text-destructive"
                            data-testid={`button-delete-security-${sec.id}`}
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

      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if (!val) setEditingSecurity(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Security</DialogTitle>
          </DialogHeader>
          {editingSecurity && (
            <EditSecurityForm
              security={editingSecurity}
              stakeholders={stakeholders}
              shareClasses={shareClasses}
              onSubmit={(data) => updateMutation.mutate({ id: editingSecurity.id, ...data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(val) => { if (!val) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Security</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this security ({formatShares(deleteTarget?.shares || 0)} shares held by {stakeholderMap.get(deleteTarget?.stakeholderId || "")?.name || "Unknown"})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-security">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete-security"
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

function EditSecurityForm({
  security,
  stakeholders,
  shareClasses,
  onSubmit,
  isPending,
}: {
  security: Security;
  stakeholders: Stakeholder[];
  shareClasses: ShareClass[];
  onSubmit: (data: Partial<z.infer<typeof formSchema>>) => void;
  isPending: boolean;
}) {
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: security.companyId,
      stakeholderId: security.stakeholderId,
      shareClassId: security.shareClassId,
      shares: security.shares,
      pricePerShare: security.pricePerShare || "0.0001",
      issueDate: security.issueDate || new Date().toISOString().split("T")[0],
      status: security.status,
      vestingSchedule: security.vestingSchedule || "",
      notes: security.notes || "",
      certificateId: security.certificateId || "",
    },
  });

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        <FormField
          control={editForm.control}
          name="stakeholderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stakeholder</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-security-stakeholder">
                    <SelectValue placeholder="Select stakeholder" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stakeholders.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="shareClassId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Share Class</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-security-class">
                    <SelectValue placeholder="Select share class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {shareClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={editForm.control}
            name="shares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shares</FormLabel>
                <FormControl>
                  <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} autoComplete="off" data-testid="input-edit-security-shares" />
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
                <FormLabel>Price/Share</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="0.0001" autoComplete="off" data-testid="input-edit-security-price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={editForm.control}
          name="issueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issue Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" autoComplete="off" data-testid="input-edit-security-date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-security-status">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="exercised">Exercised</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} placeholder="Additional notes..." autoComplete="off" data-testid="input-edit-security-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-edit-security">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
