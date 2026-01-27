import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Wrench, AlertTriangle, Star, MessageCircle, Info, Check, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/schema";

function NotificationCard({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: string) => void }) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'repair_update':
        return Wrench;
      case 'sla_warning':
        return AlertTriangle;
      case 'review_request':
        return Star;
      case 'message':
        return MessageCircle;
      case 'system':
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'repair_update':
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10';
      case 'sla_warning':
        return 'text-orange-600 dark:text-orange-400 bg-orange-500/10';
      case 'review_request':
        return 'text-purple-600 dark:text-purple-400 bg-purple-500/10';
      case 'message':
        return 'text-green-600 dark:text-green-400 bg-green-500/10';
      case 'system':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
      default:
        return 'text-foreground bg-muted';
    }
  };

  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);

  return (
    <Card 
      className={cn(
        "hover-elevate cursor-pointer transition-all",
        notification.isRead ? "opacity-60" : "border-emerald-500/30 shadow-md shadow-emerald-500/5"
      )}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      data-testid={`card-notification-${notification.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {notification.isRead ? (
                  <CheckCheck className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {notification.type === 'system' ? 'Sistema' : 
                   notification.type === 'repair_update' ? 'Riparazione' :
                   notification.type === 'sla_warning' ? 'SLA' :
                   notification.type === 'review_request' ? 'Recensione' :
                   notification.type === 'message' ? 'Messaggio' : 'Altro'}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: it })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResellerNotifications() {
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
              <Bell className="h-5 w-5" />
            </div>
            Notifiche
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci le tue notifiche e aggiornamenti
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="h-7 px-3" data-testid="badge-total-unread">
            {unreadCount} non lette
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Nessuna notifica</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Non hai ancora ricevuto nessuna notifica. Le notifiche appariranno qui quando ci saranno aggiornamenti.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
