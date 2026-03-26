import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { Plus, FolderLock, Search, FileText, File, FileSpreadsheet, FileArchive, Pencil, Trash2, Upload, ShieldCheck, ShieldAlert, Download, Lock, LockOpen } from "lucide-react";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { appendTenantParam } from "@/lib/tenant-context";
import { formatDate } from "@/lib/format";
import type { Document, DataStoreCategory } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const formSchema = insertDocumentSchema.extend({
  name: z.string().min(1, "Document name is required"),
});

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  legal: FileText,
  financial: FileSpreadsheet,
  corporate: File,
  investor: FileArchive,
  other: File,
};

const typeBadge: Record<string, string> = {
  legal: "bg-chart-3/10 text-chart-3",
  financial: "bg-chart-2/10 text-chart-2",
  corporate: "bg-primary/10 text-primary",
  investor: "bg-chart-4/10 text-chart-4",
  other: "bg-muted text-muted-foreground",
};

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const BUILT_IN_TYPES = ["legal", "financial", "corporate", "investor", "other"] as const;

function categoryToFilterKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "_");
}

function extractCategoryTag(description: string | null | undefined): string | null {
  if (!description) return null;
  const match = description.match(/\[Category:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

export default function DataRoomPage() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const searchString = useSearch();
  const [urlParamApplied, setUrlParamApplied] = useState(false);

  const { data: documents = [], isLoading } = useQuery<Document[]>({ queryKey: ["/api/documents"] });
  const { data: storageUsage } = useQuery<{ usedBytes: number; usedFormatted: string; limitBytes: number | null; limitFormatted: string | null; plan: string }>({
    queryKey: ["/api/documents/storage-usage"],
  });
  const { data: categories = [] } = useQuery<DataStoreCategory[]>({ queryKey: ["/api/categories"] });

  useEffect(() => {
    if (urlParamApplied) return;
    const params = new URLSearchParams(searchString);
    const categoryParam = params.get("category");
    if (categoryParam) {
      setFilterType(categoryParam);
      setUrlParamApplied(true);
    }
  }, [searchString, urlParamApplied]);

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/categories", { name });
      return res.json();
    },
    onSuccess: (data: DataStoreCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setAddCategoryOpen(false);
      setNewCategoryName("");
      toast({ title: `Category "${data.name}" created` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "default",
      name: "",
      type: "legal",
      description: "",
      uploadDate: new Date().toISOString().split("T")[0],
      fileSize: "",
      uploadedBy: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("name", data.name);
        formData.append("type", data.type);
        formData.append("description", data.description || "");
        formData.append("uploadedBy", data.uploadedBy || "");

        const res = await fetch(appendTenantParam("/api/documents/upload"), {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Upload failed");
        }
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/documents", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/storage-usage"] });
      setOpen(false);
      form.reset();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Document added to data room" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Record<string, any>) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/documents/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setEditOpen(false);
      setEditingDoc(null);
      toast({ title: "Document updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      await apiRequest("DELETE", `/api/documents/${doc.id}`);
      const safeIdMatch = doc.description?.match(/SafeId:\s*([^\s|,]+)/);
      if (safeIdMatch) {
        const linkedSafeId = safeIdMatch[1];
        if (linkedSafeId && linkedSafeId !== "N/A") {
          await apiRequest("DELETE", `/api/safes/${linkedSafeId}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/storage-usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/safes"] });
      setDeleteTarget(null);
      toast({ title: "Document and linked SAFE agreement deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  function generateDocPdf(content: string, docName: string) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 60;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 16;
    let y = margin;

    const lines = content.split("\n");
    for (const line of lines) {
      if (line.trim() === "") {
        y += lineHeight * 0.5;
        continue;
      }
      const isHeading = line === line.toUpperCase() && line.trim().length > 3 && !line.startsWith("(");
      const isSectionTitle = /^\d+\.\s+/.test(line) || /^Schedule\s+\d/i.test(line);
      if (isHeading || isSectionTitle) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(isHeading ? 11 : 10);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      const wrapped = doc.splitTextToSize(line, maxWidth);
      for (const wl of wrapped) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(wl, margin, y);
        y += lineHeight;
      }
    }

    const safeName = docName.replace(/\s+/g, "-").toLowerCase();
    doc.save(`${safeName}.pdf`);
  }

  const filtered = documents.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || "").toLowerCase().includes(search.toLowerCase());
    if (filterType === "all") return matchesSearch;
    if (BUILT_IN_TYPES.includes(filterType as any)) {
      return matchesSearch && d.type === filterType;
    }
    const docCategoryTag = extractCategoryTag(d.description);
    if (docCategoryTag) {
      const tagKey = categoryToFilterKey(docCategoryTag);
      return matchesSearch && tagKey === filterType;
    }
    return false;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const storagePercent = storageUsage?.limitBytes
    ? Math.min(100, (storageUsage.usedBytes / storageUsage.limitBytes) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-data-room-title">Data Store</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Secure document storage for due diligence &middot; {documents.length} documents
          </p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-document">
              <Plus className="h-4 w-4 mr-1" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => uploadMutation.mutate(data))} className="space-y-4" autoComplete="off">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload File</label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="dropzone-file-upload"
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">Click to select a file</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, PowerPoint, text, CSV, images (max 50 MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!form.getValues("name")) {
                          form.setValue("name", file.name.replace(/\.[^/.]+$/, ""));
                        }
                      }
                    }}
                    data-testid="input-file-upload"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Certificate of Incorporation" autoComplete="off" data-testid="input-doc-name" />
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
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doc-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Brief description..." autoComplete="off" data-testid="input-doc-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uploadedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uploaded By</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Your name" autoComplete="off" data-testid="input-doc-uploader" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={uploadMutation.isPending} data-testid="button-submit-document">
                  {uploadMutation.isPending ? (selectedFile ? "Uploading..." : "Adding...") : (selectedFile ? "Upload Document" : "Add Document")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {storageUsage?.limitBytes && (
        <Card>
          <CardContent className="py-3 px-5">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">{storageUsage.usedFormatted} / {storageUsage.limitFormatted}</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden" data-testid="progress-storage-usage">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePercent > 80
                    ? "bg-destructive"
                    : storagePercent > 50
                      ? "bg-amber-500"
                      : "bg-chart-2"
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className={`text-xs mt-1.5 ${
              storagePercent > 80
                ? "text-destructive"
                : storagePercent > 50
                  ? "text-amber-500"
                  : "text-muted-foreground"
            }`}>
              {storagePercent > 80
                ? "Storage is almost full. Upgrade your plan for more storage."
                : `${storagePercent.toFixed(1)}% used`}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-documents"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-doc-type">
            <SelectValue placeholder="Filter category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="investor">Investor</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            {categories.filter(c => !BUILT_IN_TYPES.includes(categoryToFilterKey(c.name) as any)).map((cat) => (
              <SelectItem key={cat.id} value={categoryToFilterKey(cat.name)}>
                {cat.name}
              </SelectItem>
            ))}
            <Separator className="my-1" />
            <div
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover-elevate"
              onClick={(e) => {
                e.stopPropagation();
                setAddCategoryOpen(true);
              }}
              data-testid="button-add-category"
            >
              <Plus className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Add Category</span>
            </div>
          </SelectContent>
        </Select>
        <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Compliance, HR Documents"
                  autoComplete="off"
                  data-testid="input-new-category-name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCategoryName.trim()) {
                      createCategoryMutation.mutate(newCategoryName.trim());
                    }
                  }}
                />
              </div>
              <Button
                className="w-full"
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                onClick={() => createCategoryMutation.mutate(newCategoryName.trim())}
                data-testid="button-submit-new-category"
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Document</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Security</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <FolderLock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {search || filterType !== "all"
                        ? "No documents match your search"
                        : "No documents in data room yet"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doc) => {
                  const IconComp = typeIcons[doc.type] || File;
                  return (
                    <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2">
                          <IconComp className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium block truncate max-w-[200px]">{doc.name}</span>
                            {doc.description && (
                              <span className="text-xs text-muted-foreground block truncate max-w-[200px]">{doc.description}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap" data-testid={`text-ref-doc-${doc.id}`}>
                          {(() => {
                            const match = doc.description?.match(/\bRef:\s*([^\s,|]+)/);
                            const ref = match ? match[1] : null;
                            return ref && ref !== "N/A" ? ref : "—";
                          })()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${typeBadge[doc.type]}`}>{doc.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.fileSizeBytes ? formatFileSize(doc.fileSizeBytes) : (doc.fileSize || "-")}
                      </TableCell>
                      <TableCell>
                        {doc.encrypted ? (
                          <div className="flex items-center gap-1" data-testid={`badge-encrypted-${doc.id}`}>
                            <ShieldCheck className="h-4 w-4 text-chart-2" />
                            <span className="text-xs text-chart-2 font-medium">Encrypted</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1" data-testid={`badge-not-encrypted-${doc.id}`}>
                            <ShieldAlert className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive font-medium">Not Encrypted</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.uploadedBy || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.uploadDate)}</TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              updateMutation.mutate({ id: doc.id, encrypted: !doc.encrypted });
                            }}
                            data-testid={`button-toggle-encrypt-${doc.id}`}
                            title={doc.encrypted ? "Remove encryption" : "Encrypt document"}
                          >
                            {doc.encrypted ? (
                              <Lock className="h-3.5 w-3.5 text-chart-2" />
                            ) : (
                              <LockOpen className="h-3.5 w-3.5 text-destructive" />
                            )}
                          </Button>
                          {!doc.encrypted && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (doc.fileUrl) {
                                    try {
                                      const res = await fetch(appendTenantParam(`/api/documents/${doc.id}/download`), { credentials: "include" });
                                      if (!res.ok) {
                                        const err = await res.json().catch(() => ({ message: "Download failed" }));
                                        toast({ title: "Download failed", description: err.message, variant: "destructive" });
                                        return;
                                      }
                                      const blob = await res.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = doc.name;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    } catch {
                                      toast({ title: "Download failed", description: "Could not download the file", variant: "destructive" });
                                    }
                                  } else if (doc.content) {
                                    generateDocPdf(doc.content, doc.name);
                                  } else {
                                    const fallback = [
                                      `Document: ${doc.name}`,
                                      `Type: ${doc.type}`,
                                      doc.description ? `Description: ${doc.description}` : null,
                                      doc.uploadedBy ? `Uploaded By: ${doc.uploadedBy}` : null,
                                      `Upload Date: ${doc.uploadDate}`,
                                    ].filter(Boolean).join("\n");
                                    generateDocPdf(fallback, doc.name);
                                  }
                                }}
                                data-testid={`button-download-doc-${doc.id}`}
                                title="Download as PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingDoc(doc);
                                  setEditOpen(true);
                                }}
                                data-testid={`button-edit-doc-${doc.id}`}
                                title="Edit document details"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(doc)}
                                className="text-destructive"
                                data-testid={`button-delete-doc-${doc.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
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

      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if (!val) setEditingDoc(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <EditDocumentForm
              doc={editingDoc}
              onSubmit={(data) => updateMutation.mutate({ id: editingDoc.id, ...data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(val) => { if (!val) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              {deleteTarget?.fileUrl && (
                <span className="block mt-2 text-muted-foreground">The uploaded file will also be removed.</span>
              )}
              {deleteTarget?.description?.includes("SafeId:") && (
                <span className="block mt-2 text-muted-foreground">The linked SAFE agreement will also be deleted.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-doc">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              data-testid="button-confirm-delete-doc"
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

function EditDocumentForm({
  doc,
  onSubmit,
  isPending,
}: {
  doc: Document;
  onSubmit: (data: Record<string, any>) => void;
  isPending: boolean;
}) {
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: doc.companyId,
      name: doc.name,
      type: doc.type,
      description: doc.description || "",
      uploadDate: doc.uploadDate,
      fileSize: doc.fileSize || "",
      uploadedBy: doc.uploadedBy || "",
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
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" data-testid="input-edit-doc-name" />
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
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-doc-type">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} autoComplete="off" data-testid="input-edit-doc-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="uploadedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uploaded By</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} autoComplete="off" data-testid="input-edit-doc-uploader" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-edit-doc">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
