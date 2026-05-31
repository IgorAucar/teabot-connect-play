import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import teabotHero from "@/assets/inovatea-logo.png";

type Mode = "welcome" | "login" | "signup";
type Role = "child" | "therapist";

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72);

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [mode, setMode] = useState<Mode>("welcome");
  const [submitting, setSubmitting] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup
  const [signupRole, setSignupRole] = useState<Role>("child");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [registration, setRegistration] = useState("");

  useEffect(() => {
    if (user && role) {
      navigate(role === "therapist" ? "/terapeuta" : "/dashboard", { replace: true });
    }
  }, [user, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Erro", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Não foi possível entrar",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      z.string().trim().min(2, "Nome muito curto").max(100).parse(name);
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (signupRole === "child") {
        if (age) z.coerce.number().int().min(3).max(18).parse(age);
        if (guardianEmail) emailSchema.parse(guardianEmail);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Erro", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    const meta: Record<string, string> = { name, role: signupRole };
    if (signupRole === "child") {
      if (age) meta.age = age;
      if (guardianName) meta.guardian_name = guardianName;
      if (guardianEmail) meta.guardian_email = guardianEmail;
    } else {
      if (specialty) meta.specialty = specialty;
      if (registration) meta.professional_registration = registration;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: meta,
      },
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Não foi possível cadastrar",
        description: error.message.includes("already registered")
          ? "Este e-mail já está cadastrado."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Conta criada!",
      description: "Verifique seu e-mail para confirmar o cadastro antes de entrar.",
    });
    setMode("login");
  };

  const handleForgot = async () => {
    try {
      emailSchema.parse(loginEmail);
    } catch {
      toast({
        title: "Informe seu e-mail",
        description: "Digite seu e-mail no campo acima para receber o link.",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "E-mail enviado", description: "Confira sua caixa de entrada." });
  };

  if (mode === "welcome") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="flex max-w-md flex-col items-center text-center">
          <img src={teabotHero} alt="Logo InovaTEA" className="mb-6 h-56 w-56 object-contain md:h-64 md:w-64" />
          <p className="mb-8 text-base text-muted-foreground">
            Uma plataforma com IA para apoiar crianças com TEA no desenvolvimento de
            habilidades sociais, junto a seus terapeutas.
          </p>
          <div className="flex w-full flex-col gap-3">
            <Button size="lg" variant="hero" onClick={() => setMode("login")}>
              Entrar
            </Button>
            <Button size="lg" variant="outline" onClick={() => setMode("signup")}>
              Criar Conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {mode === "login" ? "Entrar" : "Criar Conta"}
          </h2>
          <button
            type="button"
            onClick={() => setMode("welcome")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" variant="hero" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={handleForgot}
              className="text-sm text-primary hover:underline"
            >
              Esqueci minha senha
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setMode("signup")}
              >
                Criar agora
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Tabs value={signupRole} onValueChange={(v) => setSignupRole(v as Role)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="child">Criança</TabsTrigger>
                <TabsTrigger value="therapist">Terapeuta</TabsTrigger>
              </TabsList>

              <TabsContent value="child" className="mt-4 flex flex-col gap-3">
                <div>
                  <Label htmlFor="c-name">Nome da criança</Label>
                  <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="c-age">Idade</Label>
                  <Input
                    id="c-age"
                    type="number"
                    min={3}
                    max={18}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="c-gname">Nome do responsável</Label>
                  <Input
                    id="c-gname"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="c-gemail">E-mail do responsável</Label>
                  <Input
                    id="c-gemail"
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="therapist" className="mt-4 flex flex-col gap-3">
                <div>
                  <Label htmlFor="t-name">Nome completo</Label>
                  <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="t-spec">Especialidade</Label>
                  <Input
                    id="t-spec"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Psicologia infantil"
                  />
                </div>
                <div>
                  <Label htmlFor="t-reg">Registro profissional (opcional)</Label>
                  <Input
                    id="t-reg"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="s-email">
                {signupRole === "therapist" ? "E-mail profissional" : "E-mail (login)"}
              </Label>
              <Input
                id="s-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="s-password">Senha</Label>
              <Input
                id="s-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" size="lg" variant="hero" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Conta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
