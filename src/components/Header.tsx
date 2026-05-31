import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const navItems = !user
    ? [{ path: "/", label: "Início" }, { path: "/sobre", label: "Sobre" }]
    : role === "therapist"
    ? [
        { path: "/terapeuta", label: "Pacientes" },
        { path: "/relatorios", label: "Relatórios" },
        { path: "/sobre", label: "Sobre" },
      ]
    : [
        { path: "/dashboard", label: "Atividades" },
        { path: "/progresso", label: "Progresso" },
        { path: "/meus-relatorios", label: "Meus Relatórios" },
        { path: "/sobre", label: "Sobre" },
      ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="border-b border-border bg-primary">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="font-heading text-2xl font-bold text-primary-foreground">
          InovaTEA
        </Link>
        <nav className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-lg px-3 py-2 font-heading text-xs font-semibold transition-colors md:px-4 md:text-sm ${
                location.pathname === item.path
                  ? "bg-primary-foreground text-primary"
                  : "text-primary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSignOut}
              className="ml-1 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <LogOut className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="secondary" className="ml-1">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
