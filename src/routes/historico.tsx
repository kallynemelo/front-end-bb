import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Droplets, History, Leaf, Trash2, Zap } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { formatImpact } from "@/lib/format";
import { clearHistory, loadHistory, removeHistoryEntry, type HistoryEntry } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico | ImpactaIA" },
      {
        name: "description",
        content: "Veja os cálculos de pegada ecológica que você já fez no ImpactaIA.",
      },
    ],
  }),
  component: HistoryPage,
});

const integer = new Intl.NumberFormat("pt-BR");
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function HistoryPage() {
  return (
    <AppShell>
      <main className="px-4 pb-6 pt-5 sm:px-6">
        <HistoryContent />
      </main>
    </AppShell>
  );
}

function HistoryContent() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  // Esta página só é montada depois do login, já no navegador, então o storage está disponível.
  const [entries, setEntries] = useState<HistoryEntry[]>(() => (email ? loadHistory(email) : []));

  function remove(id: string) {
    setEntries(removeHistoryEntry(email, id));
  }

  function clearAll() {
    clearHistory(email);
    setEntries([]);
  }

  const totals = entries.reduce(
    (sum, item) => ({
      energy: sum.energy + item.energyConsumedWh,
      carbon: sum.carbon + item.carbonFootprintGrams,
      water: sum.water + item.waterConsumedMl,
    }),
    { energy: 0, carbon: 0, water: 0 },
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            Histórico
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Os cálculos que você fez ficam salvos aqui, do mais recente para o mais antigo.
          </p>
        </div>

        {entries.length > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="h-9 shadow-none">
                <Trash2 aria-hidden="true" />
                Limpar histórico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todo o histórico?</AlertDialogTitle>
                <AlertDialogDescription>
                  Os {integer.format(entries.length)} cálculos salvos serão apagados e não poderão
                  ser recuperados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll}>Limpar histórico</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <EmptyHistory />
      ) : (
        <>
          <section
            aria-label="Total acumulado"
            className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-panel"
          >
            <p className="text-sm font-medium text-foreground">
              Total de {integer.format(entries.length)}{" "}
              {entries.length === 1 ? "cálculo" : "cálculos"}
            </p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <Metric icon={Zap} label="Energia" value={formatImpact(totals.energy)} unit="Wh" />
              <Metric icon={Leaf} label="CO₂e" value={formatImpact(totals.carbon)} unit="g" />
              <Metric icon={Droplets} label="Água" value={formatImpact(totals.water)} unit="mL" />
            </dl>
          </section>

          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} onRemove={() => remove(entry.id)} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function EmptyHistory() {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-dashed border-input bg-card px-6 py-14 text-center shadow-panel">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <History className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Nenhum cálculo ainda</h2>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        Faça um cálculo na calculadora e ele aparece aqui automaticamente.
      </p>
      <Link to="/" className={cn(buttonVariants({ size: "lg" }), "mt-5 px-6")}>
        Ir para a calculadora
      </Link>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <dt className="flex items-center gap-3 text-sm font-medium text-foreground">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {label}
      </dt>
      <dd className="text-right">
        <strong className="text-lg font-semibold text-foreground">{value}</strong>
        <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
      </dd>
    </div>
  );
}

function HistoryItem({ entry, onRemove }: { entry: HistoryEntry; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const promptId = `prompt-${entry.id}`;

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={promptId}
          className="group flex min-w-0 flex-1 items-start gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="min-w-0 flex-1">
            <PromptText id={promptId} label="Prompt de entrada" text={entry.prompt} open={open} />
            {entry.output ? (
              <PromptText
                label="Prompt de saída"
                text={entry.output}
                open={open}
                className="mt-2"
              />
            ) : null}
            <span className="mt-2 block text-xs text-muted-foreground">
              {dateTime.format(entry.createdAt)} · {entry.model}
            </span>
          </span>
        </button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          aria-label="Excluir este cálculo"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Tokens" value={integer.format(entry.totalTokens)} />
        <Stat label="Energia" value={`${formatImpact(entry.energyConsumedWh)} Wh`} />
        <Stat label="CO₂e" value={`${formatImpact(entry.carbonFootprintGrams)} g`} />
        <Stat label="Água" value={`${formatImpact(entry.waterConsumedMl)} mL`} />
      </dl>
    </li>
  );
}

function PromptText({
  id,
  label,
  text,
  open,
  className,
}: {
  id?: string;
  label: string;
  text: string;
  open: boolean;
  className?: string;
}) {
  return (
    <span className={cn("block", className)}>
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <span
        id={id}
        className={cn(
          "block whitespace-pre-wrap break-words font-mono text-sm leading-6 text-foreground",
          !open && "line-clamp-2",
        )}
      >
        {text}
      </span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/50 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-foreground">{value}</dd>
    </div>
  );
}
