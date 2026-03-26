import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatShares, formatPercent, getInitials, getAvatarColor } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  TrendingUp,
  Layers,
  DollarSign,
  FileText,
  Shield,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Stakeholder, Security, ShareClass, SafeAgreement, Company, EsopPool, EsopPlan, EsopGrant } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

function computeVestedShares(grant: EsopGrant): number {
  if (!grant.vestingStartDate || !grant.vestingDurationMonths) return grant.shares;
  const start = new Date(grant.vestingStartDate);
  const now = new Date();
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (grant.cliffMonths && monthsElapsed < grant.cliffMonths) return 0;
  if (monthsElapsed >= grant.vestingDurationMonths) return grant.shares;
  const freq = grant.vestFrequencyMonths || 1;
  const vestingPeriods = Math.floor(monthsElapsed / freq);
  const totalPeriods = Math.floor(grant.vestingDurationMonths / freq);
  if (totalPeriods === 0) return grant.shares;
  return Math.min(grant.shares, Math.floor((grant.shares * vestingPeriods) / totalPeriods));
}

const COLORS = [
  "hsl(217, 91%, 35%)",
  "hsl(142, 76%, 36%)",
  "hsl(271, 91%, 35%)",
  "hsl(36, 100%, 45%)",
  "hsl(339, 90%, 51%)",
  "hsl(200, 80%, 40%)",
  "hsl(160, 60%, 40%)",
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  testId,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1 truncate" data-testid={`${testId}-value`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OwnershipChart({ securities, stakeholders, getDisplayName }: { securities: Security[]; stakeholders: Stakeholder[]; getDisplayName: (id: string, name: string) => string }) {
  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));
  const ownershipData: { name: string; shares: number }[] = [];

  const activeSecurities = securities.filter((s) => s.status === "active");
  const totalShares = activeSecurities.reduce((sum, s) => sum + s.shares, 0);

  const stakeholderShares = new Map<string, number>();
  for (const sec of activeSecurities) {
    const current = stakeholderShares.get(sec.stakeholderId) || 0;
    stakeholderShares.set(sec.stakeholderId, current + sec.shares);
  }

  for (const [stakeholderId, shares] of stakeholderShares) {
    const stakeholder = stakeholderMap.get(stakeholderId);
    ownershipData.push({
      name: getDisplayName(stakeholderId, stakeholder?.name || "Unknown"),
      shares,
    });
  }

  ownershipData.sort((a, b) => b.shares - a.shares);

  if (ownershipData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No equity data yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-44 h-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ownershipData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="shares"
            >
              {ownershipData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatShares(value), "Shares"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {ownershipData.slice(0, 5).map((item, idx) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="text-sm truncate flex-1">{item.name}</span>
            <span className="text-sm font-medium text-muted-foreground shrink-0">
              {formatPercent((item.shares / totalShares) * 100)}
            </span>
          </div>
        ))}
        {ownershipData.length > 5 && (
          <p className="text-xs text-muted-foreground pl-5">+{ownershipData.length - 5} more</p>
        )}
      </div>
    </div>
  );
}

