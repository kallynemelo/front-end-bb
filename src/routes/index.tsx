import { createFileRoute } from "@tanstack/react-router";

import logobb from "@/assets/icones/logobb.png";
import { FootprintCalculator } from "@/components/calculator/footprint-calculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BB Inteligência | Calculadora de pegada ecológica de IA" },
      {
        name: "description",
        content:
          "Escreva um prompt e estime a quantidade de tokens e a pegada ecológica (energia, CO₂e e água) de processá-lo.",
      },
      { property: "og:title", content: "BB Inteligência | Calculadora de pegada ecológica" },
      {
        property: "og:description",
        content: "Estime tokens, energia, CO₂e e água consumidos por um prompt de IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card shadow-panel">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-18 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-yellow shadow-sm">
              <img src={logobb} alt="Banco do Brasil" className="h-full w-full object-contain" />
            </span>
            <strong className="text-lg font-semibold text-foreground">BB Inteligência</strong>
          </div>
          <span className="text-sm text-muted-foreground">Banco do Brasil</span>
        </div>
      </header>

      <main className="px-4 pb-4 pt-5 sm:px-6">
        <div className="mx-auto mb-4 max-w-4xl text-center">
          <h1 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            Calculadora de pegada ecológica de IA
          </h1>
          <p className="mx-auto mt-1 max-w-4xl text-pretty text-sm leading-6 text-muted-foreground">
            Escreva um prompt, calcule e veja quantos tokens ele usa e quanta energia, CO₂e e água
            seu processamento consome.
          </p>
        </div>

        <FootprintCalculator />
      </main>
    </div>
  );
}