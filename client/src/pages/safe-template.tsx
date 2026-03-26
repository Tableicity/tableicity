import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Save,
  FileText,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import type { SafeAgreement, SafeTemplate } from "@shared/schema";
import jsPDF from "jspdf";

interface TemplateVariables {
  company_name: string;
  company_address: string;
  state_of_registration: string;
  investor_name: string;
  investor_email: string;
  investor_address: string;
  investor_trust_name: string;
  investor_trust_number: string;
  purchase_amount: string;
  investment_round: string;
  valuation_cap: string;
  pre_post_money: string;
  discount_percentage: string;
  raise_goal: string;
  end_date: string;
  effective_date: string;
  safe_id: string;
  notes: string;
}

const defaultVariables: TemplateVariables = {
  company_name: "",
  company_address: "",
  state_of_registration: "",
  investor_name: "",
  investor_email: "",
  investor_address: "",
  investor_trust_name: "",
  investor_trust_number: "",
  purchase_amount: "",
  investment_round: "",
  valuation_cap: "",
  pre_post_money: "Post",
  discount_percentage: "",
  raise_goal: "",
  end_date: "",
  effective_date: new Date().toISOString().split("T")[0],
  safe_id: "",
  notes: "",
};

function injectVariables(rawTemplate: string, variables: Record<string, string>): string {
  let result = rawTemplate;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(placeholder, value || `[${key.toUpperCase()} - MISSING]`);
  });
  result = result.replace(/\{\{(\w+)\}\}/g, "[MISSING: $1]");
  return result;
}

function generatePdf(content: string, investorName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
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

    const isHeading =
      line === line.toUpperCase() && line.trim().length > 3 && !line.startsWith("(");
    const isSectionTitle =
      /^\d+\.\s+/.test(line) || /^Schedule\s+\d/i.test(line) || /^Item\s+\d/i.test(line);

    if (isHeading || isSectionTitle) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isHeading ? 11 : 10);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }

    const wrapped = doc.splitTextToSize(line, maxWidth);
    for (const wl of wrapped) {
      if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wl, margin, y);
      y += lineHeight;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const safeName = investorName ? investorName.replace(/\s+/g, "-") : "Agreement";
  doc.save(`SAFE-${safeName}-${today}.pdf`);
}

