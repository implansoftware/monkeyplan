import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ActivityLog, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import { Shield, User, FileEdit, Trash2, Plus, Globe, ArrowRightLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const entityTypeLabels: Record<string, string> = {
  repairs: "Riparazioni",
  customers: "Clienti",
  users: "Utenti",
  invoices: "Fatture",
  warranties: "Garanzie",
  products: "Prodotti",
  warehouses: "Magazzini",
  chat: "Chat AI",
  quotes: "Preventivi",
  suppliers: "Fornitori",
  orders: "Ordini",
  tickets: "Ticket",
  delivery: "Consegne",
  b2b_orders: "Ordini B2B",
  service_orders: "Ordini Interventi",
  transfer_requests: "Trasferimenti",
  stock: "Movimenti Stock",
};

const actionLabels: Record<string, string> = {
  CREATE: "Creazione",
  UPDATE: "Modifica",
  DELETE: "Eliminazione",
  LOGIN: "Accesso",
  LOGOUT: "Uscita",
};

function formatDetails(changes: string | null): string {
  if (!changes) return "-";
  try {
    const parsed = JSON.parse(changes);
    const parts: string[] = [];
    if (parsed.method && parsed.path) {
      const method = parsed.method;
      const path = parsed.path as string;
      const segments = path.split("/").filter(Boolean);
      const lastMeaningful = segments.filter(s => !s.match(/^[a-f0-9-]{8,}$/)).pop() || path;
      parts.push(`${method} → ${lastMeaningful}`);
    }
    if (parsed.statusCode) {
      parts.push(`Status: ${parsed.statusCode}`);
    }
    if (parsed.reason) {
      parts.push(parsed.reason);
    }
    if (parsed.field) {
      parts.push(`Campo: ${parsed.field}`);
    }
    if (parts.length > 0) return parts.join(" · ");
    const keys = Object.keys(parsed);
    if (keys.length <= 3) {
      return keys.map(k => `${k}: ${typeof parsed[k] === 'string' ? parsed[k] : JSON.stringify(parsed[k])}`).join(" · ");
    }
    return `${keys.length} campi modificati`;
  } catch {
    if (changes.length > 80) return changes.substring(0, 80) + "…";
    return changes;
  }
}

export default function AdminActivityLogs() {
  const { t } = useTranslation();
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
  });

  const usersMap = users?.reduce((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {} as Record<string, UserType>) || {};

  const buildLogsUrl = () => {
    const params = new URLSearchParams();
    if (actionFilter && actionFilter !== "all") params.append("action", actionFilter);
    if (entityTypeFilter) params.append("entityType", entityTypeFilter);
    if (userIdFilter && userIdFilter !== "all") params.append("userId", userIdFilter);
    if (startDateFilter) params.append("startDate", startDateFilter);
    if (endDateFilter) params.append("endDate", endDateFilter);
    const queryString = params.toString();
    return queryString ? `/api/admin/activity-logs?${queryString}` : "/api/admin/activity-logs";
  };

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: [buildLogsUrl()],
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <Plus className="w-3.5 h-3.5" />;
      case "UPDATE": return <FileEdit className="w-3.5 h-3.5" />;
      case "DELETE": return <Trash2 className="w-3.5 h-3.5" />;
      case "LOGIN": return <User className="w-3.5 h-3.5" />;
      case "LOGOUT": return <ArrowRightLeft className="w-3.5 h-3.5" />;
      default: return <Shield className="w-3.5 h-3.5" />;
    }
  };

  const getActionColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case "CREATE": return "default";
      case "UPDATE": return "secondary";
      case "DELETE": return "destructive";
      case "LOGIN": return "outline";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">{t("common.activityLog", "Registro Attività")}</h1>
        <Badge variant="outline" data-testid="text-log-count">
          {logs?.length || 0} {t("common.entries", "voci")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.filters", "Filtri")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-action-filter">
                <SelectValue placeholder={t("common.action", "Azione")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", "Tutte")}</SelectItem>
                <SelectItem value="CREATE">{actionLabels.CREATE}</SelectItem>
                <SelectItem value="UPDATE">{actionLabels.UPDATE}</SelectItem>
                <SelectItem value="DELETE">{actionLabels.DELETE}</SelectItem>
                <SelectItem value="LOGIN">{actionLabels.LOGIN}</SelectItem>
                <SelectItem value="LOGOUT">{actionLabels.LOGOUT}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={t("common.entityType", "Tipo entità...")}
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-[200px]"
              data-testid="input-entity-type-filter"
            />

            <Select value={userIdFilter} onValueChange={setUserIdFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-user-filter">
                <SelectValue placeholder={t("common.user", "Utente")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", "Tutte")}</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("common.startDate", "Data Inizio")}</label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-[200px]"
                data-testid="input-start-date-filter"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("common.endDate", "Data Fine")}</label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-[200px]"
                data-testid="input-end-date-filter"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.activityLog", "Registro Attività")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.dateTime", "Data/Ora")}</TableHead>
                  <TableHead>{t("common.action", "Azione")}</TableHead>
                  <TableHead>{t("common.entityType", "Tipo")}</TableHead>
                  <TableHead>{t("common.user", "Utente")}</TableHead>
                  <TableHead>{t("common.ipAddress", "Indirizzo IP")}</TableHead>
                  <TableHead>{t("common.details", "Dettagli")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => {
                    const logUser = usersMap[log.userId];
                    return (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell className="text-sm whitespace-nowrap" data-testid={`text-date-${log.id}`}>
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: itLocale })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionColor(log.action)} className="gap-1" data-testid={`badge-action-${log.id}`}>
                            {getActionIcon(log.action)}
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-entity-type-${log.id}`}>
                          <span className="text-sm">
                            {entityTypeLabels[log.entityType || ""] || log.entityType || "-"}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-user-${log.id}`}>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm">{logUser?.username || log.userId.substring(0, 8) + "…"}</span>
                          </div>
                          {logUser?.role && (
                            <span className="text-xs text-muted-foreground">{logUser.role}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`text-ip-${log.id}`}>
                          {log.ipAddress || "-"}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground" data-testid={`text-changes-${log.id}`}>
                          {formatDetails(log.changes)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t("common.noResults", "Nessun risultato trovato")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
