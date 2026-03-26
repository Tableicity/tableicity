import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { CheckCircle, XCircle, Clock, Loader2, ShieldCheck, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerifyResult {
  proofId: string;
  proofType: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

export default function PublicVerifyPage() {
  const params = useParams<{ proofId: string }>();
  const proofId = params.proofId;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proofId) return;
    setLoading(true);
    fetch(`/api/v1/verify/${proofId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            setError("Too many requests. Please try again shortly.");
          } else {
            setError("This proof could not be found or has been removed.");
          }
        } else {
          setResult(data);
        }
      })
      .catch(() => setError("Unable to connect to the verification service. Please try again."))
      .finally(() => setLoading(false));
  }, [proofId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6" data-testid="page-public-verify">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white" data-testid="text-brand">Tableicity</h1>
          </div>
          <p className="text-slate-400 text-sm">Zero-Knowledge Proof Verification</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur shadow-2xl">
          <CardContent className="pt-8 pb-8 px-4 sm:px-6">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-8" data-testid="verify-loading">
                <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
                <p className="text-slate-300">Verifying proof...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4 py-4" data-testid="verify-error">
                <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-400" />
                </div>
                <p className="font-semibold text-xl text-red-400" data-testid="text-status">Verification Failed</p>
                <p className="text-sm text-slate-400 text-center">{error}</p>
              </div>
            ) : result?.isValid ? (
              <div className="flex flex-col items-center gap-4 py-4" data-testid="verify-valid">
                <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in duration-300">
                  <CheckCircle className="h-12 w-12 text-emerald-400" />
                </div>
                <p className="font-semibold text-xl text-emerald-400" data-testid="text-status">Verified</p>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 gap-1.5 px-3 py-1" data-testid="badge-zkp">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified by Zero-Knowledge Proof
                </Badge>
                <p className="text-sm text-slate-400 text-center mt-1">
                  This ownership claim has been cryptographically verified without revealing the underlying data.
                </p>
                <div className="w-full mt-4 space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">Proof ID</span>
                    <span className="font-mono text-xs text-slate-300 break-all" data-testid="text-proof-id">{result.proofId?.substring(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">Type</span>
                    <span className="text-slate-300 capitalize">{result.proofType?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">Created</span>
                    <span className="text-slate-300">{result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Expires</span>
                    <span className="text-slate-300">{result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </div>
            ) : result?.status === "expired" ? (
              <div className="flex flex-col items-center gap-4 py-4" data-testid="verify-expired">
                <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-12 w-12 text-amber-400" />
                </div>
                <p className="font-semibold text-xl text-amber-400" data-testid="text-status">Expired</p>
                <p className="text-sm text-slate-400 text-center">This proof has expired and is no longer valid for verification.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4" data-testid="verify-invalid">
                <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-400" />
                </div>
                <p className="font-semibold text-xl text-red-400" data-testid="text-status">Invalid</p>
                <p className="text-sm text-slate-400 text-center">This proof could not be verified. It may have been tampered with or is no longer available.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Powered by Noir zero-knowledge cryptography
        </p>
      </div>
    </div>
  );
}
