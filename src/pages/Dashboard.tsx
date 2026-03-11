import Header from "@/components/Header";
import ActivityCard from "@/components/ActivityCard";
import ProgressBar from "@/components/ProgressBar";
import { activities } from "@/lib/activities";
import { useAppState } from "@/hooks/useAppState";

const Dashboard = () => {
  const { state } = useAppState();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">
          Olá! O que você quer praticar hoje?
        </h1>
        <p className="mb-6 text-base text-muted-foreground">
          Escolha uma atividade para começar.
        </p>
        <div className="mb-8">
          <ProgressBar completed={state.completedToday.length} total={activities.length} />
        </div>
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              completed={state.completedToday.includes(activity.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
