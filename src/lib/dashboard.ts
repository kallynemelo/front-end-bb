import { formatImpact } from "@/lib/format";
import type { HistoryEntry } from "@/lib/history";

/** Cálculos do Dashboard: tudo é montado a partir do histórico salvo no localStorage. */

export type MetricKey = "energy" | "carbon" | "water" | "tokens";
export type PeriodDays = 7 | 30 | 90;

export const PERIODS: readonly PeriodDays[] = [7, 30, 90];

export const METRICS: Record<
  MetricKey,
  { label: string; unit: string; pick: (entry: HistoryEntry) => number }
> = {
  energy: { label: "Energia", unit: "Wh", pick: (entry) => entry.energyConsumedWh },
  carbon: { label: "Carbono", unit: "g CO₂e", pick: (entry) => entry.carbonFootprintGrams },
  water: { label: "Água", unit: "mL", pick: (entry) => entry.waterConsumedMl },
  tokens: { label: "Tokens", unit: "tokens", pick: (entry) => entry.totalTokens },
};

export type DayPoint = { key: string; label: string; value: number; count: number };
export type ModelShare = { model: string; count: number; percent: number };

function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayLabel(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Os últimos `days` dias (do mais antigo até hoje), sempre à meia-noite local. */
function lastDays(days: number, now: Date) {
  const today = startOfDay(now);
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (days - 1 - index));
    return day;
  });
}

export function filterByPeriod(entries: HistoryEntry[], days: number, now = new Date()) {
  const first = lastDays(days, now)[0];
  const start = first ? first.getTime() : 0;
  return entries.filter((entry) => entry.createdAt >= start);
}

/** Soma da métrica por dia (dias sem cálculo aparecem com 0). */
export function dailyTotals(
  entries: HistoryEntry[],
  days: number,
  pick: (entry: HistoryEntry) => number,
  now = new Date(),
): DayPoint[] {
  const points = new Map<string, DayPoint>(
    lastDays(days, now).map((day) => [
      dayKey(day),
      { key: dayKey(day), label: dayLabel(day), value: 0, count: 0 },
    ]),
  );

  for (const entry of entries) {
    const point = points.get(dayKey(new Date(entry.createdAt)));
    if (!point) continue;
    point.value += pick(entry);
    point.count += 1;
  }

  return [...points.values()];
}

/** Média de tokens por prompt em cada um dos últimos `days` dias. */
export function dailyAverageTokens(entries: HistoryEntry[], days: number, now = new Date()) {
  return dailyTotals(entries, days, (entry) => entry.totalTokens, now).map((point) => ({
    ...point,
    value: point.count > 0 ? point.value / point.count : 0,
  }));
}

/** Agrupa as variações do Gemini (gemini, gemini-mini...) em "gemini". */
export function modelKey(model: string) {
  return model.toLowerCase().startsWith("gemini") ? "gemini" : model;
}

export function modelShares(entries: HistoryEntry[]): ModelShare[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const key = modelKey(entry.model);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = entries.length;
  return [...counts.entries()]
    .map(([model, count]) => ({ model, count, percent: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

const MODEL_COLORS: Record<string, string> = {
  "gpt-3": "#3853ff",
  gemini: "#f08a24",
};
const FALLBACK_COLORS = ["#0f9d73", "#a855f7", "#64748b"];

export function colorForModel(model: string, index: number) {
  return MODEL_COLORS[model] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? "#64748b";
}

const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatMetric(metric: MetricKey, value: number) {
  return metric === "tokens" ? integer.format(value) : formatImpact(value);
}

export function formatPercent(value: number) {
  return `${percent.format(value)}%`;
}

/** Rótulo curto para o eixo Y (os valores de energia/água/CO₂ por prompt são muito pequenos). */
export function formatAxis(value: number) {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs < 1e-2 || abs >= 1e6) return value.toExponential(1).replace(".", ",").replace("e+", "e");
  return integer.format(value);
}
