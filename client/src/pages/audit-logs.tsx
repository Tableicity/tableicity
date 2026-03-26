import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, User, FileText } from "lucide-react";
import { PlatformDisclaimer } from "@/components/platform-disclaimer";

interface AuditLogEntry {
  id: string;
  tenantSlug: string | null;
  userId: string;
  userEmail: string;
  userRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

function getActionColor(action: string) {
  switch (action) {
    case "create": return "default";
    case "update": return "secondary";
    case "delete": return "destructive";
    case "login":
    case "login_google":
    case "register": return "outline";
    default: return "secondary";
  }
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEntityType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ["/api/audit-logs"],
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-audit-title">My Activity Log</h1>
          <p className="text-sm text-muted-foreground">Immutable record of your actions in this workspace</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading audit logs...</div>
      ) : !logs || logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No activity recorded yet. Actions like creating stakeholders, issuing securities, and managing documents will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} data-testid={`audit-log-${log.id}`}>
              <CardContent className="flex items-start gap-4 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getActionColor(log.action) as any}>
                      {log.action}
                    </Badge>
                    <span className="text-sm font-medium">{formatEntityType(log.entityType)}</span>
                    {log.entityId && (
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                        {log.entityId.slice(0, 8)}...
                      </span>
                    )}
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {Object.entries(log.details).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="font-medium">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.userEmail}
                    </span>
                    {log.userRole && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {log.userRole}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PlatformDisclaimer />
    </div>
  );
}
