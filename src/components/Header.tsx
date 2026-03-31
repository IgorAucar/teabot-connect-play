import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "Início" },
  { path: "/dashboard", label: "Atividades" },
  { path: "/progresso", label: "Progresso" },
  { path: "/sobre", label: "Sobre" },
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="border-b border-border bg-primary">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="font-heading text-2xl font-bold text-primary-foreground">
          InovaTEA
        </Link>
        <nav className="hidden gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-lg px-4 py-2 font-heading text-sm font-semibold transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <nav className="flex gap-1 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-lg px-3 py-2 font-heading text-xs font-semibold ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
