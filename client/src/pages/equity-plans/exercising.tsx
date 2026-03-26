import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, X, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EsopGrant, EsopPool, EsopPlan, Stakeholder } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partially_exercised: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  fully_exercised: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  forfeited: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  partially_exercised: "Partially Exercised",
  fully_exercised: "Fully Exercised",
  forfeited: "Forfeited",
  cancelled: "Cancelled",
  expired: "Expired",
};

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

function formatCurrency(val: string | number | null | undefined): string {
  if (val == null || val === "") return "$0.00";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export default function ExercisingPage() {
  const [exerciseTarget, setExerciseTarget] = useState<EsopGrant | null>(null);
  const [exerciseShares, setExerciseShares] = useState("");
  const [filterStatus, setFilterStatus] = useState<"exercisable" | "exercised" | "all">("exercisable");
  const [showTestDrive, setShowTestDrive] = useState(() => {
    return localStorage.getItem("exercising-test-drive-dismissed") !== "true";
  });
  const { toast } = useToast();

  const { data: grants = [], isLoading } = useQuery<EsopGrant[]>({ queryKey: ["/api/esop-grants"] });
  const { data: pools = [] } = useQuery<EsopPool[]>({ queryKey: ["/api/esop-pools"] });
  const { data: plans = [] } = useQuery<EsopPlan[]>({ queryKey: ["/api/esop-plans"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });

  const exerciseMutation = useMutation({
    mutationFn: async ({ id, sharesToExercise }: { id: string; sharesToExercise: number }) => {
      await apiRequest("PATCH", `/api/esop-grants/${id}/exercise`, { sharesToExercise });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esop-grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/esop-pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
      setExerciseTarget(null);
      setExerciseShares("");
      toast({ title: "Options exercised", description: "Securities have been issued to the cap table." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const grantsWithVesting = grants.map(g => {
    const computed = computeVestedShares(g);
    const exercisable = computed - (g.exercisedShares || 0);
    return { ...g, computedVested: computed, exercisable };
  });

  const filteredGrants = grantsWithVesting.filter(g => {
    if (filterStatus === "exercisable") return g.exercisable > 0 && g.status !== "fully_exercised" && g.status !== "cancelled" && g.status !== "forfeited";
    if (filterStatus === "exercised") return (g.exercisedShares || 0) > 0;
    return true;
  });

  const totalExercisable = grantsWithVesting.reduce((sum, g) => {
    if (g.status === "fully_exercised" || g.status === "cancelled" || g.status === "forfeited") return sum;
    return sum + Math.max(0, g.exercisable);
  }, 0);
  const totalExercised = grants.reduce((sum, g) => sum + (g.exercisedShares || 0), 0);
  const totalShares = grants.reduce((sum, g) => sum + g.shares, 0);

  const stakeholderName = (id: string) => stakeholders.find(s => s.id === id)?.name || "Unknown";
  const planName = (id: string) => plans.find(p => p.id === id)?.name || "Unknown";

  function openExercise(grant: EsopGrant & { exercisable: number }) {
    setExerciseTarget(grant);
    setExerciseShares(grant.exercisable > 0 ? String(grant.exercisable) : "");
  }

  return (
    <div className="p-6 space-y-6" data-testid="exercising-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/equity-plans/grants">
            <Button variant="ghost" size="icon" data-testid="button-back-to-grants">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Equity Plans — Exercising</h1>
            <p className="text-muted-foreground mt-1">Process option exercises and convert options to cap table shares</p>
          </div>
        </div>
      </div>

      {showTestDrive && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40" data-testid="card-test-drive-exercising">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" role="img" aria-label="car">🚗</span>
                <div>
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Take a Test Drive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Before going live, explore every Exercising feature using our pre-loaded test data. Walk through adding, editing, and managing your Exercise — then check off each step as you go.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Do not proceed to the next section until all checklist items are marked complete.
                  </p>
                  <Link href="/data-room?category=test_drives">
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-start-test-drive-exercising">
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
                onClick={() => { setShowTestDrive(false); localStorage.setItem("exercising-test-drive-dismissed", "true"); }}
                data-testid="button-dismiss-test-drive-exercising"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Granted</p>
            <p className="text-2xl font-bold mt-1" data-testid="text-total-shares">{totalShares.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Exercisable Now</p>
            <p className="text-2xl font-bold mt-1 text-green-600" data-testid="text-exercisable">{totalExercisable.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Exercised</p>
            <p className="text-2xl font-bold mt-1 text-blue-600" data-testid="text-exercised">{totalExercised.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Exercise Queue</CardTitle>
            <div className="flex gap-1">
              {(["exercisable", "exercised", "all"] as const).map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  data-testid={`button-filter-${status}`}
                >
                  {status === "exercisable" ? "Exercisable" : status === "exercised" ? "Exercised" : "All"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredGrants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">
                {filterStatus === "exercisable"
                  ? "No grants with exercisable options right now. Grants may be pre-cliff or already fully exercised."
                  : filterStatus === "exercised"
                    ? "No grants have been exercised yet."
                    : "No grants found. Create grants first from the Grants page."}
              </p>
              <Link href="/equity-plans/grants">
                <Button variant="outline" size="sm" className="mt-3" data-testid="button-go-grants">Go to Grants</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grant</TableHead>
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Vesting</TableHead>
                  <TableHead className="text-right">Exercisable</TableHead>
                  <TableHead className="text-right">Exercised</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrants.map(grant => {
                  const vestingPct = grant.shares > 0 ? Math.round((grant.computedVested / grant.shares) * 100) : 0;
                  const canExercise = grant.exercisable > 0 && grant.status !== "fully_exercised" && grant.status !== "cancelled" && grant.status !== "forfeited";

                  return (
                    <TableRow key={grant.id} data-testid={`row-exercise-${grant.id}`}>
                      <TableCell className="font-medium">{grant.grantName}</TableCell>
                      <TableCell>{stakeholderName(grant.stakeholderId)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{planName(grant.planId)}</TableCell>
                      <TableCell className="text-right">{grant.shares.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[100px]">
                          <Progress value={vestingPct} className="h-2" />
                          <p className="text-xs text-muted-foreground">{vestingPct}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {grant.exercisable > 0 ? grant.exercisable.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {(grant.exercisedShares || 0) > 0 ? (grant.exercisedShares || 0).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[grant.status] || ""}>
                          {STATUS_LABELS[grant.status] || grant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canExercise ? (
                          <Button size="sm" onClick={() => openExercise(grant)} data-testid={`button-exercise-${grant.id}`}>
                            <Play className="h-3.5 w-3.5 mr-1" /> Exercise
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!exerciseTarget} onOpenChange={(open) => { if (!open) { setExerciseTarget(null); setExerciseShares(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Options</DialogTitle>
            <DialogDescription>
              Convert vested options into shares on the cap table.
            </DialogDescription>
          </DialogHeader>
          {exerciseTarget && (() => {
            const computed = computeVestedShares(exerciseTarget);
            const exercisable = computed - (exerciseTarget.exercisedShares || 0);
            const sharesToEx = parseInt(exerciseShares) || 0;
            const totalCost = sharesToEx * parseFloat(exerciseTarget.exercisePrice || "0");

            return (
              <div className="space-y-4">
                <div className="rounded-md bg-muted p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Grant</span>
                    <span className="font-medium">{exerciseTarget.grantName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stakeholder</span>
                    <span>{stakeholderName(exerciseTarget.stakeholderId)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Shares</span>
                    <span>{exerciseTarget.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vested</span>
                    <span>{computed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Already Exercised</span>
                    <span>{(exerciseTarget.exercisedShares || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Exercisable Now</span>
                    <span className="text-green-600">{exercisable.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Shares to Exercise</label>
                  <Input
                    type="number"
                    value={exerciseShares}
                    onChange={(e) => setExerciseShares(e.target.value)}
                    max={exercisable}
                    min={1}
                    data-testid="input-exercise-shares"
                  />
                </div>

                {sharesToEx > 0 && (
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Exercise Preview</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 dark:text-blue-300">Shares to Issue</span>
                      <span className="font-medium">{sharesToEx.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 dark:text-blue-300">Exercise Price</span>
                      <span>{formatCurrency(exerciseTarget.exercisePrice)}/share</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t border-blue-200 dark:border-blue-800 pt-2">
                      <span className="text-blue-800 dark:text-blue-200">Total Exercise Cost</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 dark:text-blue-300">Share Class</span>
                      <span>{exerciseTarget.underlyingShareClass}</span>
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      A new security record will be created on the cap table for {stakeholderName(exerciseTarget.stakeholderId)}.
                    </p>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    onClick={() => exerciseTarget && exerciseMutation.mutate({ id: exerciseTarget.id, sharesToExercise: sharesToEx })}
                    disabled={sharesToEx <= 0 || sharesToEx > exercisable || exerciseMutation.isPending}
                    data-testid="button-confirm-exercise"
                  >
                    {exerciseMutation.isPending ? "Exercising..." : `Exercise ${sharesToEx > 0 ? sharesToEx.toLocaleString() : 0} Options`}
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
