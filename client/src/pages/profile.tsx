import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Lock, CreditCard, Check, Crown, Zap, Building2, ExternalLink } from "lucide-react";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  highlighted: boolean;
  stripePriceId?: string;
}

function AccountSettingsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/change-password", { currentPassword, newPassword });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <Card data-testid="card-account-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Settings
        </CardTitle>
        <CardDescription>Manage your login credentials and profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">First Name</label>
            <p className="text-sm font-semibold mt-1" data-testid="text-profile-first-name">{user?.firstName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Last Name</label>
            <p className="text-sm font-semibold mt-1" data-testid="text-profile-last-name">{user?.lastName}</p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-sm font-semibold mt-1" data-testid="text-profile-email">{user?.email}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4" />
            Change Password
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
            <div>
              <label className="text-sm text-muted-foreground">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                data-testid="input-current-password"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
            </div>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function PricingTierCard({ tier, currentPlan, onSelect }: { tier: PricingTier; currentPlan: string | null; onSelect: (tier: PricingTier) => void }) {
  const isCurrent = currentPlan === tier.id;

  return (
    <Card
      className={`relative flex flex-col ${tier.highlighted ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
      data-testid={`card-tier-${tier.id}`}
    >
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">{tier.name}</CardTitle>
        <CardDescription className="text-xs">{tier.description}</CardDescription>
        <div className="mt-3">
          <span className="text-3xl font-bold">${tier.monthlyPrice}</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <ul className="space-y-2">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {isCurrent ? (
          <Button variant="outline" disabled className="w-full" data-testid={`button-current-${tier.id}`}>
            Current Plan
          </Button>
        ) : (
          <Button
            variant={tier.highlighted ? "default" : "outline"}
            className="w-full"
            onClick={() => onSelect(tier)}
            data-testid={`button-select-${tier.id}`}
          >
            {currentPlan ? "Upgrade" : "Get Started"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionCard() {
  const { toast } = useToast();

  const { data: pricing } = useQuery<{ tiers: PricingTier[] }>({
    queryKey: ["/api/stripe/pricing"],
  });

  const { data: subscriptionData, isLoading: subLoading } = useQuery<{ subscription: any }>({
    queryKey: ["/api/stripe/subscription"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/create-checkout", { priceId });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/create-portal");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const subscription = subscriptionData?.subscription;
  const tiers = pricing?.tiers || [];

  const currentPlan = subscription?.status === "active"
    ? (subscription?.items?.data?.[0]?.price?.metadata?.tier || null)
    : null;

  const handleSelectTier = (tier: PricingTier) => {
    if (tier.stripePriceId) {
      checkoutMutation.mutate(tier.stripePriceId);
    } else {
      toast({
        title: "Coming Soon",
        description: `The ${tier.name} plan will be available for purchase once Stripe products are configured.`,
      });
    }
  };

  return (
    <Card data-testid="card-subscription">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Choose the plan that fits your needs</CardDescription>
          </div>
          {subscription && (
            <div className="flex items-center gap-2">
              <Badge
                variant={subscription.status === "active" ? "default" : "secondary"}
                data-testid="badge-subscription-status"
              >
                {subscription.status === "active" ? "Active" : subscription.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-billing"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                {portalMutation.isPending ? "Opening..." : "Manage Billing"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {subLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading subscription...</div>
        ) : (
          <>
            {subscription && (
              <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold" data-testid="text-current-plan">
                      {subscription.items?.data?.[0]?.price?.product?.name || "Active Subscription"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Next billing: {subscription.current_period_end
                        ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier) => (
                <PricingTierCard
                  key={tier.id}
                  tier={tier}
                  currentPlan={currentPlan}
                  onSelect={handleSelectTier}
                />
              ))}
            </div>

            {!subscription && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                All plans include a 14-day free trial. Cancel anytime.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BillingHistoryCard() {
  const { toast } = useToast();

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/create-portal");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const { data: subscriptionData } = useQuery<{ subscription: any }>({
    queryKey: ["/api/stripe/subscription"],
  });

  if (!subscriptionData?.subscription) {
    return null;
  }

  return (
    <Card data-testid="card-billing-history">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>View invoices and payment history</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            View and download your invoices, update payment methods, and manage your billing details through the Stripe Customer Portal.
          </p>
          <Button
            variant="outline"
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            data-testid="button-view-billing-history"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {portalMutation.isPending ? "Opening..." : "Open Billing Portal"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account and subscription</p>
        </div>
      </div>

      <AccountSettingsCard />
      <SubscriptionCard />
      <BillingHistoryCard />
      <PlatformDisclaimer />
    </div>
  );
}
