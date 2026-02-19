import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import monkeyIcon from "../assets/images/monkey-ai-icon.png";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistantWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: aiStatus, isLoading: statusLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/ai/status"],
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: async (chatMessages: ChatMessage[]) => {
      const res = await apiRequest("POST", "/api/ai/chat", { messages: chatMessages });
      return await res.json();
    },
    onSuccess: (data) => {
      setErrorMessage(null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.message || data.content || "" },
      ]);
    },
    onError: (error: any) => {
      const msg = error?.message || "";
      let parsed: any = null;
      const jsonMatch = msg.match(/^\d+:\s*(.+)$/s);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[1]); } catch {}
      }
      if (parsed?.code === "insufficient_quota") {
        setErrorMessage(t("ai.quotaExceeded"));
      } else if (parsed?.code === "invalid_api_key") {
        setErrorMessage(t("ai.error"));
      } else if (parsed?.code === "rate_limit") {
        setErrorMessage(t("ai.rateLimit"));
      } else if (parsed?.error) {
        setErrorMessage(parsed.error);
      } else {
        setErrorMessage(t("ai.error"));
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    chatMutation.mutate(updatedMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (statusLoading || !aiStatus?.enabled) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          data-testid="button-open-ai-chat"
          className="gap-2 shadow-lg"
        >
          <img src={monkeyIcon} alt="AI" className="h-5 w-5" />
          <span>{t("ai.assistantLabel", "AI Assistant")}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px]">
      <Card className="flex flex-col" style={{ maxHeight: "500px" }}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <img src={monkeyIcon} alt="AI" className="h-5 w-5" />
            <CardTitle className="text-base">{t("ai.title")}</CardTitle>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-ai-chat"
          >
            <X />
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 p-4 pt-0 flex-1 overflow-hidden">
          <div
            className="flex-1 overflow-y-auto space-y-3 min-h-0"
            style={{ maxHeight: "360px" }}
            data-testid="ai-chat-messages"
          >
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="rounded-md px-3 py-2 text-sm max-w-[80%] bg-secondary text-secondary-foreground">
                  {t("ai.welcomeMessage")}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`chat-message-${msg.role}-${index}`}
              >
                <div
                  className={`rounded-md px-3 py-2 text-sm max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex justify-start" data-testid="ai-chat-loading">
                <div className="rounded-md px-3 py-2 text-sm bg-secondary text-secondary-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">{t("ai.thinking")}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {(chatMutation.isError || errorMessage) && (
            <p className="text-sm text-destructive" data-testid="ai-chat-error">
              {errorMessage || t("ai.error")}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("ai.placeholder")}
              disabled={chatMutation.isPending}
              data-testid="input-ai-chat-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              data-testid="button-send-ai-message"
            >
              <Send />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
