import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { queryClient } from '@/lib/queryClient';

export function useTicketNotifications() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

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
        
        if (data.type === 'notification' && data.data) {
          const notification = data.data;
          
          // Handle different ticket notification types
          switch (notification.type) {
            case 'ticket_status_changed':
            case 'ticket_assigned':
            case 'ticket_priority_changed':
              // Invalidate ticket list and specific ticket detail
              queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
              if (notification.ticketId) {
                queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId] });
              }
              break;
              
            case 'ticket_new_message':
              // Invalidate messages for specific ticket
              if (notification.ticketId) {
                queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId, 'messages'] });
                // Also invalidate ticket detail (updates last modified time)
                queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId] });
              }
              break;
          }
        }
      } catch (error) {
        console.error('WebSocket ticket notification error:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [user]);

  return { isConnected };
}
