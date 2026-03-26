import { useState } from "react";
import { CheckCircle, Search, ShieldCheck, XCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface VerifyResult {
  proofId: string;
  proofType: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

function extractProofId(input: string): string {
  const urlMatch = input.match(/\/verify\/([a-f0-9-]+)/i);
  if (urlMatch) return urlMatch[1];
  return input.trim();
}

export default function VerifyProofPage() {
  const { toast } = useToast();
  const [proofInput, setProofInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const proofId = extractProofId(proofInput);
    if (!proofId) {
      toast({ title: "Invalid Input", description: "Please enter a proof ID or verification URL.", variant: "destructive" });
      return;
    }

    setVerifying(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/v1/verify/${proofId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Proof not found");
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError("Failed to verify proof. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" data-testid="page-verify-proof">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <CheckCircle className="h-6 w-6 text-primary" />
          Verify a Proof
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste a proof ID or verification link to confirm ownership claims
        </p>
      </div>

      <Card data-testid="card-verify-input">
        <CardHeader>
          <CardTitle className="text-lg">Verification Input</CardTitle>
          <CardDescription>Enter a proof identifier to verify its authenticity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proof-id">Proof ID or Verification URL</Label>
            <Input
              id="proof-id"
              placeholder="Enter proof ID or paste verification URL..."
              value={proofInput}
              onChange={(e) => setProofInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              data-testid="input-proof-id"
            />
          </div>
          <Button onClick={handleVerify} disabled={verifying || !proofInput.trim()} className="w-full" data-testid="button-verify">
            {verifying ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying...</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />Verify</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="card-verify-result">
        <CardHeader>
          <CardTitle className="text-lg">Verification Result</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8" data-testid="verify-error">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="font-semibold text-lg text-red-600">Verification Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center gap-3 py-8" data-testid="verify-result">
              {result.isValid ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <p className="font-semibold text-lg text-green-600" data-testid="text-verified">Verified</p>
                  <p className="text-sm text-muted-foreground">This ownership proof is valid and has been cryptographically verified.</p>
                </>
              ) : result.status === "expired" ? (
                <>
                  <Clock className="h-16 w-16 text-amber-500" />
                  <p className="font-semibold text-lg text-amber-600" data-testid="text-expired">Expired</p>
                  <p className="text-sm text-muted-foreground">This proof has expired and is no longer valid.</p>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-500" />
                  <p className="font-semibold text-lg text-red-600" data-testid="text-invalid">Invalid</p>
                  <p className="text-sm text-muted-foreground">This proof could not be verified.</p>
                </>
              )}
              <div className="mt-4 w-full max-w-sm space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Proof ID</span>
                  <span className="font-mono text-xs">{result.proofId?.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{result.proofType?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Created</span>
                  <span>{result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-empty-result">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No verification performed yet</p>
              <p className="text-sm mt-1">Enter a proof ID above to check its validity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
