import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell/app-shell";
import { FootprintCalculator } from "@/components/calculator/footprint-calculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ImpactaIA | Calculadora de pegada ecológica com IA" },
      {
        name: "description",
        content:
          "Escreva um prompt e estime a quantidade de tokens e a pegada ecológica (energia, CO₂e e água) de processá-lo.",
      },
      { property: "og:title", content: "ImpactaIA | Calculadora de pegada ecológica" },
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
    <AppShell>
      <main className="px-4 pb-4 pt-5 sm:px-6">
        <div className="mx-auto mb-4 max-w-4xl text-center">
          <h1 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            Calculadora de Pegada Ecológica com IA
          </h1>
          <p className="mx-auto mt-1 max-w-4xl text-pretty text-sm leading-6 text-muted-foreground">
            Escreva um prompt, calcule e veja quantos tokens ele usa e quanta energia, CO₂e e água
            seu processamento consome.
          </p>
        </div>

        <FootprintCalculator />
      </main>
    </AppShell>
  );
}