function RecentActivity({ securities, stakeholders, safes, getDisplayName, privacyEnabled }: { securities: Security[]; stakeholders: Stakeholder[]; safes: SafeAgreement[]; getDisplayName: (id: string, name: string) => string; privacyEnabled?: boolean }) {
  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  const activities: { id: string; text: string; type: string; date: string; initials: string; name: string }[] = [];

  for (const sec of securities.slice(-5)) {
    const sh = stakeholderMap.get(sec.stakeholderId);
    const displayName = getDisplayName(sec.stakeholderId, sh?.name || "Unknown");
    activities.push({
      id: sec.id,
      text: `${formatShares(sec.shares)} shares issued to ${displayName}`,
      type: "equity",
      date: sec.issueDate,
      initials: privacyEnabled ? "#" : (sh ? getInitials(sh.name) : "??"),
      name: displayName,
    });
  }

  for (const safe of safes.slice(-3)) {
    const sh = stakeholderMap.get(safe.stakeholderId);
    const displayName = getDisplayName(safe.stakeholderId, sh?.name || "Unknown");
    activities.push({
      id: safe.id,
      text: `SAFE of ${formatCurrency(safe.investmentAmount)} from ${displayName}`,
      type: "safe",
      date: safe.issueDate || "",
      initials: privacyEnabled ? "#" : (sh ? getInitials(sh.name) : "??"),
      name: displayName,
    });
  }

  activities.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 4).map((activity) => (
        <div key={activity.id} className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`text-xs font-medium text-white ${privacyEnabled ? "font-mono" : ""}`} style={{ backgroundColor: privacyEnabled ? "#374151" : getAvatarColor(activity.name) }}>{activity.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{activity.text}</p>
            <p className="text-xs text-muted-foreground">{activity.date || "N/A"}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {activity.type === "equity" ? "Equity" : "SAFE"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: company, isLoading: loadingCompany } = useQuery<Company>({ queryKey: ["/api/company"] });
  const { data: stakeholders = [], isLoading: loadingStakeholders } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });
  const { data: shareClasses = [], isLoading: loadingClasses } = useQuery<ShareClass[]>({ queryKey: ["/api/share-classes"] });
  const { data: securities = [], isLoading: loadingSecurities } = useQuery<Security[]>({ queryKey: ["/api/securities"] });
  const { data: safes = [], isLoading: loadingSafes } = useQuery<SafeAgreement[]>({ queryKey: ["/api/safes"] });
  const { data: esopPools = [] } = useQuery<EsopPool[]>({ queryKey: ["/api/esop-pools"] });
  const { data: esopPlans = [] } = useQuery<EsopPlan[]>({ queryKey: ["/api/esop-plans"] });
  const { data: esopGrants = [] } = useQuery<EsopGrant[]>({ queryKey: ["/api/esop-grants"] });
  const privacy = usePrivacyMode();

  const isLoading = loadingCompany || loadingStakeholders || loadingClasses || loadingSecurities || loadingSafes;

  const totalIssuedShares = securities
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.shares, 0);

  const totalSafeAmount = safes
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + parseFloat(s.investmentAmount), 0);

  const totalEquityValue = securities
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.shares * parseFloat(s.pricePerShare || "0"), 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-3 pb-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
            {company?.name || "Tableicity"} Cap Table
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your company's equity and capitalization
          </p>
        </div>
        <PrivacyToggle enabled={privacy.enabled} onToggle={privacy.toggle} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stakeholders"
          value={stakeholders.length.toString()}
          subtitle={`${stakeholders.filter((s) => s.type === "investor").length} investors`}
          icon={Users}
          testId="stat-stakeholders"
        />
        <StatCard
          title="Issued Shares"
          value={formatShares(totalIssuedShares)}
          subtitle={`of ${formatShares(company?.totalAuthorizedShares || 10000000)} authorized`}
          icon={Shield}
          testId="stat-shares"
        />
        <StatCard
          title="Equity Value"
          value={formatCurrency(totalEquityValue)}
          subtitle={`${shareClasses.length} share classes`}
          icon={TrendingUp}
          testId="stat-equity"
        />
        <StatCard
          title="SAFE Investment"
          value={formatCurrency(totalSafeAmount)}
          subtitle={`${safes.filter((s) => s.status === "signed").length} signed agreements`}
          icon={DollarSign}
          testId="stat-safes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Ownership Breakdown (Top Five)</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <OwnershipChart securities={securities} stakeholders={stakeholders} getDisplayName={privacy.getDisplayName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <a href="/audit-logs" title="View all activity" data-testid="link-all-activity">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
            </a>
          </CardHeader>
          <CardContent className="pt-2">
            <RecentActivity securities={securities} stakeholders={stakeholders} safes={safes} getDisplayName={privacy.getDisplayName} privacyEnabled={privacy.enabled} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Share Classes</p>
            </div>
            {shareClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No share classes defined</p>
            ) : (
              <div className="space-y-2">
                {shareClasses.map((sc) => (
                  <div key={sc.id} className="flex items-center justify-between">
                    <span className="text-sm">{sc.name}</span>
                    <Badge variant="outline" className="text-xs">{sc.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Active SAFEs</p>
            </div>
            {safes.filter((s) => s.status !== "cancelled" && s.status !== "converted").length === 0 ? (
              <p className="text-sm text-muted-foreground">No active SAFE agreements</p>
            ) : (
              <div className="space-y-2">
                {safes
                  .filter((s) => s.status !== "cancelled" && s.status !== "converted")
                  .slice(0, 4)
                  .map((safe) => {
                    const sh = stakeholders.find((s) => s.id === safe.stakeholderId);
                    return (
                      <div key={safe.id} className="flex items-center justify-between">
                        <span className="text-sm truncate">{sh?.name || "Unknown"}</span>
                        <span className="text-sm font-medium">{formatCurrency(safe.investmentAmount)}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">By Stakeholder Type</p>
            </div>
            {stakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stakeholders yet</p>
            ) : (
              <div className="space-y-2">
                {["founder", "investor", "employee", "advisor"].map((type) => {
                  const count = stakeholders.filter((s) => s.type === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type}s</span>
                      <span className="text-sm font-medium text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" data-testid="card-employee-equity">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Employee Equity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {esopPools.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equity pools defined yet</p>
            ) : (() => {
              const totalAllocated = esopPools.reduce((sum, p) => sum + p.allocatedShares, 0);
              const totalExercised = esopPools.reduce((sum, p) => sum + (p.exercisedShares || 0), 0);

              const totalGranted = esopGrants.reduce((sum, g) => sum + g.shares, 0);
              const totalVested = esopGrants.reduce((sum, g) => sum + computeVestedShares(g), 0);

              const totals = {
                size: totalAllocated,
                granted: totalGranted,
                vested: totalVested,
                exercised: totalExercised,
              };
              const grantable = Math.max(totals.size - totalGranted, 0);
              const EQUITY_COLORS = {
                exercised: "hsl(339, 90%, 51%)",
                vested: "hsl(271, 91%, 35%)",
                granted: "#E67E22",
                grantable: "#16A085",
              };
              const segments = [
                { label: "Exercised", value: totals.exercised, bg: EQUITY_COLORS.exercised },
                { label: "Vested", value: totals.vested, bg: EQUITY_COLORS.vested },
                { label: "Granted", value: totals.granted - totals.vested, bg: EQUITY_COLORS.granted },
                { label: "Grantable", value: grantable, bg: EQUITY_COLORS.grantable },
              ];
              const legend = [
                { label: "Grantable", bg: EQUITY_COLORS.grantable },
                { label: "Granted", bg: EQUITY_COLORS.granted },
                { label: "Vested", bg: EQUITY_COLORS.vested },
                { label: "Exercised", bg: EQUITY_COLORS.exercised },
              ];

              return (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Grantable", value: grantable },
                      { label: "Granted", value: totals.granted },
                      { label: "Vested", value: totals.vested },
                      { label: "Exercised", value: totals.exercised },
                    ].map((item) => (
                      <div key={item.label} className="text-center" data-testid={`equity-metric-${item.label.toLowerCase()}`}>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-lg font-bold mt-0.5">{formatShares(item.value)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      {legend.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.bg }} />
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {esopPools.map((pool) => {
                    const poolGranted = esopGrants
                      .filter((g) => g.poolId === pool.id)
                      .reduce((sum, g) => sum + g.shares, 0);
                    const poolVested = esopGrants
                      .filter((g) => g.poolId === pool.id)
                      .reduce((sum, g) => sum + computeVestedShares(g), 0);
                    const poolGrantable = Math.max(pool.allocatedShares - poolGranted, 0);
                    const poolExercised = pool.exercisedShares || 0;
                    const grantedOnly = Math.max(poolGranted - poolVested, 0);
                    const poolSegments = [
                      { label: "Exercised", value: poolExercised, bg: EQUITY_COLORS.exercised },
                      { label: "Vested", value: poolVested, bg: EQUITY_COLORS.vested },
                      { label: "Granted", value: grantedOnly, bg: EQUITY_COLORS.granted },
                      { label: "Grantable", value: poolGrantable, bg: EQUITY_COLORS.grantable },
                    ];
                    return (
                      <div key={pool.id} className="space-y-1" data-testid={`equity-pool-${pool.id}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{pool.name}</p>
                          <p className="text-xs text-muted-foreground">{pool.allocatedShares.toLocaleString()} shares</p>
                        </div>
                        <div
                          className="h-2 overflow-hidden flex rounded-full"
                        >
                          {poolSegments.filter(s => s.value > 0).map((seg, i) => (
                            <div
                              key={i}
                              className="h-full transition-all"
                              style={{ width: `${(seg.value / pool.allocatedShares) * 100}%`, backgroundColor: seg.bg }}
                              title={`${seg.label}: ${seg.value.toLocaleString()}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1" data-testid="card-equity-plan-by-type">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Equity Plan by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {esopPools.length === 0 && esopPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equity plans defined yet</p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const names = new Set<string>();
                  const items: { name: string; type: string }[] = [];
                  for (const pool of esopPools) {
                    if (!names.has(pool.name)) {
                      names.add(pool.name);
                      items.push({ name: pool.name, type: "Pool" });
                    }
                  }
                  for (const plan of esopPlans) {
                    if (!names.has(plan.name)) {
                      names.add(plan.name);
                      items.push({ name: plan.name, type: "Plan" });
                    }
                  }
                  return items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between py-1.5 border-b last:border-0" data-testid={`equity-type-${item.name}`}>
                      <span className="text-sm">{item.name}</span>
                      <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PlatformDisclaimer />
    </div>
  );
}
