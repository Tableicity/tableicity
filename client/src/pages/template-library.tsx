import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
  Shield,
  ScrollText,
  Receipt,
  StickyNote,
  Upload,
  Download,
  X,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/format";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import type { SafeTemplate } from "@shared/schema";

const typeLabels: Record<string, string> = {
  safe: "SAFE",
  convertible_note: "Convertible Note",
  warrant: "Warrant",
  custom_note: "Custom Note",
};

const typeBadgeColors: Record<string, string> = {
  safe: "bg-blue-500/10 text-blue-600",
  convertible_note: "bg-purple-500/10 text-purple-600",
  warrant: "bg-amber-500/10 text-amber-600",
  custom_note: "bg-emerald-500/10 text-emerald-600",
};

const typeIcons: Record<string, typeof FileText> = {
  safe: Shield,
  convertible_note: ScrollText,
  warrant: Receipt,
  custom_note: StickyNote,
};

interface TemplateFormData {
  templateName: string;
  templateType: string;
  templateVersion: string;
  description: string;
  rawContent: string;
  isDefault: boolean;
}

const emptyForm: TemplateFormData = {
  templateName: "",
  templateType: "safe",
  templateVersion: "1.0",
  description: "",
  rawContent: "",
  isDefault: false,
};

const variableDefinitions = [
  { key: "company_name", label: "Company Name", category: "Party Information", description: "Legal name of the issuing company", example: "Archer Technologies, Inc.", required: true },
  { key: "company_address", label: "Company Address", category: "Party Information", description: "Registered address of the company", example: "123 Innovation Way, San Francisco, CA 94107", required: true },
  { key: "state_of_registration", label: "State of Registration", category: "Party Information", description: "State where the company is incorporated", example: "Delaware", required: false },
  { key: "investor_name", label: "Investor Name", category: "Party Information", description: "Full legal name of the investor", example: "Jane Smith", required: true },
  { key: "investor_email", label: "Investor Email", category: "Party Information", description: "Contact email for the investor", example: "jane@investor.com", required: false },
  { key: "investor_address", label: "Investor Address", category: "Party Information", description: "Mailing address of the investor", example: "456 Market St, New York, NY 10001", required: false },
  { key: "investor_trust_name", label: "Trust Name", category: "Party Information", description: "Name of the trust (if investing via trust)", example: "Smith Family Trust", required: false },
  { key: "investor_trust_number", label: "Trust Number", category: "Party Information", description: "Trust registration number (if applicable)", example: "TR-2026-0042", required: false },
  { key: "purchase_amount", label: "Investment Amount", category: "Investment Details", description: "Dollar amount of the SAFE investment", example: "$500,000", required: true },
  { key: "investment_round", label: "Investment Round", category: "Investment Details", description: "Name of the funding round", example: "Seed Round", required: false },
  { key: "effective_date", label: "Effective Date", category: "Investment Details", description: "Date the SAFE becomes effective", example: "2026-03-01", required: true },
  { key: "safe_id", label: "SAFE Reference #", category: "Investment Details", description: "Unique identifier for this SAFE agreement", example: "SAFE-2026-001", required: false },
  { key: "valuation_cap", label: "Valuation Cap", category: "SAFE Terms", description: "Maximum valuation for conversion pricing", example: "$10,000,000", required: false },
  { key: "pre_post_money", label: "Pre/Post Money", category: "SAFE Terms", description: "Whether the valuation cap is pre-money or post-money", example: "Post", required: true },
  { key: "discount_percentage", label: "Discount", category: "SAFE Terms", description: "Discount rate applied at conversion", example: "20%", required: false },
  { key: "raise_goal", label: "Raise Goal", category: "SAFE Terms", description: "Target amount for the funding round", example: "$2,000,000", required: false },
  { key: "end_date", label: "End Date", category: "SAFE Terms", description: "Deadline for the funding round", example: "2026-12-31", required: false },
  { key: "notes", label: "Notes", category: "Additional", description: "Any additional terms or comments", example: "Standard YC SAFE terms", required: false },
];

