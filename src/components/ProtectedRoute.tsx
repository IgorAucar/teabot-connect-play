import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  requireRole?: AppRole;
}

const ProtectedRoute = ({ children, requireRole }: Props) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-heading text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requireRole && role && role !== requireRole) {
    return <Navigate to={role === "therapist" ? "/terapeuta" : "/dashboard"} replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
