import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Search, UserPlus, ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ChatUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  companyName: string | null;
};

type Conversation = {
  partnerId: string;
  partnerUsername: string;
  partnerEmail: string;
  partnerRole: string;
  partnerCompanyName: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function getRoleLabel(role: string, t: (key: string) => string): string {
  switch (role) {
    case 'admin': return t("chat.roleAdmin");
    case 'reseller': return t("chat.roleReseller");
    case 'sub_reseller': return t("chat.roleSubReseller");
    case 'repair_center': return t("chat.roleRepairCenter");
    case 'customer': return t("chat.roleCustomer");
    default: return role;
  }
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function AdminChat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchConv, setSearchConv] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [], isLoading: convsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/chat/conversations"],
    refetchInterval: 15000,
  });

  const { data: chatMessages = [], isLoading: msgsLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", selectedUserId],
    enabled: !!selectedUserId,
  });

  const { data: allUsers = [] } = useQuery<ChatUser[]>({
    queryKey: ["/api/chat/users"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("PATCH", `/api/chat/messages/read/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
  });

  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", data.data?.senderId] });
          queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", data.data?.receiverId] });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    socket.onerror = () => {
      toast({
        title: t("chat.connectionError"),
        variant: "destructive",
      });
    };

    setWs(socket);
    return () => { socket.close(); };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (selectedUserId) {
      markReadMutation.mutate(selectedUserId);
      inputRef.current?.focus();
    }
  }, [selectedUserId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws || !user || !selectedUserId) return;

    ws.send(JSON.stringify({
      type: 'message',
      receiverId: selectedUserId,
      message: newMessage,
    }));
    setNewMessage("");

    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    }, 300);
  };

  const selectedConversation = conversations.find(c => c.partnerId === selectedUserId);
  const selectedUser = allUsers.find(u => u.id === selectedUserId);
  const selectedName = selectedConversation?.partnerUsername || selectedUser?.username || '';
  const selectedRole = selectedConversation?.partnerRole || selectedUser?.role || '';
  const selectedCompany = selectedConversation?.partnerCompanyName || selectedUser?.companyName || null;

  const filteredConversations = useMemo(() => {
    if (!searchConv.trim()) return conversations;
    const q = searchConv.toLowerCase();
    return conversations.filter(c =>
      c.partnerUsername.toLowerCase().includes(q) ||
      (c.partnerCompanyName && c.partnerCompanyName.toLowerCase().includes(q)) ||
      c.partnerRole.toLowerCase().includes(q)
    );
  }, [conversations, searchConv]);

  const filteredUsers = useMemo(() => {
    if (!searchUsers.trim()) return allUsers;
    const q = searchUsers.toLowerCase();
    return allUsers.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.companyName && u.companyName.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [allUsers, searchUsers]);

  const startNewChat = (userId: string) => {
    setSelectedUserId(userId);
    setShowNewChat(false);
    setSearchUsers("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("chat.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("chat.subtitle")}</p>
          </div>
        </div>
        <Button onClick={() => setShowNewChat(true)} data-testid="button-new-chat">
          <UserPlus className="h-4 w-4 mr-2" />
          {t("chat.newConversation")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <Card className="lg:col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4" />
              {t("chat.conversations")}
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("chat.searchConversations")}
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                className="pl-9"
                data-testid="input-search-conversations"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {convsLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground px-4">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t("chat.noConversations")}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewChat(true)} data-testid="button-start-first-chat">
                  {t("chat.startConversation")}
                </Button>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.partnerId}
                    onClick={() => setSelectedUserId(conv.partnerId)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 hover-elevate ${
                      selectedUserId === conv.partnerId ? 'bg-accent' : ''
                    }`}
                    data-testid={`conversation-${conv.partnerId}`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-xs">{getInitials(conv.partnerUsername)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{conv.partnerCompanyName || conv.partnerUsername}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(conv.lastMessageAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="text-xs shrink-0" data-testid={`badge-unread-${conv.partnerId}`}>
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">{getRoleLabel(conv.partnerRole, t)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 flex flex-col overflow-hidden">
          {selectedUserId ? (
            <>
              <CardHeader className="border-b pb-3 shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedUserId(null)} data-testid="button-back-chat">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">{getInitials(selectedName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" data-testid="text-chat-partner-name">
                      {selectedCompany || selectedName}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">{getRoleLabel(selectedRole, t)}</Badge>
                      {selectedCompany && <span className="text-xs text-muted-foreground">{selectedName}</span>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {msgsLoading ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">{t("common.loading")}</div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{t("chat.noMessagesYet")}</p>
                        <p className="text-xs mt-1">{t("chat.startTyping")}</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                          data-testid={`chat-message-${msg.id}`}
                        >
                          <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                            msg.senderId === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <Separator />
                <form onSubmit={handleSendMessage} className="p-3 flex gap-2 shrink-0">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("chat.typeMessage")}
                    data-testid="input-chat-message"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()} data-testid="button-send-message">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="text-lg font-medium">{t("chat.selectConversation")}</p>
                <p className="text-sm mt-1">{t("chat.selectConversationDesc")}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("chat.newConversation")}</DialogTitle>
            <DialogDescription>{t("chat.selectUserToChat")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("chat.searchUsers")}
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => startNewChat(u.id)}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover-elevate"
                    data-testid={`user-chat-${u.id}`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">{getInitials(u.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{u.companyName || u.username}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">{getRoleLabel(u.role, t)}</Badge>
                        {u.companyName && <span className="text-xs text-muted-foreground">{u.username}</span>}
                      </div>
                      {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {t("chat.noUsersFound")}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