function VariablesReferenceTable() {
  const [expanded, setExpanded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = Array.from(new Set(variableDefinitions.map((v) => v.category)));

  const filtered = categoryFilter === "all"
    ? variableDefinitions
    : variableDefinitions.filter((v) => v.category === categoryFilter);

  return (
    <Card data-testid="variables-reference-table">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Template Variables Reference</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {variableDefinitions.length} available template variables
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
              {variableDefinitions.filter((v) => v.required).length} required
            </Badge>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-variable-category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {variableDefinitions.length} variables
            </p>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Variable</TableHead>
                  <TableHead>Placeholder</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Example</TableHead>
                  <TableHead className="w-[80px]">Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.key} data-testid={`row-variable-${v.key}`}>
                    <TableCell className="font-medium text-sm">{v.label}</TableCell>
                    <TableCell>
                      <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">
                        {"{{" + v.key + "}}"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {v.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      {v.description}
                    </TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">
                      <span className="text-muted-foreground/50 italic">{v.example}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {v.required ? (
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ActiveTemplateCard({ templates }: { templates: SafeTemplate[] }) {
  const defaultTemplate = useMemo(() => {
    return templates.find((t) => t.isDefault) || templates[0] || null;
  }, [templates]);

  if (!defaultTemplate) return null;

  return (
    <Card data-testid="active-template-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${
            defaultTemplate.templateType === "convertible_note" ? "bg-purple-500/10" :
            defaultTemplate.templateType === "warrant" ? "bg-amber-500/10" :
            "bg-chart-2/10"
          }`}>
            <FileText className={`h-5 w-5 ${
              defaultTemplate.templateType === "convertible_note" ? "text-purple-600" :
              defaultTemplate.templateType === "warrant" ? "text-amber-600" :
              "text-chart-2"
            }`} />
          </div>
          <div>
            <CardTitle className="text-lg">Active Template</CardTitle>
            <p className="text-sm text-muted-foreground">
              {defaultTemplate.templateName}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs ${
              defaultTemplate.templateType === "convertible_note" ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20" :
              defaultTemplate.templateType === "warrant" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" :
              "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20"
            }`} variant="secondary">
              {(defaultTemplate.templateType || "safe").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </Badge>
            {defaultTemplate.templateVersion && (
              <Badge variant="outline" className="text-xs">v{defaultTemplate.templateVersion}</Badge>
            )}
            <Badge variant="secondary" className="text-xs bg-chart-2/10 text-chart-2">Default</Badge>
          </div>
          {defaultTemplate.description && (
            <p className="text-sm text-muted-foreground">{defaultTemplate.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TemplateLibrary() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery<SafeTemplate[]>({
    queryKey: ["/api/safe-templates"],
  });

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (typeFilter !== "all" && t.templateType !== typeFilter) return false;
      if (searchQuery && !t.templateName.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [templates, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { safe: 0, convertible_note: 0, warrant: 0, custom_note: 0 };
    templates.forEach((t) => {
      if (counts[t.templateType] !== undefined) counts[t.templateType]++;
    });
    return counts;
  }, [templates]);

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      await apiRequest("POST", "/api/safe-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safe-templates"] });
      toast({ title: "Template created successfully" });
      setCreateOpen(false);
      setFormData(emptyForm);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create template", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      await apiRequest("PATCH", `/api/safe-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safe-templates"] });
      toast({ title: "Template updated successfully" });
      setEditOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update template", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/safe-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safe-templates"] });
      toast({ title: "Template deleted successfully" });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete template", description: err.message, variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: SafeTemplate) => {
      await apiRequest("POST", "/api/safe-templates", {
        templateName: `${template.templateName} (Copy)`,
        templateType: template.templateType,
        templateVersion: template.templateVersion || "1.0",
        description: template.description || "",
        rawContent: template.rawContent,
        isDefault: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safe-templates"] });
      toast({ title: "Template duplicated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to duplicate template", description: err.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/safe-templates/${id}`, { isDefault: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safe-templates"] });
      toast({ title: "Default template updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to set default", description: err.message, variant: "destructive" });
    },
  });

  function openEdit(template: SafeTemplate) {
    setFormData({
      templateName: template.templateName,
      templateType: template.templateType,
      templateVersion: template.templateVersion || "1.0",
      description: template.description || "",
      rawContent: template.rawContent,
      isDefault: template.isDefault || false,
    });
    setEditingId(template.id);
    setEditOpen(true);
  }

  function handleFormChange(field: keyof TemplateFormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const statItems = [
    { key: "safe", label: "SAFE", icon: Shield, color: "text-blue-600" },
    { key: "convertible_note", label: "Convertible Note", icon: ScrollText, color: "text-purple-600" },
    { key: "warrant", label: "Warrant", icon: Receipt, color: "text-amber-600" },
    { key: "custom_note", label: "Custom Note", icon: StickyNote, color: "text-emerald-600" },
  ];

  const deleteTemplate = templates.find((t) => t.id === deleteId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Template Library</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-page-description">
            Manage document templates for SAFE agreements, convertible notes, warrants, and more
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData(emptyForm);
            setCreateOpen(true);
          }}
          data-testid="button-create-template"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} data-testid={`card-stat-${item.key}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-2xl font-bold mt-1">{stats[item.key] || 0}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${item.color} opacity-70`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ActiveTemplateCard templates={templates} />

      <VariablesReferenceTable />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-templates"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="safe">SAFE</SelectItem>
            <SelectItem value="convertible_note">Convertible Note</SelectItem>
            <SelectItem value="warrant">Warrant</SelectItem>
            <SelectItem value="custom_note">Custom Note</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">No templates found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== "all"
                ? "Try adjusting your filters or search query."
                : "Get started by creating your first template."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => {
            const isExpanded = expandedId === template.id;
            const TypeIcon = typeIcons[template.templateType] || FileText;
            return (
              <Card
                key={template.id}
                className="flex flex-col"
                data-testid={`card-template-${template.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TypeIcon className={`h-5 w-5 shrink-0 ${typeBadgeColors[template.templateType]?.split(" ")[1] || "text-muted-foreground"}`} />
                      <CardTitle className="text-base truncate" data-testid={`text-template-name-${template.id}`}>
                        {template.templateName}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs bg-chart-2/10 text-chart-2 no-default-active-elevate" data-testid={`badge-default-${template.id}`}>
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${typeBadgeColors[template.templateType] || ""} no-default-active-elevate`} data-testid={`badge-type-${template.id}`}>
                      {typeLabels[template.templateType] || template.templateType}
                    </Badge>
                    {template.templateVersion && (
                      <span className="text-xs text-muted-foreground">v{template.templateVersion}</span>
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-xs no-default-active-elevate ${template.isActive !== false ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"}`}
                      data-testid={`badge-status-${template.id}`}
                    >
                      {template.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${template.id}`}>
                      {template.description}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-auto" data-testid={`text-updated-${template.id}`}>
                    Updated {formatDate(template.updatedAt || template.createdAt)}
                  </p>

                  <div className="flex flex-wrap items-center gap-1 border-t pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(template)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const blob = new Blob([template.rawContent], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${template.templateName.replace(/\s+/g, "-").toLowerCase()}-v${template.templateVersion || "1.0"}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      data-testid={`button-download-${template.id}`}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateMutation.mutate(template)}
                      data-testid={`button-duplicate-${template.id}`}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Duplicate
                    </Button>
                    {!template.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefaultMutation.mutate(template.id)}
                        data-testid={`button-set-default-${template.id}`}
                      >
                        <Star className="h-3.5 w-3.5 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteId(template.id)}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                      data-testid={`button-expand-${template.id}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Content Preview</p>
                      <pre
                        className="text-xs font-mono bg-muted rounded-md p-3 max-h-48 overflow-auto whitespace-pre-wrap break-words"
                        data-testid={`text-content-preview-${template.id}`}
                      >
                        {template.rawContent.slice(0, 2000)}
                        {template.rawContent.length > 2000 && "..."}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={() => createMutation.mutate(formData)}
            isPending={createMutation.isPending}
            submitLabel="Create Template"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={() => {
              if (editingId) updateMutation.mutate({ id: editingId, data: formData });
            }}
            isPending={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTemplate?.templateName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
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

function TemplateForm({
  formData,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
}: {
  formData: TemplateFormData;
  onChange: (field: keyof TemplateFormData, value: string | boolean) => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        onChange("rawContent", text);
        setUploadedFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const variableMatches = formData.rawContent.match(/\{\{(\w+)\}\}/g) || [];
  const uniqueVars = Array.from(new Set(variableMatches.map((v) => v.replace(/\{\{|\}\}/g, ""))));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="templateName">Template Name *</Label>
        <Input
          id="templateName"
          value={formData.templateName}
          onChange={(e) => onChange("templateName", e.target.value)}
          placeholder="e.g. Standard SAFE Agreement"
          data-testid="input-template-name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Template Type</Label>
          <Select value={formData.templateType} onValueChange={(v) => onChange("templateType", v)}>
            <SelectTrigger data-testid="select-template-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safe">SAFE</SelectItem>
              <SelectItem value="convertible_note">Convertible Note</SelectItem>
              <SelectItem value="warrant">Warrant</SelectItem>
              <SelectItem value="custom_note">Custom Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="templateVersion">Version</Label>
          <Input
            id="templateVersion"
            value={formData.templateVersion}
            onChange={(e) => onChange("templateVersion", e.target.value)}
            placeholder="1.0"
            data-testid="input-template-version"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Brief description of the template..."
          rows={3}
          data-testid="input-template-description"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Template Content *</Label>
          {uploadedFileName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>{uploadedFileName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => {
                  setUploadedFileName(null);
                  onChange("rawContent", "");
                }}
                data-testid="button-clear-upload"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/40"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          data-testid="upload-drop-zone"
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Drag & drop your template file here
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Supports .txt, .md, or .html files with {"{{variable_name}}"} placeholders
          </p>
          <label>
            <input
              type="file"
              accept=".txt,.md,.html,.text"
              onChange={handleFileInput}
              className="hidden"
              data-testid="input-file-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pointer-events-none"
              data-testid="button-browse-files"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Browse Files
            </Button>
          </label>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="rawContent" className="text-xs text-muted-foreground">
              Or edit content directly below
            </Label>
            {formData.rawContent && (
              <span className="text-xs text-muted-foreground">
                {formData.rawContent.length.toLocaleString()} characters
              </span>
            )}
          </div>
          <Textarea
            id="rawContent"
            value={formData.rawContent}
            onChange={(e) => {
              onChange("rawContent", e.target.value);
              if (uploadedFileName) setUploadedFileName(null);
            }}
            placeholder={"Paste or type your template content here...\n\nUse {{variable_name}} for dynamic fields, e.g.:\n\nThis SAFE is entered into by {{company_name}},\na {{state_of_registration}} corporation,\nand {{investor_name}} (the \"Investor\").\n\nThe Investor agrees to invest {{purchase_amount}}..."}
            rows={14}
            className="font-mono text-sm"
            data-testid="input-template-content"
          />
        </div>

        {uniqueVars.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3" data-testid="detected-variables">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium">
                {uniqueVars.length} variable{uniqueVars.length !== 1 ? "s" : ""} detected in template
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {uniqueVars.map((v) => (
                <Badge key={v} variant="outline" className="text-xs font-mono">
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onSubmit}
          disabled={isPending || !formData.templateName.trim() || !formData.rawContent.trim()}
          data-testid="button-submit-template"
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
