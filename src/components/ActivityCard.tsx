import { Link } from "react-router-dom";
import { Hand, HandHelping, Users, Heart, Handshake, Star } from "lucide-react";
import type { Activity } from "@/lib/activities";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Hand,
  HandHelping,
  Users,
  Heart,
  Handshake,
  Star,
};

interface ActivityCardProps {
  activity: Activity;
  completed: boolean;
}

const ActivityCard = ({ activity, completed }: ActivityCardProps) => {
  const Icon = iconMap[activity.icon] || Star;

  return (
    <Link
      to={`/chat/${activity.id}`}
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-colors ${
        completed
          ? "border-success bg-success/10"
          : "border-border bg-card hover:border-primary/40 hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
          completed ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
        }`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-heading text-lg font-bold text-foreground">
        {activity.title}
      </h3>
      <p className="text-sm text-muted-foreground">{activity.description}</p>
      {completed && (
        <span className="rounded-full bg-success px-3 py-1 font-heading text-xs font-semibold text-success-foreground">
          Concluído
        </span>
      )}
    </Link>
  );
};

export default ActivityCard;
