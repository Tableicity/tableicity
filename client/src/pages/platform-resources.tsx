import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, Download, Upload, FileText, BookOpen, Scale, Shield, Compass, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type PlatformResource = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  documentType: string;
  mimeType: string | null;
  fileSize: string | null;
  fileSizeBytes: number | null;
  autoSeed: boolean;
  adminOnly: boolean;
  hasContent: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

const CATEGORY_OPTIONS = [
  { value: "esop", label: "ESOP", icon: BookOpen },
  { value: "legal", label: "Legal", icon: Scale },
  { value: "compliance", label: "Compliance", icon: Shield },
  { value: "onboarding", label: "Onboarding", icon: Compass },
  { value: "other", label: "Other", icon: FileText },
];

const DOC_TYPE_OPTIONS = [
  { value: "legal", label: "Legal" },
  { value: "financial", label: "Financial" },
  { value: "corporate", label: "Corporate" },
  { value: "investor", label: "Investor" },
  { value: "other", label: "Other" },
];

export default function PlatformResourcesPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<PlatformResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformResource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("other");
  const [formDocType, setFormDocType] = useState("legal");
  const [formAutoSeed, setFormAutoSeed] = useState(true);
  const [formAdminOnly, setFormAdminOnly] = useState(false);
  const [formFile, setFormFile] = useState<File | null>(null);

  const { data: resources = [], isLoading } = useQuery<PlatformResource[]>({
    queryKey: ["/api/platform-resources"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", formName);
      formData.append("description", formDescription);
      formData.append("category", formCategory);
      formData.append("documentType", formDocType);
      formData.append("autoSeed", String(formAdminOnly ? false : formAutoSeed));
      formData.append("adminOnly", String(formAdminOnly));
      if (formFile) {
        formData.append("file", formFile);
      }
      const res = await fetch("/api/platform-resources", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-resources"] });
      setAddOpen(false);
      resetForm();
      toast({ title: "Resource created", description: formAdminOnly ? "Admin resource saved privately." : "The resource has been added and will be seeded to new organizations." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest("PATCH", `/api/platform-resources/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-resources"] });
      setEditingResource(null);
      toast({ title: "Resource updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/platform-resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-resources"] });
      setDeleteTarget(null);
      toast({ title: "Resource deleted" });
    },
  });

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormCategory("other");
    setFormDocType("legal");
    setFormAutoSeed(true);
    setFormAdminOnly(false);
    setFormFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openEdit(r: PlatformResource) {
    setFormName(r.name);
    setFormDescription(r.description || "");
    setFormCategory(r.category);
    setFormDocType(r.documentType);
    setFormAutoSeed(r.autoSeed);
    setFormAdminOnly(r.adminOnly);
    setEditingResource(r);
  }

  async function handleDownload(r: PlatformResource) {
    try {
      const res = await fetch(`/api/platform-resources/${r.id}/download`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Download failed" }));
        toast({ title: "Download failed", description: err.message, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  }

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORY_OPTIONS.find((c) => c.value === cat);
    return found ? found.icon : FileText;
  };

  const tenantResources = resources.filter((r) => !r.adminOnly);
  const adminResources = resources.filter((r) => r.adminOnly);

  function renderResourceTable(list: PlatformResource[], emptyMsg: string, showAutoSeed: boolean, testIdPrefix: string) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>File</TableHead>
            {showAutoSeed && <TableHead>Auto-Seed</TableHead>}
            <TableHead className="text-right pr-5">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [1, 2].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, showAutoSeed ? 6 : null].filter(Boolean).map((j) => (
                  <TableCell key={j!}><Skeleton className="h-4 w-16" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showAutoSeed ? 6 : 5} className="text-center py-12">
                <p className="text-sm text-muted-foreground">{emptyMsg}</p>
              </TableCell>
            </TableRow>
          ) : (
            list.map((r) => {
              const Icon = getCategoryIcon(r.category);
              return (
                <TableRow key={r.id} data-testid={`row-${testIdPrefix}-${r.id}`}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs capitalize">{r.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{r.documentType}</TableCell>
                  <TableCell>
                    {r.hasContent ? (
                      <span className="text-xs text-muted-foreground">{r.fileSize || "Stored"}</span>
                    ) : (
                      <span className="text-xs text-destructive">No file</span>
                    )}
                  </TableCell>
                  {showAutoSeed && (
                    <TableCell>
                      <Badge variant={r.autoSeed ? "default" : "outline"} className="text-xs">
                        {r.autoSeed ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="pr-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.hasContent && (
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(r)} data-testid={`button-download-${testIdPrefix}-${r.id}`} title="Download">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} data-testid={`button-edit-${testIdPrefix}-${r.id}`} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(r)} data-testid={`button-delete-${testIdPrefix}-${r.id}`} title="Delete">
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
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Platform Resources</h1>
        <p className="text-muted-foreground mt-1">
          Manage documents and resources that are automatically seeded into every new organization's Data Room.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Resource Library</CardTitle>
          <Button
            size="sm"
            onClick={() => { resetForm(); setFormAdminOnly(false); setAddOpen(true); }}
            data-testid="button-add-resource"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Resource
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {renderResourceTable(tenantResources, "No platform resources yet. Upload documents like handbooks and templates that will be shared with all organizations.", true, "resource")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Admin Resources</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Private documents visible only to platform admins. Never seeded to tenant Data Rooms.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { resetForm(); setFormAdminOnly(true); setFormAutoSeed(false); setAddOpen(true); }}
            data-testid="button-add-admin-resource"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Admin Resource
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {renderResourceTable(adminResources, "No admin resources yet. Upload private documents, internal notes, or reference materials for platform administrators.", false, "admin-resource")}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formAdminOnly ? "Add Admin Resource" : "Add Platform Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formAdminOnly && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">This resource will remain private and will not be shared with any tenant.</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={formAdminOnly ? "e.g. Internal Pricing Notes" : "e.g. ESOP Handbook"} data-testid="input-resource-name" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of this resource" rows={2} data-testid="input-resource-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger data-testid="select-resource-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Document Type</label>
                <Select value={formDocType} onValueChange={setFormDocType}>
                  <SelectTrigger data-testid="select-resource-doc-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPE_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Upload File</label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
                  data-testid="input-resource-file"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Max 10 MB. PDF, Word, Excel, images, or text files.</p>
            </div>
            {!formAdminOnly && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Auto-seed to new organizations</p>
                  <p className="text-xs text-muted-foreground">Automatically add this resource to every new org's Data Room</p>
                </div>
                <Switch checked={formAutoSeed} onCheckedChange={setFormAutoSeed} data-testid="switch-auto-seed" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!formName.trim() || createMutation.isPending}
              data-testid="button-save-resource"
            >
              {createMutation.isPending ? "Uploading..." : "Save Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingResource} onOpenChange={(v) => { if (!v) setEditingResource(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formAdminOnly ? "Edit Admin Resource" : "Edit Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formAdminOnly && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">This is a private admin resource. It will not be shared with any tenant.</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} data-testid="input-edit-resource-name" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} data-testid="input-edit-resource-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Document Type</label>
                <Select value={formDocType} onValueChange={setFormDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPE_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!formAdminOnly && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Auto-seed to new organizations</p>
                  <p className="text-xs text-muted-foreground">Automatically add this resource to every new org's Data Room</p>
                </div>
                <Switch checked={formAutoSeed} onCheckedChange={setFormAutoSeed} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResource(null)}>Cancel</Button>
            <Button
              onClick={() => editingResource && updateMutation.mutate({
                id: editingResource.id,
                updates: { name: formName, description: formDescription, category: formCategory, documentType: formDocType, autoSeed: formAdminOnly ? false : formAutoSeed, adminOnly: formAdminOnly },
              })}
              disabled={!formName.trim() || updateMutation.isPending}
              data-testid="button-update-resource"
            >
              {updateMutation.isPending ? "Saving..." : "Update Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteTarget?.name}" from the platform resource library. Existing copies in tenant Data Rooms will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-resource"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
