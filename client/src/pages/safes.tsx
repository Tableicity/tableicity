import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Plus, FileText, Search, Pencil, Trash2, Upload, FileEdit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { appendTenantParam } from "@/lib/tenant-context";
import { formatCurrency, formatDate, getInitials, getAvatarColor } from "@/lib/format";
import type { SafeAgreement, Stakeholder } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSafeAgreementSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = insertSafeAgreementSchema.extend({
  investmentAmount: z.string().min(1, "Investment amount required"),
  valuationCap: z.string().optional(),
  discountRate: z.string().optional(),
});

const statusBadge: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent_to_template: "bg-amber-500/10 text-amber-600",
  sent: "bg-chart-4/10 text-chart-4",
  pending_signature: "bg-blue-500/10 text-blue-600",
  signed: "bg-chart-2/10 text-chart-2",
  converted: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function SafesPage() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSafe, setEditingSafe] = useState<SafeAgreement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SafeAgreement | null>(null);
  const [search, setSearch] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const privacy = usePrivacyMode();
  const { data: safes = [], isLoading } = useQuery<SafeAgreement[]>({ queryKey: ["/api/safes"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });
  const { data: allDocuments = [] } = useQuery<any[]>({ queryKey: ["/api/documents"] });

  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "default",
      stakeholderId: "",
      investmentAmount: "",
      valuationCap: "",
      discountRate: "",
      safeType: "post-money",
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const hadFile = !!uploadFile;
      const res = await apiRequest("POST", "/api/safes", data);
      const safe = await res.json();

      if (uploadFile) {
        const investor = stakeholders.find((s) => s.id === data.stakeholderId);
        const investorName = investor?.name || "Unknown Investor";
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("name", `Executed SAFE - ${investorName} ($${parseFloat(data.investmentAmount).toLocaleString("en-US")})`);
        formData.append("type", "legal");
        formData.append("description", `Executed SAFE agreement for ${investorName}. Ref: ${safe.id}`);

        await fetch(appendTenantParam("/api/documents/upload"), {
          method: "POST",
          body: formData,
          credentials: "include",
        }).then((r) => {
          if (!r.ok) throw new Error("Failed to upload document");
          return r.json();
        });
      }

      return { ...safe, hadFile };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/safes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setOpen(false);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      form.reset();
      if (result.hadFile) {
        toast({ title: "SAFE agreement created and document uploaded" });
        navigate("/data-room");
      } else {
        toast({ title: "SAFE agreement created" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; file?: File | null } & Partial<z.infer<typeof formSchema>>) => {
      const { id, file, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/safes/${id}`, rest);
      const safe = await res.json();

      if (file) {
        const investor = stakeholders.find((s) => s.id === rest.stakeholderId);
        const investorName = investor?.name || "Unknown Investor";
        const amount = rest.investmentAmount || safe.investmentAmount || "0";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", `Executed SAFE - ${investorName} ($${parseFloat(amount).toLocaleString("en-US")})`);
        formData.append("type", "legal");
        formData.append("description", `Executed SAFE agreement for ${investorName}. Ref: ${id}`);

        await fetch(appendTenantParam("/api/documents/upload"), {
          method: "POST",
          body: formData,
          credentials: "include",
        }).then((r) => {
          if (!r.ok) throw new Error("Failed to upload document");
          return r.json();
        });
      }

      return { ...safe, hadFile: !!file };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/safes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setEditOpen(false);
      setEditingSafe(null);
      if (result.hadFile) {
        toast({ title: "SAFE agreement updated and document uploaded" });
        navigate("/data-room");
      } else {
        toast({ title: "SAFE agreement updated" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (safe: SafeAgreement) => {
      await apiRequest("DELETE", `/api/safes/${safe.id}`);
      const linkedDoc = allDocuments.find(
        (d: any) => d.description && d.description.includes(`SafeId: ${safe.id}`)
      );
      if (linkedDoc) {
        await apiRequest("DELETE", `/api/documents/${linkedDoc.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setDeleteTarget(null);
      toast({ title: "SAFE agreement and linked document deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filtered = safes.filter((s) => {
    const sh = stakeholderMap.get(s.stakeholderId);
    const displayName = sh ? privacy.getDisplayName(sh.id, sh.name) : "";
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  const totalInvested = safes
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + parseFloat(s.investmentAmount), 0);

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
          <h1 className="text-2xl font-bold" data-testid="text-safes-title">SAFE Agreements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage Simple Agreements for Future Equity &middot; Total: {formatCurrency(totalInvested)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrivacyToggle enabled={privacy.enabled} onToggle={privacy.toggle} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-safe">
                <Plus className="h-4 w-4 mr-1" />
                Add Existing SAFE
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create SAFE Agreement</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4" autoComplete="off">
                <FormField
                  control={form.control}
                  name="stakeholderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-safe-investor">
                            <SelectValue placeholder="Select investor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stakeholders
                            .filter((s) => s.type === "investor")
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>{privacy.getDisplayName(s.id, s.name)}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="investmentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Amount ($)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="500000" autoComplete="off" data-testid="input-safe-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="valuationCap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valuation Cap ($)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" placeholder="10000000" autoComplete="off" data-testid="input-safe-cap" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" placeholder="20" autoComplete="off" data-testid="input-safe-discount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="safeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SAFE Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "post-money"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-safe-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="post-money">Post-Money</SelectItem>
                          <SelectItem value="pre-money">Pre-Money</SelectItem>
                          <SelectItem value="mfn">MFN</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value || "draft"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-safe-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="signed">Signed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" value={field.value || ""} autoComplete="off" data-testid="input-safe-date" />
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
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Additional terms..." autoComplete="off" data-testid="input-safe-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="safe-upload">Upload Executed SAFE (Optional)</Label>
                  <div
                    className="relative flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="upload-safe-document"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {uploadFile ? (
                        <div>
                          <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Click to upload PDF or document
                        </p>
                      )}
                    </div>
                    {uploadFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        data-testid="button-remove-upload"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      id="safe-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadFile(file);
                      }}
                      data-testid="input-safe-upload"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-safe">
                  {createMutation.isPending ? "Creating..." : "Create SAFE Agreement"}
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
          placeholder="Search SAFE agreements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-safes"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Investor</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead className="text-right">Investment</TableHead>
                <TableHead className="text-right">Valuation Cap</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No SAFE agreements yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((safe) => {
                  const sh = stakeholderMap.get(safe.stakeholderId);
                  return (
                    <TableRow key={safe.id} data-testid={`row-safe-${safe.id}`}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`text-xs font-medium text-white ${privacy.enabled ? "font-mono" : ""}`} style={{ backgroundColor: privacy.enabled ? "#374151" : (sh ? getAvatarColor(sh.name) : undefined) }}>{privacy.enabled ? "#" : (sh ? getInitials(sh.name) : "??")}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{sh ? privacy.getDisplayName(sh.id, sh.name) : "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap" data-testid={`text-docref-${safe.id}`}>
                          {(safe as any).docRef || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(safe.investmentAmount)}</TableCell>
                      <TableCell className="text-right text-sm">{safe.valuationCap ? formatCurrency(safe.valuationCap) : "-"}</TableCell>
                      <TableCell className="text-right text-sm">{safe.discountRate ? `${safe.discountRate}%` : "-"}</TableCell>
                      <TableCell className="text-sm capitalize">{safe.safeType}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(safe.issueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusBadge[safe.status]}`}>{safe.status === "sent_to_template" ? "Sent to Template" : safe.status === "pending_signature" ? "Pending Signature" : safe.status.charAt(0).toUpperCase() + safe.status.slice(1)}</Badge>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/financing/safe-template?safeId=${safe.id}`)}
                            data-testid={`button-edit-doc-safe-${safe.id}`}
                            title="Edit Document"
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSafe(safe);
                              setEditOpen(true);
                            }}
                            data-testid={`button-edit-safe-${safe.id}`}
                            title="Edit Details"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(safe)}
                            className="text-destructive"
                            data-testid={`button-delete-safe-${safe.id}`}
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

      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if (!val) setEditingSafe(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit SAFE Agreement</DialogTitle>
          </DialogHeader>
          {editingSafe && (
            <EditSafeForm
              safe={editingSafe}
              stakeholders={stakeholders}
              onSubmit={(data, file) => updateMutation.mutate({ id: editingSafe.id, file, ...data })}
              isPending={updateMutation.isPending}
              getDisplayName={privacy.getDisplayName}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(val) => { if (!val) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SAFE Agreement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this SAFE agreement ({formatCurrency(deleteTarget?.investmentAmount || "0")} from {deleteTarget ? privacy.getDisplayName(deleteTarget.stakeholderId, stakeholderMap.get(deleteTarget.stakeholderId)?.name || "Unknown") : "Unknown"})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-safe">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              data-testid="button-confirm-delete-safe"
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

function EditSafeForm({
  safe,
  stakeholders,
  onSubmit,
  isPending,
  getDisplayName,
}: {
  safe: SafeAgreement;
  stakeholders: Stakeholder[];
  onSubmit: (data: Partial<z.infer<typeof formSchema>>, file?: File | null) => void;
  isPending: boolean;
  getDisplayName: (id: string, name: string) => string;
}) {
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: safe.companyId,
      stakeholderId: safe.stakeholderId,
      investmentAmount: safe.investmentAmount,
      valuationCap: safe.valuationCap || "",
      discountRate: safe.discountRate || "",
      safeType: safe.safeType,
      status: safe.status,
      issueDate: safe.issueDate || new Date().toISOString().split("T")[0],
      notes: safe.notes || "",
    },
  });

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit((data) => onSubmit(data, editUploadFile))} className="space-y-4" autoComplete="off">
        <FormField
          control={editForm.control}
          name="stakeholderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-safe-investor">
                    <SelectValue placeholder="Select investor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stakeholders
                    .filter((s) => s.type === "investor")
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>{getDisplayName(s.id, s.name)}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="investmentAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investment Amount ($)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" autoComplete="off" data-testid="input-edit-safe-amount" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={editForm.control}
            name="valuationCap"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valuation Cap ($)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="number" autoComplete="off" data-testid="input-edit-safe-cap" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="discountRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Rate (%)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="number" autoComplete="off" data-testid="input-edit-safe-discount" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={editForm.control}
          name="safeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SAFE Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-safe-type">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="post-money">Post-Money</SelectItem>
                  <SelectItem value="pre-money">Pre-Money</SelectItem>
                  <SelectItem value="mfn">MFN</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectTrigger data-testid="select-edit-safe-status">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="issueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issue Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" value={field.value || ""} autoComplete="off" data-testid="input-edit-safe-date" />
              </FormControl>
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
                <Textarea {...field} value={field.value || ""} placeholder="Additional terms..." autoComplete="off" data-testid="input-edit-safe-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label htmlFor="edit-safe-upload">Upload Executed SAFE (Optional)</Label>
          <div
            className="relative flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => editFileInputRef.current?.click()}
            data-testid="upload-edit-safe-document"
          >
            <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {editUploadFile ? (
                <div>
                  <p className="text-sm font-medium truncate">{editUploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(editUploadFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click to upload PDF or document
                </p>
              )}
            </div>
            {editUploadFile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditUploadFile(null);
                  if (editFileInputRef.current) editFileInputRef.current.value = "";
                }}
                data-testid="button-remove-edit-upload"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <input
              ref={editFileInputRef}
              id="edit-safe-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setEditUploadFile(file);
              }}
              data-testid="input-edit-safe-upload"
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-edit-safe">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
