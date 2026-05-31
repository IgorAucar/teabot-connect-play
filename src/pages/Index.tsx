import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import teabotHero from "@/assets/inovatea-logo.png";

const Home = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      navigate(role === "therapist" ? "/terapeuta" : "/dashboard", { replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="container flex max-w-3xl flex-col items-center text-center">
          <img
            src={teabotHero}
            alt="Logo InovaTEA — Transformando comunicação em inclusão"
            className="mb-8 h-64 w-64 object-contain md:h-80 md:w-80"
          />
          <p className="mb-8 max-w-lg text-base text-muted-foreground md:text-lg">
            Um assistente com IA para ajudar crianças com TEA a praticar
            habilidades sociais de forma segura, divertida e encorajadora.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/auth">
              <Button variant="hero" size="lg">
                Entrar
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">InovaTEA — Manaus, AM</p>
      </footer>
    </div>
  );
};

export default Home;
