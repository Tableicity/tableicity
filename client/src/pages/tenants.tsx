import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTenant } from "@/lib/tenant-context";
import type { Tenant } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2, Plus, Globe, CheckCircle2, Clock, Users, Trash2,
  CalendarPlus, Shield, AlertTriangle, Search, MoreHorizontal,
  UserX, Mail, CalendarDays, Crown, Pencil, XCircle, BarChart3, FlaskConical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPlatformAdmin: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  memberships: { tenantId: string; tenantName?: string; tenantSlug?: string; role: string }[];
};

type AdminStats = {
  totalUsers: number;
  verifiedUsers: number;
  totalTenants: number;
  activeTenants: number;
  sandboxTenants: number;
  trialTenants: number;
  expiredTrials: number;
  totalSignups: number;
  plans: { trial: number; standard: number; pro: number; enterprise: number };
};

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  ownerEmail: z.string().email("Must be a valid email"),
  plan: z.enum(["standard", "enterprise"]),
});

function getTrialStatus(trialEndsAt: string | null) {
  if (!trialEndsAt) return null;
  const now = new Date();
  const end = new Date(trialEndsAt);
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", daysLeft, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" };
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, daysLeft, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" };
  return { label: `${daysLeft}d left`, daysLeft, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800" };
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const parts = d.split("T")[0].split("-");
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return d;
}

