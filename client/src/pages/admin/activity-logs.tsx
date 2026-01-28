import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ActivityLog, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { Shield, User, FileEdit, Trash2, Plus } from "lucide-react";

export default function AdminActivityLogs() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
  });

  // Costruisci URL con query parameters
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
      case "CREATE": return <Plus className="w-4 h-4" />;
      case "UPDATE": return <FileEdit className="w-4 h-4" />;
      case "DELETE": return <Trash2 className="w-4 h-4" />;
      case "LOGIN": return <User className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case "CREATE": return "default";
      case "UPDATE": return "secondary";
      case "DELETE": return "destructive";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <Badge variant="outline" data-testid="text-log-count">
          {logs?.length || 0} logs
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-action-filter">
                <SelectValue placeholder="Azione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="LOGIN">LOGIN</SelectItem>
                <SelectItem value="LOGOUT">LOGOUT</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Entity Type..."
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-[200px]"
              data-testid="input-entity-type-filter"
            />

            <Select value={userIdFilter} onValueChange={setUserIdFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-user-filter">
                <SelectValue placeholder="Utente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
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
              <label className="text-sm font-medium">Data Inizio</label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-[200px]"
                data-testid="input-start-date-filter"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Data Fine</label>
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
          <CardTitle>Registro Attività</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Ora</TableHead>
                  <TableHead>Azione</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Dettagli</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-date-${log.id}`}>
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action)} className="gap-1" data-testid={`badge-action-${log.id}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-entity-type-${log.id}`}>
                        {log.entityType || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-entity-id-${log.id}`}>
                        {log.entityId ? log.entityId.substring(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-user-id-${log.id}`}>
                        {log.userId.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-ip-${log.id}`}>
                        {log.ipAddress || "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground" data-testid={`text-changes-${log.id}`}>
                        {log.changes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nessun log trovato
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
