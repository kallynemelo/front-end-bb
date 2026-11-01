import { Link, createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useAuth } from "@/lib/auth";
import {
  METRICS,
  PERIODS,
  colorForModel,
  dailyAverageTokens,
  dailyTotals,
  filterByPeriod,
  formatAxis,
  formatMetric,
  formatPercent,
  modelShares,
  type DayPoint,
  type MetricKey,
  type ModelShare,
  type PeriodDays,
} from "@/lib/dashboard";
import { loadHistory, type HistoryEntry } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | ImpactaIA" },
      {
        name: "description",
        content: "Gráficos do impacto ambiental dos prompts que você já calculou no ImpactaIA.",
      },
    ],
  }),
  component: DashboardPage,
});

const integer = new Intl.NumberFormat("pt-BR");
const LINE_COLOR = "#3853ff";
const BAR_COLOR = "#003d9e";

function DashboardPage() {
  return (
    <AppShell>
      <main className="px-4 pb-6 pt-5 sm:px-6">
        <DashboardContent />
      </main>
    </AppShell>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const username = user?.email ?? "";
  // Esta página só é montada depois do login, já no navegador, então o storage está disponível.
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    username ? loadHistory(username) : [],
  );
  const [metric, setMetric] = useState<MetricKey>("energy");
  const [period, setPeriod] = useState<PeriodDays>(30);

  // Atualiza os gráficos se o histórico mudar em outra aba.
  useEffect(() => {
    function refresh() {
      if (username) setEntries(loadHistory(username));
    }
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [username]);

  const info = METRICS[metric];
  const periodEntries = useMemo(() => filterByPeriod(entries, period), [entries, period]);
  const daily = useMemo(() => dailyTotals(entries, period, info.pick), [entries, period, info]);
  const shares = useMemo(() => modelShares(periodEntries), [periodEntries]);
  const weekAverage = useMemo(() => dailyAverageTokens(entries, 7), [entries]);

  const total = periodEntries.reduce((sum, entry) => sum + info.pick(entry), 0);
  const average = periodEntries.length > 0 ? total / periodEntries.length : 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4">
        <h1 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Gráficos montados com os cálculos salvos no seu histórico.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <div className="flex flex-col gap-4">
          <section
            aria-label="Impacto por dia"
            className="rounded-2xl border border-border bg-card p-4 shadow-panel sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ChipGroup label="Métrica">
                {(Object.keys(METRICS) as MetricKey[]).map((key) => (
                  <Chip key={key} active={metric === key} onClick={() => setMetric(key)}>
                    {METRICS[key].label}
                  </Chip>
                ))}
              </ChipGroup>
              <ChipGroup label="Período">
                {PERIODS.map((days) => (
                  <Chip key={days} active={period === days} onClick={() => setPeriod(days)}>
                    {days} dias
                  </Chip>
                ))}
              </ChipGroup>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Cálculos no período"
                value={integer.format(periodEntries.length)}
              />
              <SummaryCard
                label={`Total de ${info.label.toLowerCase()}`}
                value={formatMetric(metric, total)}
                unit={info.unit}
              />
              <SummaryCard
                label="Média por prompt"
                value={formatMetric(metric, average)}
                unit={info.unit}
              />
            </dl>

            <h2 className="mt-5 text-sm font-semibold text-foreground">
              Impacto por dia · {info.label} ({info.unit})
            </h2>
            <ChartContainer
              role="img"
              aria-label={`Gráfico de linha de ${info.label.toLowerCase()} por dia nos últimos ${period} dias`}
              config={{ value: { label: info.label, color: LINE_COLOR } } satisfies ChartConfig}
              className="mt-2 aspect-auto h-72 w-full"
            >
              <LineChart data={daily} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickMargin={8}
                />
                <YAxis
                  width={60}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatAxis}
                  allowDecimals
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  content={<DayTooltip metric={metric} unit={info.unit} noun="prompts" />}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={LINE_COLOR}
                  strokeWidth={2}
                  dot={period === 7 ? { r: 3, fill: LINE_COLOR } : false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section
              aria-label="Prompts utilizados por modelo de IA"
              className="rounded-2xl border border-border bg-card p-4 shadow-panel sm:p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Prompts utilizados por modelo de IA
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Últimos {period} dias</p>
              <ModelPie shares={shares} />
            </section>

            <section
              aria-label="Média de tokens por prompt nos últimos 7 dias"
              className="rounded-2xl border border-border bg-card p-4 shadow-panel sm:p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Média de tokens por prompt por dia
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Últimos 7 dias · dias sem cálculo aparecem como 0
              </p>
              <ChartContainer
                role="img"
                aria-label="Gráfico de barras com a média de tokens por prompt em cada um dos últimos 7 dias"
                config={
                  { value: { label: "Tokens por prompt", color: BAR_COLOR } } satisfies ChartConfig
                }
                className="mt-3 aspect-auto h-64 w-full"
              >
                <BarChart data={weekAverage} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={44} tickLine={false} axisLine={false} tickFormatter={formatAxis} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    content={<DayTooltip metric="tokens" unit="tokens por prompt" noun="prompts" />}
                  />
                  <Bar dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelPie({ shares }: { shares: ModelShare[] }) {
  if (shares.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-input px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum prompt neste período.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      <ChartContainer
        role="img"
        aria-label={`Gráfico de pizza com a porcentagem de prompts por modelo: ${shares
          .map((share) => `${share.model} ${formatPercent(share.percent)}`)
          .join(", ")}`}
        config={{ count: { label: "Prompts" } } satisfies ChartConfig}
        className="aspect-auto h-52 w-full"
      >
        <PieChart>
          <Tooltip content={<ModelTooltip />} />
          <Pie
            data={shares}
            dataKey="count"
            nameKey="model"
            outerRadius="90%"
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {shares.map((share, index) => (
              <Cell key={share.model} fill={colorForModel(share.model, index)} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="flex flex-col gap-2 text-sm">
        {shares.map((share, index) => (
          <li key={share.model} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: colorForModel(share.model, index) }}
            />
            <span className="flex-1 font-medium text-foreground">{share.model}</span>
            <span className="text-muted-foreground">
              {integer.format(share.count)} {share.count === 1 ? "prompt" : "prompts"}
            </span>
            <strong className="w-16 text-right font-semibold text-foreground">
              {formatPercent(share.percent)}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

type TooltipPayload = { payload?: unknown };

function DayTooltip({
  active,
  payload,
  metric,
  unit,
  noun,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  metric: MetricKey;
  unit: string;
  noun: string;
}) {
  const point = payload?.[0]?.payload as DayPoint | undefined;
  if (!active || !point) return null;

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground">{point.label}</p>
      <p className="mt-1 text-muted-foreground">
        <strong className="font-semibold text-foreground">
          {formatMetric(metric, point.value)}
        </strong>{" "}
        {unit}
      </p>
      <p className="text-muted-foreground">
        {integer.format(point.count)} {noun}
      </p>
    </div>
  );
}

function ModelTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  const share = payload?.[0]?.payload as ModelShare | undefined;
  if (!active || !share) return null;

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground">{share.model}</p>
      <p className="mt-1 text-muted-foreground">
        {integer.format(share.count)} {share.count === 1 ? "prompt" : "prompts"} ·{" "}
        {formatPercent(share.percent)}
      </p>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-xl font-semibold text-foreground">
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        ) : null}
      </dd>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-dashed border-input bg-card px-6 py-14 text-center shadow-panel">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <BarChart3 className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Nenhum cálculo ainda</h2>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        Faça um cálculo na calculadora e os gráficos aparecem aqui automaticamente.
      </p>
      <Link to="/" className={cn(buttonVariants({ size: "lg" }), "mt-5 px-6")}>
        Ir para a calculadora
      </Link>
    </section>
  );
}
