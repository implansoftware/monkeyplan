import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@shared/schema';

export function useNotifications() {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', userId: user.id }));
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        }
      } catch (error) {
        console.error('WebSocket notification error:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead: markAsRead.mutate,
    markAsReadPending: markAsRead.isPending,
    markAllAsRead: markAllAsRead.mutate,
    markAllAsReadPending: markAllAsRead.isPending,
  };
}
