interface ProgressBarProps {
  completed: number;
  total: number;
}

const ProgressBar = ({ completed, total }: ProgressBarProps) => {
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5">
      <p className="mb-3 font-heading text-base font-semibold text-foreground">
        Habilidades Praticadas Hoje: {completed}/{total}
      </p>
      <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
