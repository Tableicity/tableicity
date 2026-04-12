import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ShieldCheck, Plus, Clock, CheckCircle, XCircle, Loader2, Copy, ExternalLink, ArrowUpCircle, Zap, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CommitmentRecord {
  id: string;
  holderRef: string;
  shareClass: string;
  isActive: boolean;
}

interface ProofRecord {
  id: string;
  proofType: string;
  status: string;
  publicInputs: { threshold?: number; holderRef?: string; shareClass?: string };
  createdAt: string;
  expiresAt: string;
}

interface ProofsResponse {
  proofs: ProofRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsageResponse {
  plan: string;
  noirEnabled: boolean;
  maxProofsPerMonth: number;
  currentCount: number;
  billingMonth: string;
  overagePriceCents: number;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-complete">Verified</Badge>;
    case "generating":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20" data-testid="badge-generating">Generating</Badge>;
    case "failed":
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20" data-testid="badge-failed">Failed</Badge>;
    case "expired":
      return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20" data-testid="badge-expired">Expired</Badge>;
    default:
      return <Badge variant="outline" data-testid="badge-unknown">{status}</Badge>;
  }
}

function getVerifyUrl(proofId: string) {
  return `${window.location.origin}/public/verify/${proofId}`;
}

const RITUAL_STEPS = [
  { label: "Validating commitment records...", duration: 2500 },
  { label: "Computing SHA-256 + Pedersen hashes...", duration: 3500 },
  { label: "Executing Noir zero-knowledge circuit...", duration: 4500 },
  { label: "Finalizing cryptographic proof...", duration: 2000 },
];

