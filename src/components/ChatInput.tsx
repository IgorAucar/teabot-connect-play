import { useState } from "react";
import { Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onHint: () => void;
  disabled: boolean;
}

const ChatInput = ({ onSend, onHint, disabled }: ChatInputProps) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card p-2">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={onHint}
        disabled={disabled}
        aria-label="Dica"
      >
        <Lightbulb className="h-5 w-5" />
      </Button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite sua resposta..."
        disabled={disabled}
        className="flex-1 bg-transparent px-2 py-2 font-body text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <Button type="submit" size="icon" disabled={disabled || !text.trim()} aria-label="Enviar">
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default ChatInput;
