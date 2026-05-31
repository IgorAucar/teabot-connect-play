import { Volume2 } from "lucide-react";
import { speakText } from "@/lib/speech";

interface ChatOption {
  emoji: string;
  label: string;
}

interface ChatOptionsProps {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
  disabled?: boolean;
}

const ChatOptions = ({ options, onSelect, disabled }: ChatOptionsProps) => {
  if (!options.length) return null;

  const handlePlay = (e: React.MouseEvent, option: ChatOption) => {
    e.stopPropagation();
    speakText(option.label);
  };

  return (
    <div className="flex flex-wrap justify-center gap-3 px-2 py-2">
      {options.map((option, i) => (
        <div
          key={i}
          className="relative flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-4 min-w-[140px] shadow-sm transition-all hover:border-primary hover:shadow-md"
        >
          <button
            type="button"
            onClick={(e) => handlePlay(e, option)}
            disabled={disabled}
            aria-label={`Ouvir opção: ${option.label}`}
            className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelect(option)}
            disabled={disabled}
            aria-label={`Selecionar opção: ${option.label}`}
            className="flex flex-col items-center gap-2 font-body text-base font-medium text-card-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="text-3xl leading-none" aria-hidden="true">{option.emoji}</span>
            <span className="text-sm">{option.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatOptions;
