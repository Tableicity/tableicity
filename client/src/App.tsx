import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { TenantProvider, useTenant } from "@/lib/tenant-context";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, X, Info, FlaskConical } from "lucide-react";
import { useState, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import NotFound from "@/pages/not-found";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, error.stack, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
          <p className="text-lg font-medium text-destructive">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-md text-center">{this.state.error?.message}</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import Dashboard from "@/pages/dashboard";
import StakeholdersPage from "@/pages/stakeholders";
import ShareClassesPage from "@/pages/share-classes";
import SecuritiesPage from "@/pages/securities";
import SafesPage from "@/pages/safes";
import DataRoomPage from "@/pages/data-room";
import InvestorUpdatesPage from "@/pages/investor-updates";
import TenantsPage from "@/pages/tenants";
import MyPositionPage from "@/pages/my-position";
import AuditLogsPage from "@/pages/audit-logs";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import VerifyEmailPage from "@/pages/verify-email";
import LaunchPage from "@/pages/launch";
import LaunchThankYouPage from "@/pages/launch-thank-you";
import LaunchCreatePasswordPage from "@/pages/launch-create-password";
import LaunchCheckEmailPage from "@/pages/launch-check-email";
import LaunchVerifyPage from "@/pages/launch-verify";
import LaunchCreateOrgPage from "@/pages/launch-create-org";
import SafeCreatePage from "@/pages/safe-create";
import SafeTemplatePage from "@/pages/safe-template";
import TemplateLibraryPage from "@/pages/template-library";
import PlatformResourcesPage from "@/pages/platform-resources";
import EsopPoolsPage from "@/pages/equity-plans/pools";
import EsopPlansPage from "@/pages/equity-plans/plans";
import EsopGrantsPage from "@/pages/equity-plans/grants";
import EsopExercisingPage from "@/pages/equity-plans/exercising";
import WarrantsPage from "@/pages/equity-plans/warrants";
import PhantomSharesPage from "@/pages/equity-plans/phantom";
import SarsPage from "@/pages/equity-plans/sars";
import ProfilePage from "@/pages/profile";
import PrivacyVaultPage from "@/pages/privacy-vault";
import VerifyProofPage from "@/pages/verify-proof";
import AuditProofsPage from "@/pages/audit-proofs";
import PublicVerifyPage from "@/pages/public-verify";

function ShareholderHome() {
  return <Redirect to="/my-position" />;
}

function TrialBanner() {
  const { tenants, currentTenant } = useTenant();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tenant = tenants.find(t => t.slug === currentTenant);
  if (!tenant || !tenant.trialEndsAt) return null;

  const trialEnd = new Date(tenant.trialEndsAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (daysLeft <= 0) {
    return (
      <div className="bg-red-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2" data-testid="banner-trial-expired">
        <Clock className="h-4 w-4" />
        <span>Your trial has expired.</span>
        <a href="/launch/create-organization" className="underline font-medium">Create your organization</a>
        <button onClick={() => setDismissed(true)} className="ml-2">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white py-2 px-4 text-sm flex items-center justify-between gap-2" data-testid="banner-trial">
      <SidebarTrigger className="text-white hover:text-white/80 hover:bg-white/10 shrink-0" data-testid="button-sidebar-toggle-banner" />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left on your trial.</span>
        <a href="/launch/create-organization" className="underline font-medium">Create your organization</a>
      </div>
      <button onClick={() => setDismissed(true)}>
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function SandboxBanner() {
  const { tenants, currentTenant } = useTenant();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tenant = tenants.find(t => t.slug === currentTenant);
  if (!tenant || !tenant.isSandbox) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800 px-4 py-2.5 text-sm flex items-center justify-between gap-3" data-testid="banner-sandbox">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <FlaskConical className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <span className="font-medium text-blue-900 dark:text-blue-100">You're viewing a sandbox with Sample Data.</span>
          <span className="text-blue-700 dark:text-blue-300 ml-1">Explore all features risk-free. <a href="/launch/create-organization" className="underline font-medium hover:text-blue-900 dark:hover:text-blue-100" data-testid="link-create-org-banner">Create</a> your real organization when ready.</span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 shrink-0"
        data-testid="button-dismiss-sandbox-banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AppRoutes() {
  const { currentRole } = useTenant();
  const isShareholder = currentRole === "shareholder";

  return (
    <Switch>
      <Route path="/" component={isShareholder ? ShareholderHome : Dashboard} />
      <Route path="/my-position" component={MyPositionPage} />
      <Route path="/stakeholders" component={isShareholder ? ShareholderHome : StakeholdersPage} />
      <Route path="/share-classes" component={isShareholder ? ShareholderHome : ShareClassesPage} />
      <Route path="/securities" component={isShareholder ? ShareholderHome : SecuritiesPage} />
      <Route path="/safes" component={isShareholder ? ShareholderHome : SafesPage} />
      <Route path="/financing/safe-create" component={isShareholder ? ShareholderHome : SafeCreatePage} />
      <Route path="/financing/safe-template" component={isShareholder ? ShareholderHome : SafeTemplatePage} />
      <Route path="/financing/template-library" component={isShareholder ? ShareholderHome : TemplateLibraryPage} />
      <Route path="/equity-plans/pools" component={isShareholder ? ShareholderHome : EsopPoolsPage} />
      <Route path="/equity-plans/plans" component={isShareholder ? ShareholderHome : EsopPlansPage} />
      <Route path="/equity-plans/grants" component={isShareholder ? ShareholderHome : EsopGrantsPage} />
      <Route path="/equity-plans/exercising" component={isShareholder ? ShareholderHome : EsopExercisingPage} />
      <Route path="/equity-plans/warrants" component={isShareholder ? ShareholderHome : WarrantsPage} />
      <Route path="/equity-plans/phantom" component={isShareholder ? ShareholderHome : PhantomSharesPage} />
      <Route path="/equity-plans/sars" component={isShareholder ? ShareholderHome : SarsPage} />
      <Route path="/data-room" component={DataRoomPage} />
      <Route path="/updates" component={isShareholder ? ShareholderHome : InvestorUpdatesPage} />
      <Route path="/tenants" component={isShareholder ? ShareholderHome : TenantsPage} />
      <Route path="/platform-resources" component={isShareholder ? ShareholderHome : PlatformResourcesPage} />
      <Route path="/audit-logs" component={isShareholder ? ShareholderHome : AuditLogsPage} />
      <Route path="/privacy-vault" component={isShareholder ? ShareholderHome : PrivacyVaultPage} />
      <Route path="/verify-proof" component={isShareholder ? ShareholderHome : VerifyProofPage} />
      <Route path="/audit-proofs" component={isShareholder ? ShareholderHome : AuditProofsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function CompanyNameHeader() {
  const { tenants, currentTenant } = useTenant();
  const tenant = tenants.find(t => t.slug === currentTenant);
  return (
    <h1 className="text-sm font-semibold truncate" data-testid="text-company-name">
      {tenant?.name || "Tableicity"}
    </h1>
  );
}

function ProtectedRouter() {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.requiresVerification) {
    return <VerifyEmailPage />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <TenantProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex flex-col h-screen w-full">
          <SandboxBanner />
          <TrialBanner />
          <div className="flex flex-1 min-h-0">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center justify-between gap-2 px-4 py-2 border-b sticky top-0 z-50 bg-background overflow-visible">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <span className="text-sm text-muted-foreground hidden sm:block" data-testid="text-user-name">
                    {user.firstName} {user.lastName}
                  </span>
                  <TenantSwitcher />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </main>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Switch>
              <Route path="/launch" component={LaunchPage} />
              <Route path="/launch/thank-you" component={LaunchThankYouPage} />
              <Route path="/launch/create-password" component={LaunchCreatePasswordPage} />
              <Route path="/launch/check-email" component={LaunchCheckEmailPage} />
              <Route path="/launch/verify" component={LaunchVerifyPage} />
              <Route path="/launch/create-organization" component={LaunchCreateOrgPage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage} />
              <Route path="/verify-email" component={VerifyEmailPage} />
              <Route path="/public/verify/:proofId" component={PublicVerifyPage} />
              <Route>
                <ProtectedRouter />
              </Route>
            </Switch>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