function SecurityRitualProgress() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    const totalDuration = RITUAL_STEPS.reduce((sum, s) => sum + s.duration, 0);
    let cumulativeDurations: number[] = [];
    let sum = 0;
    for (const step of RITUAL_STEPS) {
      sum += step.duration;
      cumulativeDurations.push(sum);
    }

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / totalDuration) * 100, 98);
      setProgress(pct);

      let currentStep = 0;
      for (let i = 0; i < cumulativeDurations.length; i++) {
        if (elapsed < cumulativeDurations[i]) {
          currentStep = i;
          break;
        }
        currentStep = i;
      }
      setStepIndex(currentStep);

      if (elapsed < totalDuration) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const currentStep = RITUAL_STEPS[stepIndex];

  return (
    <div className="space-y-4 py-6" data-testid="security-ritual-progress">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{stepIndex + 1}</span>
          </div>
        </div>
        <p className="font-semibold text-sm text-center">Security Ritual in Progress</p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2.5" data-testid="progress-ritual" />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground transition-all duration-300" data-testid="text-ritual-step">
            {currentStep.label}
          </p>
          <span className="text-xs font-mono text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 pt-2">
        {RITUAL_STEPS.map((step, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-colors duration-500 ${
              i < stepIndex ? "bg-green-500" : i === stepIndex ? "bg-primary animate-pulse" : "bg-muted"
            }`}
            data-testid={`ritual-step-indicator-${i}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function PrivacyVaultPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedHolder, setSelectedHolder] = useState("");
  const [selectedShareClass, setSelectedShareClass] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("");
  const [generatedProofId, setGeneratedProofId] = useState<string | null>(null);

  const { data: commitments = [], isLoading: commitmentsLoading } = useQuery<CommitmentRecord[]>({
    queryKey: ["/api/v1/proofs/commitments"],
  });

  const { data: proofsData, isLoading: proofsLoading } = useQuery<ProofsResponse>({
    queryKey: ["/api/v1/proofs"],
  });

  const { data: usage } = useQuery<UsageResponse>({
    queryKey: ["/api/v1/proofs/usage"],
  });

  const proofs = proofsData?.proofs || [];
  const totalProofs = proofsData?.total || 0;
  const verifiedCount = proofs.filter(p => p.status === "complete").length;
  const pendingCount = proofs.filter(p => p.status === "generating").length;

  const noirEnabled = usage?.noirEnabled ?? true;
  const maxProofs = usage?.maxProofsPerMonth ?? 0;
  const currentCount = usage?.currentCount ?? 0;
  const usagePercent = maxProofs > 0 ? Math.min((currentCount / maxProofs) * 100, 100) : 0;
  const planName = usage?.plan ?? "standard";

  const uniqueHolders = [...new Set(commitments.map(c => c.holderRef))];
  const holderShareClasses = selectedHolder
    ? commitments.filter(c => c.holderRef === selectedHolder).map(c => c.shareClass)
    : [];

  const generateMutation = useMutation({
    mutationFn: async (data: { holderRef: string; shareClass: string; shares: number; threshold: number }) => {
      const res = await apiRequest("POST", "/api/v1/proofs/ownership", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedProofId(data.proofId);
      queryClient.invalidateQueries({ queryKey: ["/api/v1/proofs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/proofs/usage"] });
      toast({
        title: "Proof Generated",
        description: "Zero-knowledge ownership proof created successfully.",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("402")) {
        const isUpgrade = error.message.includes("upgrade_required");
        setUpgradeDialogOpen(true);
        toast({
          title: isUpgrade ? "Upgrade Required" : "Limit Reached",
          description: isUpgrade
            ? "Privacy Vault requires a Professional or Enterprise plan."
            : "You've reached your monthly proof limit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Proof Generation Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleGenerate = () => {
    const shares = parseInt(sharesInput);
    const threshold = parseInt(thresholdInput);
    if (!selectedHolder || !selectedShareClass || isNaN(shares) || isNaN(threshold) || threshold <= 0) {
      toast({ title: "Invalid Input", description: "Please fill all fields correctly.", variant: "destructive" });
      return;
    }
    generateMutation.mutate({ holderRef: selectedHolder, shareClass: selectedShareClass, shares, threshold });
  };

  const handleCopyLink = (proofId: string) => {
    navigator.clipboard.writeText(getVerifyUrl(proofId));
    toast({ title: "Link Copied", description: "Verification link copied to clipboard." });
  };

  const handleCopyProofId = (proofId: string) => {
    navigator.clipboard.writeText(proofId);
    toast({ title: "Proof ID Copied", description: "Proof ID copied to clipboard." });
  };

  const resetDialog = () => {
    setSelectedHolder("");
    setSelectedShareClass("");
    setSharesInput("");
    setThresholdInput("");
    setGeneratedProofId(null);
    setDialogOpen(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-privacy-vault">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Privacy Vault
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate zero-knowledge proofs to verify ownership without exposing your cap table
          </p>
        </div>
        {noirEnabled && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-generate-proof" disabled={commitments.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Ownership Proof
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Generate Ownership Proof</DialogTitle>
                <DialogDescription>
                  Create a zero-knowledge proof that a stakeholder meets an ownership threshold without revealing exact holdings.
                </DialogDescription>
              </DialogHeader>

              {generatedProofId ? (
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-green-500/5">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <p className="font-semibold text-lg">Proof Generated</p>
                    <p className="text-sm text-muted-foreground text-center">
                      Share the verification link below. Anyone with the link can verify the proof — no login required.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Proof ID</Label>
                    <div className="flex gap-2">
                      <Input value={generatedProofId} readOnly data-testid="input-generated-proof-id" />
                      <Button variant="outline" size="icon" onClick={() => handleCopyProofId(generatedProofId!)} data-testid="button-copy-proof-id">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Verification Link</Label>
                    <div className="flex gap-2">
                      <Input value={getVerifyUrl(generatedProofId)} readOnly className="text-xs" data-testid="input-verify-link" />
                      <Button variant="outline" size="icon" onClick={() => handleCopyLink(generatedProofId)} data-testid="button-copy-link">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetDialog} data-testid="button-done">Done</Button>
                    <Button onClick={() => window.open(getVerifyUrl(generatedProofId), "_blank")} data-testid="button-open-verify">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Verification Page
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="holder">Stakeholder</Label>
                    <Select value={selectedHolder} onValueChange={(v) => { setSelectedHolder(v); setSelectedShareClass(""); }} data-testid="select-holder">
                      <SelectTrigger id="holder" data-testid="select-holder-trigger">
                        <SelectValue placeholder="Select stakeholder..." />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueHolders.map(h => (
                          <SelectItem key={h} value={h} data-testid={`option-holder-${h.substring(0, 8)}`}>{h.substring(0, 8)}...</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="share-class">Share Class</Label>
                    <Select value={selectedShareClass} onValueChange={setSelectedShareClass} disabled={!selectedHolder} data-testid="select-share-class">
                      <SelectTrigger id="share-class" data-testid="select-share-class-trigger">
                        <SelectValue placeholder="Select share class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {holderShareClasses.map(sc => (
                          <SelectItem key={sc} value={sc} data-testid={`option-class-${sc.substring(0, 8)}`}>{sc.substring(0, 8)}...</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shares">Number of Shares</Label>
                    <Input
                      id="shares"
                      type="number"
                      placeholder="e.g. 10000"
                      value={sharesInput}
                      onChange={(e) => setSharesInput(e.target.value)}
                      data-testid="input-shares"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Ownership Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      placeholder="e.g. 5000"
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      data-testid="input-threshold"
                    />
                    <p className="text-xs text-muted-foreground">
                      The proof will verify that the stakeholder owns at least this many shares, without revealing the exact number.
                    </p>
                  </div>
                  {generateMutation.isPending ? (
                    <SecurityRitualProgress />
                  ) : (
                    <DialogFooter>
                      <Button variant="outline" onClick={resetDialog} data-testid="button-cancel">Cancel</Button>
                      <Button
                        onClick={handleGenerate}
                        disabled={!selectedHolder || !selectedShareClass || !sharesInput || !thresholdInput}
                        data-testid="button-submit-proof"
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Generate Proof
                      </Button>
                    </DialogFooter>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!noirEnabled && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5" data-testid="card-upgrade-banner">
          <CardContent className="flex items-center gap-6 py-6">
            <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowUpCircle className="h-7 w-7 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Upgrade to unlock Privacy Vault</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Zero-knowledge proofs are available on Professional and Enterprise plans.
                Prove ownership without exposing your cap table.
              </p>
            </div>
            <Button onClick={() => setLocation("/profile")} className="flex-shrink-0" data-testid="button-upgrade-cta">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {noirEnabled && maxProofs > 0 && (
        <Card data-testid="card-usage-meter">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monthly Proof Usage</span>
              <span className="text-sm text-muted-foreground" data-testid="text-usage-count">
                {currentCount} of {maxProofs} proofs used
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" data-testid="progress-usage" />
            {currentCount >= maxProofs && (
              <p className="text-xs text-amber-600 mt-2" data-testid="text-limit-warning">
                Monthly limit reached. Upgrade to Enterprise for higher limits.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-vault-status">
        <CardHeader>
          <CardTitle className="text-lg">Vault Status</CardTitle>
          <CardDescription>Zero-knowledge proof system overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Proofs</p>
                <p className="text-2xl font-bold" data-testid="text-total-proofs">{totalProofs}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold" data-testid="text-verified-proofs">{verifiedCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold" data-testid="text-pending-proofs">{pendingCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-recent-proofs">
        <CardHeader>
          <CardTitle className="text-lg">Recent Proofs</CardTitle>
          <CardDescription>History of generated zero-knowledge proofs</CardDescription>
        </CardHeader>
        <CardContent>
          {proofsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : proofs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-empty-state">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No proofs generated yet</p>
              <p className="text-sm mt-1">Generate your first ownership proof to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proofs.map((proof) => (
                  <TableRow key={proof.id} data-testid={`row-proof-${proof.id.substring(0, 8)}`}>
                    <TableCell className="text-sm">
                      {proof.createdAt ? new Date(proof.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{proof.proofType?.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {proof.publicInputs?.threshold ? `≥ ${proof.publicInputs.threshold.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(proof.status)}</TableCell>
                    <TableCell>
                      {proof.status === "complete" && (
                        <Button variant="ghost" size="sm" onClick={() => handleCopyLink(proof.id)} data-testid={`button-copy-${proof.id.substring(0, 8)}`}>
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy Link
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[420px]" data-testid="dialog-upgrade">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-amber-500" />
              Upgrade Required
            </DialogTitle>
            <DialogDescription>
              Your current plan doesn't include Privacy Vault access, or you've reached your monthly proof limit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="font-medium text-sm">Professional — $149/mo</p>
              <p className="text-xs text-muted-foreground mt-1">10 proofs/month, Privacy Vault access</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="font-medium text-sm">Enterprise — $399/mo</p>
              <p className="text-xs text-muted-foreground mt-1">100 proofs/month, priority support</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)} data-testid="button-upgrade-cancel">Later</Button>
            <Button onClick={() => { setUpgradeDialogOpen(false); setLocation("/profile"); }} data-testid="button-upgrade-go">
              <Zap className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
