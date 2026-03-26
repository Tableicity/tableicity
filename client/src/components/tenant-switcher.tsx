import { useState, useEffect } from "react";
import { useTenant } from "@/lib/tenant-context";
import { useAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import { Building2, ChevronDown, Plus, Check, FlaskConical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { OrgLimitModal } from "./org-limit-modal";

export function TenantSwitcher() {
  const { currentTenant, tenants, setCurrentTenant, isLoading, refreshTenants } = useTenant();
  const { user } = useAuth();
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const nonSandboxOrgsExist = tenants.some(t => !t.isSandbox);
  const guideKey = user ? `tableicty_guide_dismissed_${user.id}` : "tableicty_guide_dismissed";

  useEffect(() => {
    if (isLoading || !user) return;
    const dismissed = localStorage.getItem(guideKey);
    if (!dismissed && !nonSandboxOrgsExist && tenants.length > 0) {
      setShowGuide(true);
    } else {
      setShowGuide(false);
    }
  }, [isLoading, nonSandboxOrgsExist, tenants.length, user, guideKey]);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem(guideKey, "true");
    window.dispatchEvent(new CustomEvent("tableicty-show-theme-guide"));
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled data-testid="button-tenant-switcher">
        <Building2 className="h-3.5 w-3.5 mr-1.5" />
        Loading...
      </Button>
    );
  }

  const activeTenant = tenants.find((t) => t.slug === currentTenant);
  const nonSandboxOrgs = tenants.filter(t => !t.isSandbox);

  const orgLimits: Record<string, number> = {
    trial: 1,
    standard: 1,
    pro: 3,
    enterprise: 999,
  };
  const userPlan = nonSandboxOrgs.length > 0 ? nonSandboxOrgs[0].plan : "trial";
  const orgLimit = orgLimits[userPlan] || 1;

  const handleSwitch = (slug: string) => {
    setCurrentTenant(slug);
    queryClient.clear();
    window.location.reload();
  };

  const handleCreateOrg = () => {
    if (nonSandboxOrgs.length >= orgLimit) {
      setShowLimitModal(true);
    } else {
      setShowCreateOrgDialog(true);
    }
  };

  const handleOrgCreated = (tenantSlug: string) => {
    setShowCreateOrgDialog(false);
    dismissGuide();
    setCurrentTenant(tenantSlug);
    queryClient.clear();
    refreshTenants();
    window.location.reload();
  };

  const handleGuideNext = () => {
    dismissGuide();
    handleCreateOrg();
  };

  return (
    <>
      <div className="relative" style={{ overflow: "visible" }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-tenant-switcher">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              <span className="max-w-[120px] truncate">{activeTenant?.name || currentTenant || "Select Tenant"}</span>
              {activeTenant?.isSandbox && (
                <FlaskConical className="h-3 w-3 ml-1 text-blue-500" />
              )}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => handleSwitch(tenant.slug)}
                className={currentTenant === tenant.slug ? "bg-accent" : ""}
                data-testid={`menu-item-tenant-${tenant.slug}`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {currentTenant === tenant.slug && (
                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="truncate block text-sm">{tenant.name}</span>
                      {tenant.isSandbox && (
                        <span className="text-[10px] text-muted-foreground">Sample data for testing</span>
                      )}
                    </div>
                  </div>
                  {tenant.isSandbox ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 border-blue-300 text-blue-600">
                      Sandbox
                    </Badge>
                  ) : (
                    <Badge variant={tenant.plan === "enterprise" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 shrink-0">
                      {tenant.plan}
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {tenants.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={handleCreateOrg}
              data-testid="menu-item-create-organization"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span className="text-blue-600 font-medium">Create Organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showGuide && (
          <div
            className="absolute top-full right-0 mt-2 w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
            data-testid="card-guide-create-org"
          >
            <div className="absolute -top-2 right-6 w-4 h-4 rotate-45 bg-primary" />
            <div className="relative rounded-lg shadow-lg border bg-card overflow-hidden">
              <div className="h-1 bg-primary" />
              <div className="p-4">
                <button
                  onClick={dismissGuide}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-dismiss-guide"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="text-sm leading-relaxed pr-4">
                  Click here to Create your Own Cap Table. You can still access the Test Company Archer Technologies at any time.
                </p>
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    onClick={handleGuideNext}
                    data-testid="button-guide-next"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateOrganizationDialog
        open={showCreateOrgDialog}
        onOpenChange={setShowCreateOrgDialog}
        onCreated={handleOrgCreated}
      />

      <OrgLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
      />
    </>
  );
}
