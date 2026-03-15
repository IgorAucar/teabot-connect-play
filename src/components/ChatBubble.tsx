import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const ChatBubble = ({ role, content }: ChatBubbleProps) => {
  const isUser = role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "pt-BR";
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <span className="font-heading text-lg font-bold">T</span>
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          className={`rounded-3xl px-5 py-4 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border-2 border-border"
          }`}
        >
          <div className="prose prose-lg max-w-none text-inherit leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        {!isUser && (
          <button
            onClick={handleSpeak}
            className="flex items-center gap-1.5 self-start ml-1 px-3 py-1.5 rounded-full text-sm font-body text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
            aria-label={isSpeaking ? "Parar áudio" : "Ouvir mensagem"}
          >
            {isSpeaking ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
            {isSpeaking ? "Parar" : "Ouvir"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
