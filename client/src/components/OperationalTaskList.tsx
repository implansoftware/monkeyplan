import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wrench, 
  FileText, 
  Package, 
  ShoppingCart, 
  Ticket,
  Users,
  ChevronRight,
  ListTodo
} from "lucide-react";
import { OperationalTask } from "@shared/schema";

const typeIcons: Record<string, typeof Wrench> = {
  repair: Wrench,
  invoice: FileText,
  stock: Package,
  b2b: ShoppingCart,
  ticket: Ticket,
  customer: Users,
  quote: FileText,
};

const typeColors: Record<string, string> = {
  repair: "text-blue-500",
  invoice: "text-amber-500",
  stock: "text-purple-500",
  b2b: "text-orange-500",
  ticket: "text-green-500",
  customer: "text-cyan-500",
  quote: "text-indigo-500",
};

interface OperationalTaskListProps {
  maxItems?: number;
}

export function OperationalTaskList({ maxItems = 8 }: OperationalTaskListProps) {
  const { t } = useTranslation();
  const { data: tasks = [], isLoading } = useQuery<OperationalTask[]>({
    queryKey: ["/api/operational-tasks"],
  });

  const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    alta: { label: t("common.priorityHigh"), color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500/10" },
    media: { label: t("common.priorityMedium"), color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10" },
    bassa: { label: t("common.priorityLow"), color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-500/10" },
  };

  const displayTasks = maxItems ? tasks.slice(0, maxItems) : tasks;
  const hasMore = tasks.length > displayTasks.length;

  const highPriorityCount = tasks.filter(t => t.priority === 'alta').length;
  const mediumPriorityCount = tasks.filter(t => t.priority === 'media').length;

  if (isLoading) {
    return (
      <Card data-testid="card-operational-tasks">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            {t("dashboard.operationalTasks")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card data-testid="card-operational-tasks">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            {t("dashboard.operationalTasks")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-medium text-foreground">{t("operationalTasks.allDone")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("operationalTasks.noPendingTasks")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-operational-tasks">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            {t("dashboard.operationalTasks")}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {highPriorityCount > 0 && (
              <Badge 
                className="font-normal border-0"
                style={{ backgroundColor: "rgb(239 68 68 / 0.1)", color: "rgb(220 38 38)" }}
                data-testid="badge-high-priority-count"
              >
                {highPriorityCount} {t("operationalTasks.urgent")}
              </Badge>
            )}
            {mediumPriorityCount > 0 && (
              <Badge 
                variant="secondary"
                className="font-normal"
                data-testid="badge-medium-priority-count"
              >
                {mediumPriorityCount} {t("operationalTasks.pending")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayTasks.map((task) => {
          const Icon = typeIcons[task.type] || Wrench;
          const iconColor = typeColors[task.type] || "text-slate-500";
          const priority = priorityConfig[task.priority] || priorityConfig.media;
          
          return (
            <div 
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm hover:border-primary/30 ${priority.bgColor}`}
              data-testid={`task-item-${task.id}`}
            >
              <div className={`h-9 w-9 rounded-lg bg-background flex items-center justify-center border ${iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm truncate" data-testid={`task-title-${task.id}`}>
                    {task.title}
                  </p>
                  {task.priority === 'alta' && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  )}
                  {task.priority === 'media' && (
                    <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {task.description}
                </p>
              </div>
              
              <Link href={task.actionUrl}>
                <Button 
                  size="sm" 
                  variant={task.priority === 'alta' ? 'default' : 'outline'}
                  className="flex-shrink-0"
                  data-testid={`task-action-${task.id}`}
                >
                  {task.actionLabel}
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          );
        })}
        
        {hasMore && (
          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground">
              {t("operationalTasks.moreTasks", { count: tasks.length - displayTasks.length })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
