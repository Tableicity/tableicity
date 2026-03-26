import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
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
import { Plus, Search, Users, Mail, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials, formatShares, getAvatarColor } from "@/lib/format";
import type { Stakeholder, Security } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStakeholderSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = insertStakeholderSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

const typeColors: Record<string, string> = {
  founder: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
  investor: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  employee: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  advisor: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  board_member: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800",
};

function InlineLabel({ stakeholderId, displayName, onSave, privacyEnabled }: {
  stakeholderId: string;
  displayName: string;
  onSave: (params: { stakeholderId: string; label: string }) => void;
  privacyEnabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setValue(displayName);
  }, [displayName]);

  if (!privacyEnabled) {
    return <span className="font-medium text-sm">{displayName}</span>;
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="font-mono text-sm bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5 text-emerald-500 dark:text-emerald-400 outline-none focus:border-emerald-500 w-32"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value.trim() && value !== displayName) {
            onSave({ stakeholderId, label: value.trim() });
          }
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setValue(displayName);
            setEditing(false);
          }
        }}
        data-testid={`input-privacy-label-${stakeholderId}`}
      />
    );
  }

  return (
    <span
      className="font-medium text-sm font-mono text-emerald-500 dark:text-emerald-400 cursor-pointer hover:underline"
      onClick={() => setEditing(true)}
      title="Click to edit label"
      data-testid={`label-privacy-name-${stakeholderId}`}
    >
      {displayName}
    </span>
  );
}

export default function StakeholdersPage() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();
  const privacy = usePrivacyMode();

  const { data: stakeholders = [], isLoading } = useQuery<Stakeholder[]>({
    queryKey: ["/api/stakeholders"],
  });
  const { data: securities = [] } = useQuery<Security[]>({ queryKey: ["/api/securities"] });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "default",
      name: "",
      email: "",
      type: "investor",
      title: "",
      address: "",
      avatarInitials: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/stakeholders", {
        ...data,
        avatarInitials: getInitials(data.name),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      setOpen(false);
      form.reset();
      toast({ title: "Stakeholder added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<z.infer<typeof formSchema>>) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/stakeholders/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      setEditOpen(false);
      setEditingStakeholder(null);
      toast({ title: "Stakeholder updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/stakeholders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      toast({ title: "Stakeholder removed" });
    },
  });

  const stakeholderShares = new Map<string, number>();
  for (const sec of securities.filter((s) => s.status === "active")) {
    const current = stakeholderShares.get(sec.stakeholderId) || 0;
    stakeholderShares.set(sec.stakeholderId, current + sec.shares);
  }

  const filtered = stakeholders.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || s.type === filterType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 max-w-sm" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-stakeholders-title">Stakeholders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage founders, investors, employees, and advisors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyToggle enabled={privacy.enabled} onToggle={privacy.toggle} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-stakeholder">
                <Plus className="h-4 w-4 mr-1" />
                Add Stakeholder
              </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stakeholder</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                className="space-y-4"
                autoComplete="off"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" autoComplete="off" data-testid="input-stakeholder-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@example.com" data-testid="input-stakeholder-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-stakeholder-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="founder">Founder</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="advisor">Advisor</SelectItem>
                          <SelectItem value="board_member">Board Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="CEO, CTO, etc." data-testid="input-stakeholder-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="123 Main St, City, State ZIP" data-testid="input-stakeholder-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-stakeholder">
                  {createMutation.isPending ? "Adding..." : "Add Stakeholder"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stakeholders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-stakeholders"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="founder">Founders</SelectItem>
            <SelectItem value="investor">Investors</SelectItem>
            <SelectItem value="employee">Employees</SelectItem>
            <SelectItem value="advisor">Advisors</SelectItem>
            <SelectItem value="board_member">Board Members</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {search || filterType !== "all"
                        ? "No stakeholders match your filters"
                        : "No stakeholders yet. Add your first stakeholder to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((stakeholder) => (
                  <TableRow key={stakeholder.id} data-testid={`row-stakeholder-${stakeholder.id}`}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs font-medium text-white ${privacy.enabled ? "font-mono" : ""}`} style={{ backgroundColor: privacy.enabled ? "#374151" : getAvatarColor(stakeholder.name) }}>
                            {privacy.enabled ? "#" : (stakeholder.avatarInitials || getInitials(stakeholder.name))}
                          </AvatarFallback>
                        </Avatar>
                        <InlineLabel
                          stakeholderId={stakeholder.id}
                          displayName={privacy.getDisplayName(stakeholder.id, stakeholder.name)}
                          onSave={privacy.updateLabel}
                          privacyEnabled={privacy.enabled}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${typeColors[stakeholder.type] || ""}`}>
                        {stakeholder.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {stakeholder.title || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {privacy.enabled ? "••••@••••" : stakeholder.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatShares(stakeholderShares.get(stakeholder.id) || 0)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingStakeholder(stakeholder);
                            setEditOpen(true);
                          }}
                          data-testid={`button-edit-stakeholder-${stakeholder.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(stakeholder.id)}
                          className="text-destructive"
                          data-testid={`button-delete-stakeholder-${stakeholder.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if (!val) setEditingStakeholder(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stakeholder</DialogTitle>
          </DialogHeader>
          {editingStakeholder && (
            <EditStakeholderForm
              stakeholder={editingStakeholder}
              onSubmit={(data) => updateMutation.mutate({ id: editingStakeholder.id, ...data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
      <PlatformDisclaimer />
    </div>
  );
}

function EditStakeholderForm({
  stakeholder,
  onSubmit,
  isPending,
}: {
  stakeholder: Stakeholder;
  onSubmit: (data: Partial<z.infer<typeof formSchema>>) => void;
  isPending: boolean;
}) {
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: stakeholder.companyId,
      name: stakeholder.name,
      email: stakeholder.email,
      type: stakeholder.type,
      title: stakeholder.title || "",
      address: stakeholder.address || "",
      avatarInitials: stakeholder.avatarInitials || "",
    },
  });

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit((data) => onSubmit({ ...data, avatarInitials: getInitials(data.name) }))} className="space-y-4" autoComplete="off">
        <FormField
          control={editForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" data-testid="input-edit-stakeholder-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" data-testid="input-edit-stakeholder-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-stakeholder-type">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="advisor">Advisor</SelectItem>
                  <SelectItem value="board_member">Board Member</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} data-testid="input-edit-stakeholder-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder="123 Main St, City, State ZIP" data-testid="input-edit-stakeholder-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-edit-stakeholder">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
