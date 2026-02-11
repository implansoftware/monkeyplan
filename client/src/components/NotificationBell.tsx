import { Bell, Wrench, AlertTriangle, Star, MessageCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@shared/schema';

function NotificationItem({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: string) => void }) {
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
        return 'text-blue-600 dark:text-blue-400';
      case 'sla_warning':
        return 'text-orange-600 dark:text-orange-400';
      case 'review_request':
        return 'text-purple-600 dark:text-purple-400';
      case 'message':
        return 'text-green-600 dark:text-green-400';
      case 'system':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const Icon = getNotificationIcon(notification.type);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-md cursor-pointer hover-elevate active-elevate-2',
        notification.isRead ? 'opacity-60' : 'bg-accent/10'
      )}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      data-testid={`notification-item-${notification.id}`}
    >
      <Icon className={cn('h-5 w-5 mt-0.5', getNotificationColor(notification.type))} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary" data-testid="notification-unread-indicator" />
      )}
    </div>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  
  if (!user) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" data-testid="popover-notifications">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" data-testid="text-unread-summary">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center" data-testid="text-empty-state">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