function VariableForm({
  variables,
  onChange,
}: {
  variables: TemplateVariables;
  onChange: (v: TemplateVariables) => void;
}) {
  const update = (key: keyof TemplateVariables, value: string) => {
    onChange({ ...variables, [key]: value });
  };

  return (
    <Card data-testid="template-variable-form">
      <CardHeader>
        <CardTitle className="text-lg">SAFE Variables</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review and confirm all details before generating your SAFE document
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Party Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={variables.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_address">Company Address *</Label>
              <Input
                id="company_address"
                value={variables.company_address}
                onChange={(e) => update("company_address", e.target.value)}
                data-testid="input-company-address"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state_of_registration">State of Registration</Label>
              <Input
                id="state_of_registration"
                value={variables.state_of_registration}
                onChange={(e) => update("state_of_registration", e.target.value)}
                data-testid="input-state-registration"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="investor_name">Investor Name *</Label>
              <Input
                id="investor_name"
                value={variables.investor_name}
                onChange={(e) => update("investor_name", e.target.value)}
                data-testid="input-investor-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="investor_email">Investor Email</Label>
              <Input
                id="investor_email"
                value={variables.investor_email}
                onChange={(e) => update("investor_email", e.target.value)}
                data-testid="input-investor-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="investor_address">Investor Address</Label>
              <Input
                id="investor_address"
                value={variables.investor_address}
                onChange={(e) => update("investor_address", e.target.value)}
                data-testid="input-investor-address"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="investor_trust_name">Trust Name (if applicable)</Label>
              <Input
                id="investor_trust_name"
                value={variables.investor_trust_name}
                onChange={(e) => update("investor_trust_name", e.target.value)}
                data-testid="input-trust-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="investor_trust_number">Trust Number (if applicable)</Label>
              <Input
                id="investor_trust_number"
                value={variables.investor_trust_number}
                onChange={(e) => update("investor_trust_number", e.target.value)}
                data-testid="input-trust-number"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Investment Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="purchase_amount">Investment Amount *</Label>
              <Input
                id="purchase_amount"
                value={variables.purchase_amount}
                onChange={(e) => update("purchase_amount", e.target.value)}
                data-testid="input-purchase-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="investment_round">Investment Round</Label>
              <Input
                id="investment_round"
                value={variables.investment_round}
                onChange={(e) => update("investment_round", e.target.value)}
                data-testid="input-investment-round"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="effective_date">Effective Date *</Label>
              <Input
                id="effective_date"
                type="date"
                value={variables.effective_date}
                onChange={(e) => update("effective_date", e.target.value)}
                data-testid="input-effective-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="safe_id">SAFE Reference #</Label>
              <Input
                id="safe_id"
                value={variables.safe_id}
                onChange={(e) => update("safe_id", e.target.value)}
                placeholder="e.g. SAFE-2026-001"
                data-testid="input-safe-id"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            SAFE Terms
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valuation_cap">Valuation Cap</Label>
              <Input
                id="valuation_cap"
                value={variables.valuation_cap}
                onChange={(e) => update("valuation_cap", e.target.value)}
                data-testid="input-valuation-cap"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pre_post_money">Pre/Post Money *</Label>
              <Select
                value={variables.pre_post_money}
                onValueChange={(v) => update("pre_post_money", v)}
              >
                <SelectTrigger data-testid="select-pre-post-money">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Post">Post-Money</SelectItem>
                  <SelectItem value="Pre">Pre-Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_percentage">Discount</Label>
              <Input
                id="discount_percentage"
                value={variables.discount_percentage}
                onChange={(e) => update("discount_percentage", e.target.value)}
                placeholder="e.g. 20%"
                data-testid="input-discount"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="raise_goal">Raise Goal</Label>
              <Input
                id="raise_goal"
                value={variables.raise_goal}
                onChange={(e) => update("raise_goal", e.target.value)}
                data-testid="input-raise-goal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={variables.end_date}
                onChange={(e) => update("end_date", e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Additional Information
          </h4>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={variables.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              data-testid="input-template-notes"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentPreview({
  content,
  expanded,
  onToggleExpand,
}: {
  content: string;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <Card data-testid="template-preview">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Document Preview</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleExpand}
          data-testid="button-toggle-preview"
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div
          className={`bg-white dark:bg-zinc-900 border rounded-lg p-8 font-serif text-sm leading-relaxed overflow-y-auto ${
            expanded ? "max-h-[80vh]" : "max-h-[70vh]"
          }`}
          style={{ whiteSpace: "pre-wrap" }}
          data-testid="preview-content"
        >
          {content.split(/(\[.*? - MISSING\]|\[MISSING: \w+\])/).map((part, i) => {
            if (/^\[.*MISSING.*\]$/.test(part)) {
              return (
                <span key={i} className="text-red-500 font-semibold">
                  {part}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}


export default function SafeTemplatePage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const safeId = params.get("safeId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [variables, setVariables] = useState<TemplateVariables>(defaultVariables);
  const [activeSafeId, setActiveSafeId] = useState<string | null>(safeId);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const { data: templates = [], isLoading: templateLoading } = useQuery<SafeTemplate[]>({
    queryKey: ["/api/safe-templates"],
  });

  const template = useMemo(() => {
    if (selectedTemplateId) {
      return templates.find((t) => t.id === selectedTemplateId) || null;
    }
    return templates.find((t) => t.isDefault) || templates[0] || null;
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find((t) => t.isDefault) || templates[0];
      if (defaultTemplate) setSelectedTemplateId(defaultTemplate.id);
    }
  }, [templates, selectedTemplateId]);

  const { data: safes = [] } = useQuery<SafeAgreement[]>({
    queryKey: ["/api/safes"],
  });

  const { data: stakeholders = [] } = useQuery<any[]>({
    queryKey: ["/api/stakeholders"],
  });

  const { data: company } = useQuery<any>({
    queryKey: ["/api/company"],
  });

  const { data: allDocuments = [] } = useQuery<any[]>({
    queryKey: ["/api/documents"],
  });

  useEffect(() => {
    if (safeId && safes.length > 0) {
      const safe = safes.find((s) => s.id === safeId);
      if (safe?.templateVariables) {
        const tv = safe.templateVariables as Record<string, string>;
        const linkedStakeholder = stakeholders.find((s: any) => s.id === safe.stakeholderId);
        setVariables((prev) => ({
          ...prev,
          ...tv,
          company_name: tv.company_name || company?.name || prev.company_name,
          company_address: tv.company_address || company?.address || prev.company_address,
          state_of_registration: tv.state_of_registration || company?.incorporationState || prev.state_of_registration,
          investor_address: tv.investor_address || linkedStakeholder?.address || prev.investor_address,
          safe_id: tv.safe_id || `SAFE-${new Date().getFullYear()}-${String(safes.length).padStart(3, "0")}`,
        }));
        setActiveSafeId(safeId);
        if (safe.templateId) {
          setSelectedTemplateId(safe.templateId);
        }
      }
    }
  }, [safeId, safes, company, stakeholders]);

  useEffect(() => {
    if (!safeId && company) {
      setVariables((prev) => ({
        ...prev,
        company_name: prev.company_name || company.name || "",
        company_address: prev.company_address || company.address || "",
        state_of_registration: prev.state_of_registration || company.incorporationState || "",
      }));
    }
  }, [company, safeId]);

  const previewContent = useMemo(() => {
    if (!template?.rawContent) return "";
    return injectVariables(template.rawContent, variables as unknown as Record<string, string>);
  }, [template, variables]);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const financialFields: Record<string, any> = {
        templateVariables: variables,
        templateId: selectedTemplateId || null,
        status: "draft" as const,
      };
      if (variables.purchase_amount) {
        financialFields.investmentAmount = variables.purchase_amount.replace(/[^0-9.]/g, "");
      }
      if (variables.valuation_cap) {
        financialFields.valuationCap = variables.valuation_cap.replace(/[^0-9.]/g, "");
      }
      if (variables.discount_percentage) {
        financialFields.discountRate = variables.discount_percentage.replace(/[^0-9.]/g, "");
      }
      if (variables.pre_post_money) {
        financialFields.safeType = variables.pre_post_money === "Pre" ? "pre-money" : "post-money";
      }

      let safeIdForDoc = activeSafeId;
      let safeDocRef: string | null = null;

      if (activeSafeId) {
        await apiRequest("PATCH", `/api/safes/${activeSafeId}`, financialFields);
        const existingSafe = safes.find((s) => s.id === activeSafeId);
        safeDocRef = (existingSafe as any)?.docRef || null;
      } else {
        const matchedStakeholder = stakeholders.find(
          (s: any) => s.name?.toLowerCase() === variables.investor_name?.toLowerCase()
        );
        const stakeholderId = matchedStakeholder?.id || stakeholders[0]?.id;
        if (!stakeholderId) {
          throw new Error("No stakeholders found. Please create a stakeholder first.");
        }
        const companyId = company?.id || "default";
        const res = await apiRequest("POST", "/api/safes", {
          companyId,
          stakeholderId,
          investmentAmount: financialFields.investmentAmount || "0",
          valuationCap: financialFields.valuationCap || null,
          discountRate: financialFields.discountRate || null,
          safeType: financialFields.safeType || "post-money",
          status: "draft",
          issueDate: new Date().toISOString().split("T")[0],
          templateVariables: variables,
          templateId: selectedTemplateId || null,
        });
        const created = await res.json();
        setActiveSafeId(created.id);
        safeIdForDoc = created.id;
        safeDocRef = created.docRef || null;
      }

      const investorName = variables.investor_name || "Unknown Investor";
      const amount = variables.purchase_amount || "";
      const docName = `SAFE Draft - ${investorName}${amount ? ` ($${amount})` : ""}`;
      const templateName = template?.templateName || "SAFE Agreement";
      const renderedContent = previewContent;
      const contentBlob = new Blob([renderedContent], { type: "text/plain" });
      const docDescription = `SAFE draft generated from "${templateName}" template. SafeId: ${safeIdForDoc || "N/A"} | Ref: ${safeDocRef || safeIdForDoc || "N/A"}`;

      const existingDoc = allDocuments.find(
        (d: any) => safeIdForDoc && d.description && d.description.includes(`SafeId: ${safeIdForDoc}`)
      );

      if (existingDoc) {
        await apiRequest("PATCH", `/api/documents/${existingDoc.id}`, {
          name: docName,
          content: renderedContent,
          fileSize: `${(contentBlob.size / 1024).toFixed(1)} KB`,
          uploadDate: new Date().toISOString().split("T")[0],
        });
      } else {
        await apiRequest("POST", "/api/documents", {
          name: docName,
          type: "legal",
          description: docDescription,
          uploadDate: new Date().toISOString().split("T")[0],
          uploadedBy: "System - SAFE Template",
          fileSize: `${(contentBlob.size / 1024).toFixed(1)} KB`,
          content: renderedContent,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "SAFE draft saved and added to Data Room" });
      navigate("/data-room");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (activeSafeId) {
        await apiRequest("PATCH", `/api/safes/${activeSafeId}`, {
          status: "sent",
          templateVariables: variables,
          templateId: selectedTemplateId || null,
        });
      }
      generatePdf(previewContent, variables.investor_name);

      const investorName = variables.investor_name || "Unknown Investor";
      const amount = variables.purchase_amount || "";
      const docName = `SAFE Agreement - ${investorName}${amount ? ` ($${amount})` : ""} - For Signatures`;
      const templateName = template?.templateName || "SAFE Agreement";
      const renderedContent = previewContent;
      const activeSafe = safes.find((s) => s.id === activeSafeId);
      const activeDocRef = (activeSafe as any)?.docRef || null;
      const docDescription = `SAFE agreement generated from "${templateName}" template for signing. SafeId: ${activeSafeId || "N/A"} | Ref: ${activeDocRef || activeSafeId || "N/A"}`;

      const existingDoc = allDocuments.find(
        (d: any) => activeSafeId && d.description && d.description.includes(`SafeId: ${activeSafeId}`)
      );

      if (existingDoc) {
        await apiRequest("PATCH", `/api/documents/${existingDoc.id}`, {
          name: docName,
          content: renderedContent,
          fileSize: `${(new Blob([renderedContent]).size / 1024).toFixed(1)} KB`,
          uploadDate: new Date().toISOString().split("T")[0],
        });
      } else {
        await apiRequest("POST", "/api/documents", {
          name: docName,
          type: "legal",
          description: docDescription,
          uploadDate: new Date().toISOString().split("T")[0],
          uploadedBy: "System - SAFE Template",
          fileSize: `${(new Blob([renderedContent]).size / 1024).toFixed(1)} KB`,
          content: renderedContent,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "SAFE downloaded and copy saved to Data Room" });
      navigate("/data-room");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (templateLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="safe-template-page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            SAFE Template
          </h1>
          <p className="text-muted-foreground mt-1">
            Review, edit and download your SAFE agreement
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Template:</Label>
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
          <SelectTrigger className="w-full md:w-[450px]" data-testid="select-template">
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.templateName}{t.isDefault ? " (Default)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <VariableForm variables={variables} onChange={setVariables} />

        <div className="lg:sticky lg:top-6">
          <DocumentPreview
            content={previewContent}
            expanded={previewExpanded}
            onToggleExpand={() => setPreviewExpanded(!previewExpanded)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {activeSafeId && (
          <Button
            variant="outline"
            onClick={() => saveDraftMutation.mutate()}
            disabled={saveDraftMutation.isPending}
            data-testid="button-save-template-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveDraftMutation.isPending ? "Saving..." : "Save as Draft"}
          </Button>
        )}
        <Button
          onClick={() => downloadMutation.mutate()}
          disabled={downloadMutation.isPending || !variables.investor_name || !variables.purchase_amount}
          data-testid="button-download-safe"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloadMutation.isPending ? "Generating..." : "Download SAFE for Signatures"}
        </Button>
      </div>

      <PlatformDisclaimer />
    </div>
  );
}
