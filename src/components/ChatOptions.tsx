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

  return (
    <div className="flex flex-wrap justify-center gap-3 px-2 py-2">
      {options.map((option, i) => (
        <button
          key={i}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-4 min-w-[120px] font-body text-base font-medium text-card-foreground shadow-sm transition-all hover:scale-105 hover:border-primary hover:shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="text-3xl leading-none">{option.emoji}</span>
          <span className="text-sm">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ChatOptions;