function OverviewTab({ stats }: { stats?: AdminStats }) {
  if (!stats) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-total-users">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">{stats.verifiedUsers} verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-total-tenants">{stats.totalTenants}</p>
            <p className="text-xs text-muted-foreground">{stats.activeTenants} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trials</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-trial-tenants">{stats.trialTenants}</p>
            <p className="text-xs text-muted-foreground">{stats.expiredTrials} expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signups</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-total-signups">{stats.totalSignups}</p>
            <p className="text-xs text-muted-foreground">leads captured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Trial", count: stats.plans.trial, color: "bg-amber-500" },
              { label: "Standard", count: stats.plans.standard, color: "bg-blue-500" },
              { label: "Pro", count: stats.plans.pro, color: "bg-indigo-500" },
              { label: "Enterprise", count: stats.plans.enterprise, color: "bg-emerald-500" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                  <span className="text-sm">{p.label}</span>
                </div>
                <span className="text-sm font-medium">{p.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sandbox Orgs</span>
              <span className="text-sm font-medium">{stats.sandboxTenants}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Orgs</span>
              <span className="text-sm font-medium">{stats.activeTenants}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expired Trials</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">{stats.expiredTrials}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unverified Users</span>
              <span className="text-sm font-medium">{stats.totalUsers - stats.verifiedUsers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [extendTrialTenantId, setExtendTrialTenantId] = useState<string | null>(null);
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [editTenantId, setEditTenantId] = useState<string | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const { toast } = useToast();
  const { currentTenant, setCurrentTenant, refreshTenants } = useTenant();

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const form = useForm<z.infer<typeof createTenantSchema>>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: "", slug: "", ownerEmail: "", plan: "standard" },
  });

  const editForm = useForm({
    defaultValues: { name: "", plan: "standard", status: "active", maxUsers: 10 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTenantSchema>) => {
      const res = await apiRequest("POST", "/api/tenants", data);
      return res.json();
    },
    onSuccess: async () => {
      setCreateOpen(false);
      cleanupBodyPointerEvents();
      await new Promise(r => setTimeout(r, 150));
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      await refreshTenants();
      form.reset();
      toast({ title: "Organization created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cleanupBodyPointerEvents = useCallback(() => {
    setTimeout(() => {
      document.body.style.removeProperty("pointer-events");
    }, 100);
  }, []);

  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await apiRequest("PATCH", `/api/tenants/${id}`, data);
      return res.json();
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/tenants/${id}`);
      return res.json();
    },
    onSuccess: async () => {
      setDeleteTenantId(null);
      cleanupBodyPointerEvents();
      await new Promise(r => setTimeout(r, 150));
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      await refreshTenants();
      toast({ title: "Organization deleted" });
    },
    onError: (error: Error) => {
      cleanupBodyPointerEvents();
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      setDeleteUserId(null);
      cleanupBodyPointerEvents();
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }, 150);
      toast({ title: "User deleted" });
    },
    onError: (error: Error) => {
      cleanupBodyPointerEvents();
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const nameToSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSwitch = (slug: string) => {
    setCurrentTenant(slug);
    queryClient.clear();
    window.location.href = "/";
  };

  const loadEditTenant = useCallback((tenantId: string | null) => {
    setEditTenantId(tenantId);
    if (tenantId) {
      const t = tenants.find(x => x.id === tenantId);
      if (t) {
        editForm.reset({ name: t.name, plan: t.plan, status: t.status, maxUsers: t.maxUsers ?? 10 });
      }
    }
  }, [tenants, editForm]);

  const extendTrialMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const tenant = tenants.find(t => t.id === tenantId);
      const baseDate = tenant?.trialEndsAt ? new Date(tenant.trialEndsAt) : new Date();
      const now = new Date();
      const startFrom = baseDate > now ? baseDate : now;
      startFrom.setDate(startFrom.getDate() + 14);
      const res = await apiRequest("PATCH", `/api/tenants/${tenantId}`, { trialEndsAt: startFrom.toISOString().split("T")[0] });
      return res.json();
    },
    onSuccess: () => {
      setExtendTrialTenantId(null);
      cleanupBodyPointerEvents();
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }, 150);
      toast({ title: "Trial extended", description: "Added 14 days" });
    },
    onError: (error: Error) => {
      cleanupBodyPointerEvents();
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const submitEditTenant = async () => {
    if (!editTenantId) return;
    const vals = editForm.getValues();

    try {
      await updateTenantMutation.mutateAsync({
        id: editTenantId,
        data: { name: vals.name, plan: vals.plan, status: vals.status, maxUsers: vals.maxUsers },
      });
      setEditTenantOpen(false);
      setEditTenantId(null);
      cleanupBodyPointerEvents();
      await new Promise(r => setTimeout(r, 150));
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Organization updated" });
    } catch (error: any) {
      setEditTenantOpen(false);
      setEditTenantId(null);
      cleanupBodyPointerEvents();
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (!tenantSearch) return true;
    const s = tenantSearch.toLowerCase();
    return t.name.toLowerCase().includes(s) || t.slug.toLowerCase().includes(s) || t.ownerEmail.toLowerCase().includes(s);
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return u.email.toLowerCase().includes(s) || u.firstName.toLowerCase().includes(s) || u.lastName.toLowerCase().includes(s);
  });

  if (tenantsLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const tenantToDelete = tenants.find((t) => t.id === deleteTenantId);
  const userToDelete = users.find((u) => u.id === deleteUserId);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Shield className="h-6 w-6 text-primary" />
            Platform Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organizations, users, and platform settings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="admin-tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tenants" data-testid="tab-tenants">
            <Building2 className="h-4 w-4 mr-1.5" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-1.5" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab stats={stats} />
        </TabsContent>

        <TabsContent value="tenants" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-tenants"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setEditTenantOpen(true); setEditTenantId(null); }}
                data-testid="button-edit-tenant"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Organization
              </Button>
              <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) cleanupBodyPointerEvents(); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-tenant">
                    <Plus className="h-4 w-4 mr-2" />
                    New Organization
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>Provision a new tenant with isolated database schema</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const currentSlug = form.getValues("slug");
                              if (!currentSlug || currentSlug === nameToSlug(field.value)) {
                                form.setValue("slug", nameToSlug(e.target.value));
                              }
                            }}
                            data-testid="input-tenant-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant Slug</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="acme-corp" data-testid="input-tenant-slug" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="ownerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-tenant-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="plan" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tenant-plan">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-tenant">
                      {createMutation.isPending ? "Provisioning..." : "Create Organization"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Organization</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trial</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="pr-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {tenantSearch ? "No organizations match your search" : "No organizations yet"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTenants.map((tenant) => {
                      const trial = getTrialStatus(tenant.trialEndsAt);
                      return (
                        <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.slug}`}>
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                                {tenant.isSandbox ? (
                                  <FlaskConical className="h-4 w-4 text-primary" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{tenant.name}</p>
                                <div className="flex items-center gap-1.5">
                                  <code className="text-[10px] bg-muted px-1 py-0.5 rounded text-muted-foreground">{tenant.slug}</code>
                                  {currentTenant === tenant.slug && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Current</Badge>
                                  )}
                                  {tenant.isSandbox && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-300 text-amber-600 dark:text-amber-400">Sandbox</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{tenant.ownerEmail}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              tenant.plan === "enterprise" ? "border-emerald-300 text-emerald-700 dark:text-emerald-400" :
                              tenant.plan === "pro" ? "border-indigo-300 text-indigo-700 dark:text-indigo-400" :
                              "border-slate-300 text-slate-600 dark:text-slate-400"
                            }>
                              {tenant.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              tenant.status === "active"
                                ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                            }>
                              {tenant.status === "active" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                              {tenant.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trial ? (
                              <Badge variant="outline" className={trial.color}>
                                {trial.daysLeft < 0 ? <AlertTriangle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                {trial.label}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(tenant.createdAt)}</TableCell>
                          <TableCell className="pr-5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-actions-tenant-${tenant.slug}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {currentTenant !== tenant.slug && (
                                  <DropdownMenuItem onClick={() => handleSwitch(tenant.slug)} data-testid={`button-switch-tenant-${tenant.slug}`}>
                                    <Globe className="h-4 w-4 mr-2" />
                                    Switch to this org
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onSelect={(e) => { e.preventDefault(); setTimeout(() => { cleanupBodyPointerEvents(); setExtendTrialTenantId(tenant.id); }, 150); }}
                                  data-testid={`button-extend-trial-${tenant.slug}`}
                                >
                                  <CalendarPlus className="h-4 w-4 mr-2" />
                                  Extend Trial
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400 focus:text-red-600"
                                  onSelect={(e) => { e.preventDefault(); setTimeout(() => { cleanupBodyPointerEvents(); setDeleteTenantId(tenant.id); }, 150); }}
                                  data-testid={`button-delete-tenant-${tenant.slug}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Organization
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <p className="text-sm text-muted-foreground">{users.length} total users</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organizations</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="pr-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <p className="text-sm text-muted-foreground">Loading users...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {userSearch ? "No users match your search" : "No users found"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium flex items-center gap-1.5">
                                {user.firstName} {user.lastName}
                                {user.isPlatformAdmin && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>Platform Admin</TooltipContent>
                                  </Tooltip>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </TableCell>
                        <TableCell>
                          {user.emailVerified ? (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                              <Mail className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.memberships.length === 0 ? (
                              <span className="text-xs text-muted-foreground">No orgs</span>
                            ) : (
                              user.memberships.slice(0, 3).map((m, i) => (
                                <Tooltip key={i}>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 cursor-default">
                                      {m.tenantSlug}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>{m.tenantName} ({m.role})</TooltipContent>
                                </Tooltip>
                              ))
                            )}
                            {user.memberships.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{user.memberships.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="pr-5 text-right">
                          {!user.isPlatformAdmin && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  onClick={() => setDeleteUserId(user.id)}
                                  data-testid={`button-delete-user-${user.id}`}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete User</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!extendTrialTenantId} onOpenChange={(open) => !open && setExtendTrialTenantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Extend Trial
            </AlertDialogTitle>
            <AlertDialogDescription>
              Extend the trial for <span className="font-medium text-foreground">{tenants.find(t => t.id === extendTrialTenantId)?.name}</span> by 14 days?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => extendTrialTenantId && extendTrialMutation.mutate(extendTrialTenantId)}
              data-testid="button-submit-extend-trial"
            >
              {extendTrialMutation.isPending ? "Extending..." : "Extend 14 Days"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editTenantOpen} onOpenChange={(open) => { if (!open) { setEditTenantOpen(false); setEditTenantId(null); cleanupBodyPointerEvents(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Select an organization and update its details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Organization</label>
              <Select value={editTenantId || ""} onValueChange={(v) => loadEditTenant(v)}>
                <SelectTrigger data-testid="select-edit-tenant-org">
                  <SelectValue placeholder="Select an organization..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span>{t.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">({t.ownerEmail})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editTenantId && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input
                    value={editForm.watch("name")}
                    onChange={(e) => editForm.setValue("name", e.target.value)}
                    data-testid="input-edit-tenant-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Plan</label>
                    <Select value={editForm.watch("plan")} onValueChange={(v) => editForm.setValue("plan", v)}>
                      <SelectTrigger data-testid="select-edit-tenant-plan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={editForm.watch("status")} onValueChange={(v) => editForm.setValue("status", v)}>
                      <SelectTrigger data-testid="select-edit-tenant-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Max Users</label>
                  <Input
                    type="number"
                    min={1}
                    value={editForm.watch("maxUsers")}
                    onChange={(e) => editForm.setValue("maxUsers", parseInt(e.target.value) || 10)}
                    data-testid="input-edit-tenant-max-users"
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTenantOpen(false)}>Cancel</Button>
              <Button onClick={submitEditTenant} disabled={!editTenantId || updateTenantMutation.isPending} data-testid="button-submit-edit-tenant">
                {updateTenantMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTenantId} onOpenChange={(open) => !open && setDeleteTenantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Organization
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{tenantToDelete?.name}</span> ({tenantToDelete?.slug}),
              including all its data, schemas, and member associations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTenantId && deleteTenantMutation.mutate(deleteTenantId)}
              data-testid="button-confirm-delete-tenant"
            >
              {deleteTenantMutation.isPending ? "Deleting..." : "Delete Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{userToDelete?.firstName} {userToDelete?.lastName}</span> ({userToDelete?.email}),
              remove all their organization memberships, and delete associated trial data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlatformDisclaimer />
    </div>
  );
}
