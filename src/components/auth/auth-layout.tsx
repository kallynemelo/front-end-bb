import { Droplets, Eye, EyeOff, Leaf, Zap } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";

import logoBbAzul from "@/assets/icones/logo-bb-azul.png";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: Zap, label: "Energia", detail: "consumo em Wh" },
  { icon: Leaf, label: "CO₂e", detail: "emissões em gramas" },
  { icon: Droplets, label: "Água", detail: "uso em mL" },
];

/** Tela dividida: painel azul da marca à esquerda e formulário à direita (empilha no celular). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-2">
      <aside className="flex flex-col justify-between gap-10 border-b-4 border-[#FCFC30] bg-[#465EFF] px-6 py-8 text-white sm:px-10 lg:border-b-0 lg:border-r-4 lg:px-14 lg:py-12">
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="flex items-center gap-3">
            <img
              src={logoBbAzul}
              alt="Banco do Brasil"
              className="size-14 shrink-0 rounded-xl object-contain sm:size-16"
            />
            <div className="leading-tight">
              <strong className="block text-2xl font-semibold tracking-[-0.02em]">ImpactaIA</strong>
              <span className="text-sm text-white/80">Pegada ecológica de IA</span>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl lg:text-4xl">
              Cada prompt tem um custo para o planeta.
            </h2>
            <p className="mt-4 hidden text-pretty text-base leading-7 text-white/85 lg:block">
              O ImpactaIA estima o consumo de energia, as emissões de CO₂e e o uso de água
              associados ao uso de inteligências artificiais, ajudando você a tomar decisões mais
              conscientes.
            </p>
          </div>
        </div>

        <ul className="hidden gap-3 lg:grid lg:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="rounded-xl bg-white/12 p-4">
              <Icon className="size-5 text-brand-yellow" aria-hidden="true" />
              <strong className="mt-3 block text-base font-semibold">{label}</strong>
              <span className="text-sm text-white/80">{detail}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col items-center justify-center gap-4 px-4 py-8 sm:px-8 lg:py-12">
        {children}
        <p className="max-w-md text-center text-xs leading-5 text-muted-foreground">
          Banco do Brasil S.A. — Portal ImpactaIA · CNPJ 00.000.000/0001-91
        </p>
      </main>
    </div>
  );
}

/** Cartão branco que envolve o formulário, no mesmo estilo dos painéis do projeto. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-panel sm:p-8">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        {footer}
      </p>
    </section>
  );
}

export function FormField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export const authInputClass = "h-11 bg-muted/40 text-base shadow-none";

export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(authInputClass, "pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
