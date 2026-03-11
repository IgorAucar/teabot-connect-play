import { Star } from "lucide-react";

interface BadgeGridProps {
  count: number;
}

const BadgeGrid = ({ count }: BadgeGridProps) => {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5">
      <h3 className="mb-4 font-heading text-lg font-bold text-foreground">
        Estrelas Conquistadas
      </h3>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">
          Complete atividades para ganhar estrelas!
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"
            >
              <Star className="h-5 w-5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgeGrid;
