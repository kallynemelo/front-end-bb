// Contrato com o backend (porta 8080) — POST /api/chat

export type ChatRole = "user" | "assistant" | "system";

export type ChatRequest = {
  model: string;
  messages: { role: ChatRole; content: string }[];
};

export type ChatResponse = {
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  environmentalImpact: {
    totalTokens: number;
    energyConsumedWh: number;
    carbonFootprintGrams: number;
    waterConsumedMl: number;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const DEFAULT_MODEL = "gpt-3";

// Vazio => caminho relativo (/api/chat) e o proxy do Vite cuida do resto.
const API_BASE_URL = ((import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "").replace(
  /\/$/,
  "",
);

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertChatResponse(data: unknown): asserts data is ChatResponse {
  const d = data as Partial<ChatResponse> | null;
  const ok =
    !!d &&
    typeof d.model === "string" &&
    !!d.usage &&
    isNumber(d.usage.promptTokens) &&
    isNumber(d.usage.completionTokens) &&
    isNumber(d.usage.totalTokens) &&
    !!d.environmentalImpact &&
    isNumber(d.environmentalImpact.totalTokens) &&
    isNumber(d.environmentalImpact.energyConsumedWh) &&
    isNumber(d.environmentalImpact.carbonFootprintGrams) &&
    isNumber(d.environmentalImpact.waterConsumedMl);
  if (!ok) throw new ApiError("Resposta do backend fora do formato esperado.");
}

export async function sendChat(
  content: string,
  options: { model?: string; signal?: AbortSignal } = {},
): Promise<ChatResponse> {
  const body: ChatRequest = {
    model: options.model ?? DEFAULT_MODEL,
    messages: [{ role: "user", content }],
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Não foi possível conectar ao backend (porta 8080). Ele está em execução?");
  }

  if (!response.ok) {
    throw new ApiError(`O backend respondeu com erro ${response.status}.`, response.status);
  }

  const data: unknown = await response.json().catch(() => {
    throw new ApiError("O backend retornou um corpo que não é JSON válido.", response.status);
  });
  assertChatResponse(data);
  return data;
}
