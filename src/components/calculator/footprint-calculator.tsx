import { Calculator, Check, Copy, Droplets, Eraser, Leaf, Zap } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, DEFAULT_MODEL, sendChat, type ChatResponse } from "@/lib/api/chat";
import { formatImpact } from "@/lib/format";
import { cn } from "@/lib/utils";

// "value" é o texto enviado ao back no campo "model". Confirme os nomes aceitos pelo back.
const MODELS = [
  { label: "GPT-3", value: DEFAULT_MODEL },
  { label: "Gemini", value: "gemini" },
];

const integer = new Intl.NumberFormat("pt-BR");

type CalculationResult = {
  prompt: string;
  data: ChatResponse;
};

export function FootprintCalculator() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);

  const cleanPrompt = prompt.trim();
  const canCalculate = cleanPrompt.length > 0 && !isCalculating;
  // Só mostra os tokens do prompt enquanto o texto não mudou desde o último cálculo.
  const promptTokens =
    result && result.prompt === cleanPrompt ? result.data.usage.promptTokens : null;

  async function calculate() {
    if (!canCalculate) return;

    setIsCalculating(true);
    setError(null);

    try {
      // POST /api/chat (proxy do Vite -> backend na porta 8080)
      const data = await sendChat(cleanPrompt, { model });
      setResult({ prompt: cleanPrompt, data });
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof ApiError ? caught.message : "Erro inesperado ao falar com o backend.",
      );
    } finally {
      setIsCalculating(false);
    }
  }

  function clear() {
    setPrompt("");
    setResult(null);
    setError(null);
    setCopied(false);
  }

  async function copyResult() {
    if (!result) return;
    const { environmentalImpact: impact, usage, model } = result.data;
    const text = [
      `Modelo: ${model}`,
      `Tokens: ${impact.totalTokens} (entrada ${usage.promptTokens}, saída ${usage.completionTokens})`,
      `Energia: ${formatImpact(impact.energyConsumedWh)} Wh`,
      `CO₂e: ${formatImpact(impact.carbonFootprintGrams)} g`,
      `Água: ${formatImpact(impact.waterConsumedMl)} mL`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void calculate();
    }
  }

  return (
    <section
      aria-label="Calculadora de pegada ecológica"
      className="mx-auto w-full max-w-6xl rounded-2xl border border-border bg-card p-4 shadow-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/60 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="model" className="text-sm font-medium text-foreground">
            IA
          </label>
          <select
            id="model"
            value={model}
            onChange={(event) => {
              setModel(event.target.value);
              setResult(null);
              setError(null);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
          >
            {MODELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            className="h-9 bg-muted-foreground text-white shadow-none hover:bg-muted-foreground/90"
            onClick={clear}
          >
            <Eraser />
            Limpar
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9 shadow-none"
          onClick={copyResult}
          disabled={!result}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copiado" : "Copiar resultado"}
        </Button>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-5">
        <div className="flex min-w-0 flex-col">
          <label htmlFor="prompt" className="mb-2 text-sm font-medium text-foreground">
            Prompt
          </label>
          <div className="flex h-72 flex-col overflow-hidden rounded-xl border border-input bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring lg:h-[calc(100dvh_-_23rem)] lg:min-h-64">
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva aqui o seu prompt..."
              className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              <span>{integer.format(prompt.length)} caracteres</span>
              <span className={cn(promptTokens !== null && "font-semibold text-primary")}>
                {promptTokens !== null
                  ? `${integer.format(promptTokens)} tokens de entrada`
                  : "Os tokens aparecem depois de calcular"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:pt-8">
          <Button
            type="button"
            size="lg"
            onClick={() => void calculate()}
            disabled={!canCalculate}
            aria-busy={isCalculating}
            className="h-11 w-full gap-2 px-6 text-base font-semibold lg:w-auto"
          >
            {isCalculating ? <Spinner aria-label="Calculando" /> : <Calculator />}
            Calcular
          </Button>
        </div>

        <div className="flex min-w-0 flex-col">
          <span id="result-label" className="mb-2 text-sm font-medium text-foreground">
            Resultado
          </span>
          <div
            role="region"
            aria-labelledby="result-label"
            aria-live="polite"
            className="h-72 overflow-y-auto rounded-xl border border-input bg-muted/40 p-4 lg:h-[calc(100dvh_-_23rem)] lg:min-h-64"
          >
            <ResultContent result={result} error={error} isCalculating={isCalculating} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Os resultados são estimativas e podem variar dependendo do modelo de IA, do prompt e de outros fatores.
      </p>
    </section>
  );
}

type ResultContentProps = {
  result: CalculationResult | null;
  error: string | null;
  isCalculating: boolean;
};

function ResultContent({ result, error, isCalculating }: ResultContentProps) {
  if (isCalculating) {
    return (
      <p className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
        <Spinner aria-label="Calculando" />
        Consultando o backend...
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        <strong className="block font-semibold">Não foi possível calcular</strong>
        <span className="mt-1 block">{error}</span>
      </div>
    );
  }

  if (!result) {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        O resultado da pegada ecológica será exibido aqui...
      </p>
    );
  }

  const { data } = result;
  const impact = data.environmentalImpact;

  const metrics = [
    { icon: Zap, label: "Energia", value: formatImpact(impact.energyConsumedWh), unit: "Wh" },
    { icon: Leaf, label: "CO₂e", value: formatImpact(impact.carbonFootprintGrams), unit: "g" },
    { icon: Droplets, label: "Água", value: formatImpact(impact.waterConsumedMl), unit: "mL" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <span className="text-xs font-medium text-muted-foreground">Tokens</span>
        <strong className="mt-1 block text-4xl font-semibold tracking-[-0.03em] text-primary">
          {integer.format(impact.totalTokens)}
        </strong>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            <dt>Entrada:</dt>
            <dd className="font-medium text-foreground">
              {integer.format(data.usage.promptTokens)}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Saída:</dt>
            <dd className="font-medium text-foreground">
              {integer.format(data.usage.completionTokens)}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Modelo:</dt>
            <dd className="font-medium text-foreground">{data.model}</dd>
          </div>
        </dl>
      </div>

      <ul className="grid gap-2">
        {metrics.map(({ icon: Icon, label, value, unit }) => (
          <li
            key={label}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-foreground">
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="size-4" />
              </span>
              {label}
            </span>
            <span className="text-right">
              <strong className="text-lg font-semibold text-foreground">{value}</strong>
              <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}