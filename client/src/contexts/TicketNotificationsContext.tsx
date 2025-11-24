import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';

type TicketNotificationsContextType = {
  isConnected: boolean;
};

const TicketNotificationsContext = createContext<TicketNotificationsContextType>({
  isConnected: false,
});

export function TicketNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const userRef = useRef(user); // Track current user for closure access
  const shouldReconnectRef = useRef(true); // Guard to prevent reconnect after logout
  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 1000;

  // Update userRef whenever user changes
  useEffect(() => {
    userRef.current = user;
    shouldReconnectRef.current = !!user; // Enable reconnect only when user exists
  }, [user]);

  useEffect(() => {
    if (!user) {
      // CRITICAL: Set refs to null/false IMMEDIATELY before closing socket
      // to prevent race condition where onclose() runs before cleanup
      userRef.current = null;
      shouldReconnectRef.current = false;
      
      // Clean up connection if user logs out
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    const connect = () => {
      // Don't create new connection if already connected
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'auth', userId: user.id }));
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification' && data.data) {
            const notification = data.data;
            
            switch (notification.type) {
              case 'ticket_status_changed':
              case 'ticket_assigned':
              case 'ticket_priority_changed':
                queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
                if (notification.ticketId) {
                  queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId] });
                }
                break;
                
              case 'ticket_new_message':
                if (notification.ticketId) {
                  queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId, 'messages'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId] });
                }
                break;
            }
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
        socketRef.current = null;

        // Double guard: check both shouldReconnect flag AND userRef
        // This prevents race condition where logout happens mid-close
        if (
          shouldReconnectRef.current &&
          userRef.current &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      socketRef.current = socket;
    };

    connect();

    return () => {
      // CRITICAL: Set guards BEFORE closing socket to prevent race condition
      // Cleanup runs BEFORE next effect, so we must disable reconnect here
      shouldReconnectRef.current = false;
      userRef.current = null;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user]);

  return (
    <TicketNotificationsContext.Provider value={{ isConnected }}>
      {children}
    </TicketNotificationsContext.Provider>
  );
}

export function useTicketNotifications() {
  const context = useContext(TicketNotificationsContext);
  if (context === undefined) {
    throw new Error('useTicketNotifications must be used within TicketNotificationsProvider');
  }
  return context;
}
