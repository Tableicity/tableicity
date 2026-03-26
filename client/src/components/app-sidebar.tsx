import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useTenant } from "@/lib/tenant-context";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  Layers,
  Shield,
  FileText,
  FolderLock,
  Mail,
  Building2,
  Settings,
  Briefcase,
  ScrollText,
  LogOut,
  FilePlus2,
  Library,
  Zap,
  ChevronDown,
  ChevronRight,
  Lock,
  Scale,
  ClipboardList,
  FileSpreadsheet,
  Calculator,
  UserCircle,
  ShieldCheck,
  CheckCircle,
  FileSearch,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

function ProFeatureItem({ icon: Icon, label, testId }: { icon: LucideIcon; label: string; testId: string }) {
  return (
    <SidebarMenuItem>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-default rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              data-testid={testId}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="text-xs font-medium bg-amber-500 text-white border-amber-500"
          >
            Pro Feature — Available in Pro pricing tier
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </SidebarMenuItem>
  );
}

const adminItems = [
  { title: "Cap Table", url: "/", icon: LayoutDashboard },
  { title: "Share Classes", url: "/share-classes", icon: Layers },
  { title: "Stakeholders", url: "/stakeholders", icon: Users },
  { title: "Securities", url: "/securities", icon: Shield },
];

const financeItems = [
  { title: "SAFE Agreements", url: "/safes", icon: FileText },
  { title: "SAFE Create", url: "/financing/safe-create", icon: FilePlus2 },
];

const communicationItems = [
  { title: "Data Store", url: "/data-room", icon: FolderLock },
  { title: "Template Library", url: "/financing/template-library", icon: Library },
  { title: "Investor Updates", url: "/updates", icon: Mail },
];


const platformItems = [
  { title: "Admin", url: "/tenants", icon: Shield },
  { title: "Resources", url: "/platform-resources", icon: FileText },
];

const shareholderItems = [
  { title: "My Position", url: "/my-position", icon: Briefcase },
  { title: "Documents", url: "/data-room", icon: FolderLock },
];

const equityPlanItems = [
  { title: "Pools", url: "/equity-plans/pools" },
  { title: "Plans", url: "/equity-plans/plans" },
  { title: "Grants", url: "/equity-plans/grants" },
  { title: "Exercising", url: "/equity-plans/exercising" },
  { title: "Warrants", url: "/equity-plans/warrants" },
  { title: "Phantom Shares", url: "/equity-plans/phantom" },
  { title: "SARs", url: "/equity-plans/sars" },
];

const zeroProofItems = [
  { title: "Privacy Vault", url: "/privacy-vault", icon: ShieldCheck },
  { title: "Verify", url: "/verify-proof", icon: CheckCircle },
  { title: "Audit Proofs", url: "/audit-proofs", icon: FileSearch },
];

function MenuGroup({ label, items, location }: { label: string; items: typeof adminItems; location: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                data-active={location === item.url || (item.url !== "/" && location.startsWith(item.url))}
                className="data-[active=true]:bg-sidebar-accent"
              >
                <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function EquityPlansGroup({ location }: { location: string }) {
  const isActive = location.startsWith("/equity-plans");
  const [open, setOpen] = useState(isActive);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recruit and Retain Employees</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <Collapsible open={open} onOpenChange={setOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  data-active={isActive}
                  className="data-[active=true]:bg-sidebar-accent w-full"
                  data-testid="link-equity-plans"
                >
                  <Zap className="h-4 w-4" />
                  <span className="flex-1">Equity and Grants</span>
                  {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {equityPlanItems.map((item) => (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton
                        asChild
                        data-active={location === item.url || location.startsWith(item.url)}
                        className="data-[active=true]:text-primary data-[active=true]:font-medium"
                      >
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                          {item.title}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const noirEnabled = import.meta.env.VITE_NOIR_ENABLED === 'true';

function ZeroProofsGroup({ location }: { location: string }) {
  const isActive = location.startsWith("/privacy-vault") || location.startsWith("/verify-proof") || location.startsWith("/audit-proofs");
  const [open, setOpen] = useState(isActive);

  if (!noirEnabled) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Zero Proofs</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <Collapsible open={open} onOpenChange={setOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  data-active={isActive}
                  className="data-[active=true]:bg-sidebar-accent w-full"
                  data-testid="link-zero-proofs"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="flex-1">Zero Proofs</span>
                  {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {zeroProofItems.map((item) => (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton
                        asChild
                        data-active={location === item.url || location.startsWith(item.url)}
                        className="data-[active=true]:text-primary data-[active=true]:font-medium"
                      >
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                          <item.icon className="h-3.5 w-3.5 mr-1" />
                          {item.title}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { currentRole } = useTenant();
  const { user, logout } = useAuth();

  const isShareholder = currentRole === "shareholder";
  const isPlatformAdmin = user?.isPlatformAdmin === true;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href={isShareholder ? "/my-position" : "/"}>
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Tableicity</p>
              <p className="text-xs text-muted-foreground">Equity Management</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {isShareholder ? (
          <MenuGroup label="My Account" items={shareholderItems} location={location} />
        ) : (
          <>
            <MenuGroup label="Overview" items={adminItems} location={location} />
            <MenuGroup label="Financing" items={financeItems} location={location} />
            <EquityPlansGroup location={location} />
            <MenuGroup label="Communication" items={communicationItems} location={location} />
            <SidebarGroup>
              <SidebarGroupLabel>Security</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/audit-logs"}>
                      <Link href="/audit-logs" data-testid="link-activity-log">
                        <ScrollText className="h-4 w-4" />
                        <span>Activity Log</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <ProFeatureItem icon={Lock} label="Data Encryption" testId="link-data-encryption" />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <ZeroProofsGroup location={location} />
            <SidebarGroup>
              <SidebarGroupLabel>Compliance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <ProFeatureItem icon={ClipboardList} label="401A Validations" testId="link-401a-validations" />
                  <ProFeatureItem icon={FileSpreadsheet} label="Form 3921" testId="link-form-3921" />
                  <ProFeatureItem icon={Scale} label="Rule 701" testId="link-rule-701" />
                  <ProFeatureItem icon={Calculator} label="ASC 718" testId="link-asc-718" />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {isPlatformAdmin && (
              <MenuGroup label="Platform" items={platformItems} location={location} />
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              data-active={location === "/profile"}
              className="data-[active=true]:bg-sidebar-accent"
            >
              <Link href="/profile" data-testid="link-profile">
                <UserCircle className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await logout();
                window.location.href = "/login";
              }}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {user && (
          <div className="px-2 pt-1">
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">{user.email}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
