const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <span className="font-heading text-sm font-bold">T</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl border-2 border-border bg-card px-5 py-4">
        <span className="text-xs text-muted-foreground font-body mr-2">TEAbot está digitando</span>
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot-1" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot-2" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot-3" />
      </div>
    </div>
  );
};

export default TypingIndicator;
