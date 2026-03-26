import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Mail, Send, Edit3, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/format";
import type { InvestorUpdate, Stakeholder } from "@shared/schema";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvestorUpdateSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = insertInvestorUpdateSchema.extend({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export default function InvestorUpdatesPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: updates = [], isLoading } = useQuery<InvestorUpdate[]>({ queryKey: ["/api/updates"] });
  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({ queryKey: ["/api/stakeholders"] });

  const investorCount = stakeholders.filter((s) => s.type === "investor").length;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "default",
      title: "",
      content: "",
      status: "draft",
      createdDate: new Date().toISOString().split("T")[0],
      recipientCount: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/updates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/updates"] });
      setOpen(false);
      form.reset();
      toast({ title: "Update created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/updates/${id}`, {
        status: "sent",
        sentDate: new Date().toISOString().split("T")[0],
        recipientCount: investorCount,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/updates"] });
      toast({ title: "Update sent to investors" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  const drafts = updates.filter((u) => u.status === "draft");
  const sent = updates.filter((u) => u.status === "sent");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-updates-title">Investor Updates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Keep your investors informed &middot; {investorCount} investors
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-update">
              <Plus className="h-4 w-4 mr-1" />
              Create Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Investor Update</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Q1 2025 Update" data-testid="input-update-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[200px]"
                          placeholder="Dear investors,&#10;&#10;Here's our quarterly update..."
                          data-testid="input-update-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-update">
                  {createMutation.isPending ? "Creating..." : "Create Update"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {drafts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Drafts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.map((update) => (
              <Card key={update.id} data-testid={`card-update-${update.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold truncate">{update.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(update.createdDate)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendMutation.mutate(update.id)}
                    disabled={sendMutation.isPending}
                    data-testid={`button-send-update-${update.id}`}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
                    {update.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">
          {sent.length > 0 ? "Sent Updates" : "Updates"}
        </h2>
        {sent.length === 0 && drafts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                No investor updates yet. Create your first update to keep investors informed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sent.map((update) => (
              <Card key={update.id} data-testid={`card-update-${update.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold truncate">{update.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2">
                      <Send className="h-3 w-3 mr-1" />
                      Sent
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(update.sentDate)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {update.recipientCount} recipients
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
                    {update.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <PlatformDisclaimer />
    </div>
  );
}
