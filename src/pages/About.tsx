import Header from "@/components/Header";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">
            Sobre o InovaTEA
          </h1>

          <div className="space-y-6">
            <section className="rounded-2xl border-2 border-border bg-card p-6">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">
                O que é o InovaTEA?
              </h2>
              <p className="text-base text-foreground leading-relaxed">
                O InovaTEA é uma ferramenta educacional desenvolvida para ajudar crianças com
                Transtorno do Espectro Autista (TEA) a praticar habilidades sociais em um
                ambiente seguro, acolhedor e sem julgamentos.
              </p>
            </section>

            <section className="rounded-2xl border-2 border-border bg-card p-6">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">
                Para quem é?
              </h2>
              <p className="text-base text-foreground leading-relaxed">
                Crianças de 6 a 12 anos com TEA, localizadas em Manaus e região. A ferramenta
                oferece conversas guiadas por inteligência artificial que simulam situações
                sociais do dia a dia, como cumprimentar, pedir ajuda e fazer amigos.
              </p>
            </section>

            <section className="rounded-2xl border-2 border-border bg-card p-6">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">
                Como funciona?
              </h2>
              <p className="text-base text-foreground leading-relaxed">
                O TEAbot, nosso assistente virtual, guia a criança por atividades de
                conversação. Cada atividade foca em uma habilidade social específica.
                O TEAbot responde de forma simples e encorajadora, dando feedback positivo
                a cada interação.
              </p>
            </section>

            <section className="rounded-2xl border-2 border-border bg-card p-6">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">
                Tecnologias
              </h2>
              <p className="text-base text-foreground leading-relaxed">
                Construído com React, Tailwind CSS e inteligência artificial generativa
                para criar uma experiência interativa e personalizada para cada criança.
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">
          InovaTEA — Manaus, AM
        </p>
      </footer>
    </div>
  );
};

export default About;
