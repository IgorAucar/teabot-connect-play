import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatBubble from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";
import ChatOptions from "@/components/ChatOptions";
import TypingIndicator from "@/components/TypingIndicator";
import FeedbackBadge from "@/components/FeedbackBadge";
import { getActivityById } from "@/lib/activities";
import type { ChatMessage } from "@/lib/app-state";
import { useAppState } from "@/hooks/useAppState";
import { supabase } from "@/integrations/supabase/client";

interface ChatOption {
  emoji: string;
  label: string;
}

const feedbackMessages = [
  "Muito bem!",
  "Otimo trabalho!",
  "Continue assim!",
  "Excelente!",
  "Parabens!",
];

const ChatPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const activity = getActivityById(activityId || "");
  const { markCompleted } = useAppState();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<ChatOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, currentOptions]);

  const sendToAI = useCallback(async (allMessages: ChatMessage[]) => {
    setIsLoading(true);
    setCurrentOptions([]);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          activityId,
        },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data?.content || "Ola! Como posso te ajudar? 😊",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentOptions(data?.options || []);

      if (allMessages.length > 0) {
        const fb = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
        setFeedbackText(fb);
        setFeedbackVisible(false);
        setTimeout(() => setFeedbackVisible(true), 100);
      }

      setExchangeCount((c) => {
        const next = c + 1;
        if (next >= 3 && activityId) {
          markCompleted(activityId, activity?.title || "");
        }
        return next;
      });
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ops! Algo deu errado. Tente novamente. 😊" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [activity, activityId, markCompleted]);

  useEffect(() => {
    if (activity && !initializedRef.current) {
      initializedRef.current = true;
      sendToAI([]);
    }
  }, [activity, sendToAI]);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    sendToAI(updated);
  };

  const handleOptionSelect = (option: ChatOption) => {
    const text = `${option.emoji} ${option.label}`;
    handleSend(text);
  };

  const handleHint = () => {
    handleSend("Pode me dar uma dica?");
  };

  if (!activity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 font-heading text-xl text-foreground">Atividade nao encontrada.</p>
          <Link to="/dashboard">
            <Button variant="back">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/dashboard">
          <Button variant="back" size="sm">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading text-lg font-bold text-foreground">{activity.title}</h1>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {isLoading && <TypingIndicator />}
          {!isLoading && currentOptions.length > 0 && (
            <ChatOptions options={currentOptions} onSelect={handleOptionSelect} disabled={isLoading} />
          )}
          <FeedbackBadge message={feedbackText} visible={feedbackVisible} />
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <ChatInput onSend={handleSend} onHint={handleHint} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
