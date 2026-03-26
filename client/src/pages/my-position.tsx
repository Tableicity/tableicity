import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/lib/tenant-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  TrendingUp,
  Shield,
  FileText,
  Briefcase,
  Building2,
} from "lucide-react";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";

interface PositionData {
  company: { name: string; legalName: string | null };
  stakeholder: {
    id: string;
    name: string;
    email: string;
    type: string;
    title: string | null;
  };
  securities: Array<{
    id: string;
    shares: number;
    pricePerShare: string | null;
    issueDate: string;
    status: string;
    certificateId: string | null;
    vestingSchedule: string | null;
    notes: string | null;
    shareClassId: string;
  }>;
  shareClasses: Array<{
    id: string;
    name: string;
    type: string;
    pricePerShare: string | null;
  }>;
  safeAgreements: Array<{
    id: string;
    investmentAmount: string;
    valuationCap: string | null;
    discountRate: string | null;
    safeType: string;
    status: string;
    issueDate: string | null;
  }>;
  summary: {
    totalShares: number;
    ownershipPercentage: string;
    totalValue: string;
    activeSecurities: number;
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatCurrency(v: string | number): string {
  const num = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

export default function MyPositionPage() {
  const { currentTenant } = useTenant();

  const { data, isLoading, error } = useQuery<PositionData>({
    queryKey: ["/api/my-position", currentTenant],
    enabled: !!currentTenant,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2" data-testid="text-no-position">No Equity Position Found</h2>
            <p className="text-sm text-muted-foreground">
              Your account is not linked to a stakeholder record in this company.
              Contact your company administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shareClassMap = new Map(data.shareClasses.map(sc => [sc.id, sc]));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-position-title">My Equity Position</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-company-name">
              {data.company.name} {data.stakeholder.title && `\u2022 ${data.stakeholder.title}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-shares">
              {formatNumber(data.summary.totalShares)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active holdings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ownership</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-ownership-pct">
              {data.summary.ownershipPercentage}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Of total authorized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-value">
              {formatCurrency(data.summary.totalValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">At issue price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Securities</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-security-count">
              {data.summary.activeSecurities}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active grants</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Securities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Certificate</TableHead>
                <TableHead>Share Class</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Price/Share</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Vesting</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.securities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No securities found</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.securities.map((sec) => {
                  const sc = shareClassMap.get(sec.shareClassId);
                  return (
                    <TableRow key={sec.id} data-testid={`row-security-${sec.id}`}>
                      <TableCell className="pl-5 font-medium">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {sec.certificateId || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{sc?.name || "Unknown"}</span>
                          <Badge variant="secondary">{sc?.type || ""}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(sec.shares)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {sec.pricePerShare ? formatCurrency(sec.pricePerShare) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sec.issueDate}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sec.vestingSchedule || "-"}
                      </TableCell>
                      <TableCell className="pr-5">
                        <Badge
                          variant={sec.status === "active" ? "default" : "secondary"}
                          className={sec.status === "active" ? "bg-green-500/10 text-green-700 dark:text-green-400" : ""}
                        >
                          {sec.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.safeAgreements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SAFE Agreements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Type</TableHead>
                  <TableHead className="text-right">Investment</TableHead>
                  <TableHead className="text-right">Valuation Cap</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.safeAgreements.map((safe) => (
                  <TableRow key={safe.id} data-testid={`row-safe-${safe.id}`}>
                    <TableCell className="pl-5 font-medium capitalize">
                      {safe.safeType}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(safe.investmentAmount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {safe.valuationCap ? formatCurrency(safe.valuationCap) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {safe.discountRate ? `${safe.discountRate}%` : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {safe.issueDate || "-"}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Badge variant={safe.status === "signed" ? "default" : "secondary"}>
                        {safe.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <PlatformDisclaimer />
    </div>
  );
}
