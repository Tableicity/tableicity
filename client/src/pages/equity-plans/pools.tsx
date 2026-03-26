import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, ListFilter, CheckCircle2, ArrowRight, Users, BookOpen, Download, ExternalLink, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials, getAvatarColor } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { EsopPool, EsopGrant, EsopPlan, ShareClass, Stakeholder, Security, Document } from "@shared/schema";

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

const formSchema = z.object({
  name: z.string().min(1, "Pool name is required"),
  allocatedShares: z.coerce.number().int().positive("Amount must be greater than 0"),
  approvedDate: z.string().min(1, "Date is required"),
  underlyingShareClass: z.string().min(1, "Share class is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function PoolsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<EsopPool | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EsopPool | null>(null);
  const [summaryPool, setSummaryPool] = useState<EsopPool | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(() => {
    return localStorage.getItem("pools-test-drive-dismissed") !== "true";
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: pools = [], isLoading } = useQuery<EsopPool[]>({ queryKey: ["/api/esop-pools"] });
  const { data: shareClasses = [] } = useQuery<ShareClass[]>({ queryKey: ["/api/share-classes"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });
  const { data: securities = [] } = useQuery<Security[]>({ queryKey: ["/api/securities"] });
  const { data: esopGrants = [] } = useQuery<EsopGrant[]>({ queryKey: ["/api/esop-grants"] });
  const { data: esopPlans = [] } = useQuery<EsopPlan[]>({ queryKey: ["/api/esop-plans"] });
  const { data: resourceDocs = [] } = useQuery<Document[]>({ queryKey: ["/api/tenant-resources"] });

  const poolGrantStats = new Map<string, { granted: number; vested: number; exercised: number }>();
  for (const grant of esopGrants) {
    const stats = poolGrantStats.get(grant.poolId) || { granted: 0, vested: 0, exercised: 0 };
    stats.granted += grant.shares;
    stats.vested += computeVestedShares(grant);
    stats.exercised += grant.exercisedShares || 0;
    poolGrantStats.set(grant.poolId, stats);
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      allocatedShares: 0,
      approvedDate: new Date().toISOString().split("T")[0],
      underlyingShareClass: "Common",
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      allocatedShares: 0,
      approvedDate: "",
      underlyingShareClass: "Common",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/esop-pools", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      setAddOpen(false);
      form.reset();
      toast({ title: "Pool created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormValues }) => {
      const res = await apiRequest("PATCH", `/api/esop-pools/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      setEditingPool(null);
      toast({ title: "Pool updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/esop-pools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      setDeleteTarget(null);
      toast({ title: "Pool deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function openEdit(pool: EsopPool) {
    setEditingPool(pool);
    editForm.reset({
      name: pool.name,
      allocatedShares: pool.allocatedShares,
      approvedDate: pool.approvedDate,
      underlyingShareClass: pool.underlyingShareClass,
    });
  }

  const shareClassOptions = shareClasses.length > 0
    ? shareClasses.map((sc) => sc.name)
    : ["Common", "Preferred"];

  const mostRecentPool = pools.length > 0
    ? pools[pools.length - 1]
    : null;

  return (
    <div className="p-6 space-y-6" data-testid="pools-page">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Equity Plans — Pools</h1>
        <p className="text-muted-foreground mt-1">Manage your ESOP option pools</p>
      </div>

      {showTestDrive && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40" data-testid="card-test-drive-pools">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" role="img" aria-label="car">🚗</span>
                <div>
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Take a Test Drive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Before going live, explore every Pools feature using our pre-loaded test data. Walk through adding, editing, and managing your Pool — then check off each step as you go.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Do not proceed to the next section until all checklist items are marked complete.
                  </p>
                  <Link href="/data-room?category=test_drives">
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-start-test-drive-pools">
                      Start Test Drive
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 shrink-0"
                onClick={() => { setShowTestDrive(false); localStorage.setItem("pools-test-drive-dismissed", "true"); }}
                data-testid="button-dismiss-test-drive-pools"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">How Equity Plans Work</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm text-muted-foreground">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground">1. Pool</p>
                <p>The total number of shares (or % of cap table) set aside and Board-approved for the equity plan. Think of the pool as the bucket of available options.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">2. Plan</p>
                <p>The legal document and rules governing how options are granted — vesting schedules, cliff periods, exercise windows, and eligibility criteria.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">3. Grant</p>
                <p>Individual option awards made to specific employees or advisors, drawn from the Pool and governed by the Plan.</p>
              </div>
            </div>
            <div className="border-t pt-4 bg-amber-50 dark:bg-amber-950/30 rounded-md p-3">
              <p className="text-amber-800 dark:text-amber-200 font-medium text-xs">⚠ Board approval required</p>
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                Your ESOP pool should be formally approved by the Board of Directors before creating it here. Keep a signed Board resolution in your Data Store.
              </p>
            </div>
            {(() => {
              const esopResources = resourceDocs.filter((d) =>
                d.description && d.description.includes("[Platform Resource:") &&
                (d.name.toLowerCase().includes("esop") || d.name.toLowerCase().includes("equity") || d.name.toLowerCase().includes("stock option") || (d.description && d.description.toLowerCase().includes("esop")))
              );
              const allResources = resourceDocs.filter((d) =>
                d.description && d.description.includes("[Platform Resource:")
              );
              const displayDocs = esopResources.length > 0 ? esopResources : allResources;
              if (displayDocs.length === 0) return null;
              return (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-foreground text-sm">Toolkit</p>
                  </div>
                  <div className="space-y-2">
                    {displayDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-md border p-2.5 hover:bg-muted/50 transition-colors"
                        data-testid={`toolkit-doc-${doc.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium truncate">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigate("/data-room")}
                            title="View in Data Room"
                            data-testid={`button-view-doc-${doc.id}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          {(doc.content || doc.fileUrl) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={async () => {
                                try {
                                  const { appendTenantParam } = await import("@/lib/tenant-context");
                                  const res = await fetch(appendTenantParam(`/api/documents/${doc.id}/download`), { credentials: "include" });
                                  if (!res.ok) {
                                    toast({ title: "Download failed", variant: "destructive" });
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
                                  toast({ title: "Download failed", variant: "destructive" });
                                }
                              }}
                              title="Download"
                              data-testid={`button-download-toolkit-${doc.id}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  className="text-sm border rounded px-2 py-1 bg-background"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  data-testid="input-date-filter"
                />
              </div>
              <Button
                onClick={() => { setAddOpen(true); form.reset({ name: "", allocatedShares: 0, approvedDate: new Date().toISOString().split("T")[0], underlyingShareClass: "Common" }); }}
                data-testid="button-add-pool"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                ADD POOL
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Grantable</TableHead>
                  <TableHead className="text-right">Granted</TableHead>
                  <TableHead className="text-right">Grant Vested</TableHead>
                  <TableHead className="text-right">Exercised</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2].map((i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <p className="text-sm text-muted-foreground">No pools yet. Click ADD POOL to create your first option pool.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pools.map((pool) => {
                    const stats = poolGrantStats.get(pool.id) || { granted: 0, vested: 0, exercised: 0 };
                    const poolGranted = stats.granted;
                    const grantable = Math.max(pool.allocatedShares - poolGranted, 0);
                    return (
                      <TableRow key={pool.id} data-testid={`row-pool-${pool.id}`} className="cursor-pointer" onClick={() => setSummaryPool(pool)}>
                        <TableCell className="pl-5 font-medium text-sm">{pool.name}</TableCell>
                        <TableCell className="text-right text-sm">{pool.allocatedShares.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{grantable.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{poolGranted.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{stats.vested.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{stats.exercised.toLocaleString()}</TableCell>
                        <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(pool)}
                              data-testid={`button-edit-pool-${pool.id}`}
                              title="Edit pool"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(pool)}
                              className="text-destructive"
                              data-testid={`button-delete-pool-${pool.id}`}
                              title="Delete pool"
                            >
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

            {pools.length > 0 && (() => {
              const totalAllocated = pools.reduce((sum, p) => sum + p.allocatedShares, 0);
              const allStats = pools.map(p => poolGrantStats.get(p.id) || { granted: 0, vested: 0, exercised: 0 });
              const totalGranted = allStats.reduce((sum, s) => sum + s.granted, 0);
              const totalVested = allStats.reduce((sum, s) => sum + s.vested, 0);
              const totalExercised = allStats.reduce((sum, s) => sum + s.exercised, 0);
              const totalGrantable = Math.max(totalAllocated - totalGranted, 0);

              const CHART_COLORS = ["hsl(142, 71%, 45%)", "hsl(25, 95%, 53%)", "hsl(48, 96%, 53%)", "hsl(221, 83%, 53%)"];
              const chartData = [
                { name: "Grantable", value: totalGrantable, color: CHART_COLORS[0] },
                { name: "Granted", value: totalGranted, color: CHART_COLORS[1] },
                { name: "Grant Vested", value: totalVested || 0, color: CHART_COLORS[2] },
                { name: "Exercised", value: totalExercised || 0, color: CHART_COLORS[3] },
              ].filter((d) => d.value > 0);
              if (chartData.length === 0) {
                chartData.push({ name: "Grantable", value: totalAllocated, color: CHART_COLORS[0] });
              }

              const totalAuthorized = shareClasses.reduce((sum, sc) => sum + (sc.authorizedShares || 0), 0);
              const totalIssued = securities.reduce((sum, s) => sum + (s.shares || 0), 0);
              const totalAvailable = totalAuthorized - totalIssued;

              const employeeStakeholders = stakeholders.filter((s) => s.type === "employee");
              const grantedPerStakeholder = new Map<string, number>();
              const vestedPerStakeholder = new Map<string, number>();
              for (const grant of esopGrants) {
                if (employeeStakeholders.some((e) => e.id === grant.stakeholderId)) {
                  grantedPerStakeholder.set(grant.stakeholderId, (grantedPerStakeholder.get(grant.stakeholderId) || 0) + grant.shares);
                  vestedPerStakeholder.set(grant.stakeholderId, (vestedPerStakeholder.get(grant.stakeholderId) || 0) + computeVestedShares(grant));
                }
              }
              const topEmployees = employeeStakeholders
                .map((e) => ({ ...e, totalShares: grantedPerStakeholder.get(e.id) || 0, vestedShares: vestedPerStakeholder.get(e.id) || 0 }))
                .filter((e) => e.totalShares > 0)
                .sort((a, b) => b.totalShares - a.totalShares)
                .slice(0, 5);

              return (
                <div className="border-t px-5 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Pool Allocation</p>
                      <div className="flex items-center gap-4">
                        <div className="w-[140px] h-[140px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={65}
                                dataKey="value"
                                strokeWidth={2}
                                stroke="hsl(var(--background))"
                              >
                                {chartData.map((entry, idx) => (
                                  <Cell key={idx} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => value.toLocaleString()}
                                contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 flex-1">
                          {chartData.map((d) => (
                            <div key={d.name} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-xs text-muted-foreground">{d.name}</span>
                              </div>
                              <span className="text-xs font-mono font-medium">{d.value.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">Total Size</span>
                              <span className="text-xs font-mono font-semibold">{totalAllocated.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-md border bg-muted/30 p-3 space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Share Classes Summary</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Authorized</span>
                          <span className="font-mono font-medium">{totalAuthorized.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Issued</span>
                          <span className="font-mono font-medium">{totalIssued.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-mono font-medium">{totalAvailable.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ESOP Participants</p>
                      </div>
                      {topEmployees.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4">No employee stakeholders found. Add employees in Stakeholders to see them here.</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-end gap-4 px-2 pb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-16 text-right">Vested</span>
                          </div>
                          {topEmployees.map((emp) => (
                            <div key={emp.id} className="flex items-center justify-between p-2 rounded-md border" data-testid={`row-employee-${emp.id}`}>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs font-medium text-white" style={{ backgroundColor: getAvatarColor(emp.name) }}>
                                    {getInitials(emp.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium leading-none">{emp.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{emp.title || "Employee"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-mono font-medium" data-testid={`text-total-${emp.id}`}>{emp.totalShares.toLocaleString()}</span>
                                <span className="text-sm font-mono font-medium text-green-600 w-16 text-right" data-testid={`text-vested-${emp.id}`}>{emp.vestedShares.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end px-5 py-4 border-t">
              <Button
                disabled={pools.length === 0}
                onClick={() => mostRecentPool && setSummaryPool(mostRecentPool)}
                data-testid="button-next"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add pool</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pool name</FormLabel>
                      <FormControl>
                        <Input placeholder="IT Phantoms, Options pool, …" {...field} data-testid="input-pool-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allocatedShares"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Amount allocated for grants</FormLabel>
                        <span className="text-xs text-muted-foreground">Shares</span>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Amount"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-allocated-shares"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="approvedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-pool-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="underlyingShareClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Underlying share class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-share-class">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shareClassOptions.map((sc) => (
                            <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                          ))}
                          {!shareClassOptions.includes("Common") && (
                            <SelectItem value="Common">Common</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                  {docsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  Documents
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <p className="text-xs text-muted-foreground px-1">Document attachments coming soon.</p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={noteOpen} onOpenChange={setNoteOpen}>
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                  {noteOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  Internal Note
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <p className="text-xs text-muted-foreground px-1">Internal notes coming soon.</p>
                </CollapsibleContent>
              </Collapsible>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)} data-testid="button-close-add-pool">
                  Close
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-pool">
                  {createMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPool} onOpenChange={(v) => { if (!v) setEditingPool(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit pool</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => editingPool && updateMutation.mutate({ id: editingPool.id, data }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pool name</FormLabel>
                      <FormControl><Input {...field} data-testid="input-edit-pool-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="allocatedShares"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Amount allocated</FormLabel>
                        <span className="text-xs text-muted-foreground">Shares</span>
                      </div>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-edit-allocated-shares" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="approvedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-edit-pool-date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="underlyingShareClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Underlying share class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-share-class">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shareClassOptions.map((sc) => (
                            <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                          ))}
                          {!shareClassOptions.includes("Common") && (
                            <SelectItem value="Common">Common</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingPool(null)} data-testid="button-cancel-edit-pool">Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-edit-pool">
                  {updateMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-pool">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete-pool"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!summaryPool} onOpenChange={(v) => { if (!v) setSummaryPool(null); }}>
        <SheetContent className="w-[420px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Pool Summary
            </SheetTitle>
          </SheetHeader>
          {summaryPool && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pool Name</span>
                  <span className="text-sm font-semibold">{summaryPool.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Approval Date</span>
                  <span className="text-sm">{summaryPool.approvedDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Share Class</span>
                  <span className="text-sm">{summaryPool.underlyingShareClass}</span>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Allocation</p>
                <div className="space-y-2">
                  {(() => {
                    const summaryStats = poolGrantStats.get(summaryPool.id) || { granted: 0, vested: 0, exercised: 0 };
                    const summaryGranted = summaryStats.granted;
                    const summaryGrantable = Math.max(summaryPool.allocatedShares - summaryGranted, 0);
                    return [
                      { label: "Total Size", value: summaryPool.allocatedShares },
                      { label: "Grantable", value: summaryGrantable },
                      { label: "Granted", value: summaryGranted },
                      { label: "Grant Vested", value: summaryStats.vested },
                      { label: "Exercised", value: summaryStats.exercised },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-mono font-medium">{value.toLocaleString()}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => { const poolId = summaryPool.id; setSummaryPool(null); window.location.href = `/equity-plans/plans?poolId=${poolId}`; }}
                  data-testid="button-go-to-plans"
                >
                  Continue to Plans
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setSummaryPool(null)} data-testid="button-close-summary">
                  Back to Pools
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
