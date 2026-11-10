import { nanoid } from "nanoid";

import type { ChatResponse } from "@/lib/api/chat";

/** Histórico de cálculos, separado por usuário e guardado no navegador. */

export type HistoryEntry = {
  id: string;
  createdAt: number;
  prompt: string;
  /** Prompt de saída informado pelo usuário (ausente em cálculos antigos). */
  output?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  energyConsumedWh: number;
  carbonFootprintGrams: number;
  waterConsumedMl: number;
};

// Guarda até 500 cálculos por usuário (o Dashboard usa até 90 dias de histórico).
const MAX_ENTRIES = 500;

function keyFor(email: string) {
  return `impactaia:history:${email}`;
}

export function loadHistory(email: string): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(keyFor(email));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(email: string, entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(keyFor(email), JSON.stringify(entries));
  } catch {
    // Armazenamento cheio ou bloqueado: o histórico é opcional, então não interrompe o cálculo.
  }
}

export function addHistoryEntry(email: string, prompt: string, output: string, data: ChatResponse) {
  const entry: HistoryEntry = {
    id: nanoid(),
    createdAt: Date.now(),
    prompt,
    ...(output ? { output } : {}),
    model: data.model,
    promptTokens: data.usage.promptTokens,
    completionTokens: data.usage.completionTokens,
    totalTokens: data.environmentalImpact.totalTokens,
    energyConsumedWh: data.environmentalImpact.energyConsumedWh,
    carbonFootprintGrams: data.environmentalImpact.carbonFootprintGrams,
    waterConsumedMl: data.environmentalImpact.waterConsumedMl,
  };

  save(email, [entry, ...loadHistory(email)].slice(0, MAX_ENTRIES));
}

export function removeHistoryEntry(email: string, id: string): HistoryEntry[] {
  const next = loadHistory(email).filter((item) => item.id !== id);
  save(email, next);
  return next;
}

export function clearHistory(email: string) {
  save(email, []);
}
