import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ShieldCheck, Copy, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ProofRecord {
  id: string;
  proofType: string;
  status: string;
  requestedBy: string;
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

export default function AuditProofsPage() {
  const { toast } = useToast();

  const { data: proofsData, isLoading } = useQuery<ProofsResponse>({
    queryKey: ["/api/v1/proofs"],
  });

  const proofs = proofsData?.proofs || [];

  const handleCopyId = (proofId: string) => {
    navigator.clipboard.writeText(proofId);
    toast({ title: "Copied", description: "Proof ID copied to clipboard." });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-audit-proofs">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <ClipboardList className="h-6 w-6 text-primary" />
          Audit Proofs
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete history of all verification events
        </p>
      </div>

      <Card data-testid="card-audit-table">
        <CardHeader>
          <CardTitle className="text-lg">Proof History</CardTitle>
          <CardDescription>All zero-knowledge proof requests and their outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : proofs.length === 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Proof Type</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12" data-testid="text-empty-state">
                    <div className="text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No audit records yet</p>
                      <p className="text-sm mt-1">Proof history will appear here as proofs are generated and verified</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Proof ID</TableHead>
                  <TableHead>Proof Type</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proofs.map((proof) => (
                  <TableRow key={proof.id} data-testid={`row-audit-${proof.id.substring(0, 8)}`}>
                    <TableCell className="text-sm">
                      {proof.createdAt ? new Date(proof.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {proof.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {proof.proofType?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {proof.publicInputs?.threshold ? `≥ ${proof.publicInputs.threshold.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(proof.status)}</TableCell>
                    <TableCell className="text-sm">
                      {proof.expiresAt ? new Date(proof.expiresAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyId(proof.id)} data-testid={`button-copy-audit-${proof.id.substring(0, 8)}`}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy ID
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
