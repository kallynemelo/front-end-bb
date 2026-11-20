import { Calculator, Check, Copy, Droplets, Eraser, ExternalLink, Leaf, Zap } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiError, DEFAULT_MODEL, sendChat, type ChatResponse } from "@/lib/api/chat";
import { useAuth } from "@/lib/auth";
import { formatImpact } from "@/lib/format";
import { addHistoryEntry } from "@/lib/history";
import { cn } from "@/lib/utils";

// "value" é o texto enviado ao back no campo "model". Confirme os nomes aceitos pelo back.
const MODELS = [
  { label: "GPT-3", value: DEFAULT_MODEL },
  { label: "Gemini", value: "gemini"},
  
];

const integer = new Intl.NumberFormat("pt-BR");

type ResultTab = "resultado" | "fontes";

type CalculationResult = {
  prompt: string;
  output: string;
  data: ChatResponse;
};

export function FootprintCalculator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [tab, setTab] = useState<ResultTab>("resultado");
  const resultRef = useRef<HTMLDivElement>(null);

  const cleanPrompt = prompt.trim();
  const cleanOutput = output.trim();
  const canCalculate = cleanPrompt.length > 0 && !isCalculating;
  // Só mostra os tokens do prompt enquanto o texto não mudou desde o último cálculo.
  const isCurrent =
    result !== null && result.prompt === cleanPrompt && result.output === cleanOutput;
  const promptTokens = isCurrent ? result.data.usage.promptTokens : null;
  const completionTokens = isCurrent ? result.data.usage.completionTokens : null;

  // Quando o resultado chega, leva a tela até ele (ele fica abaixo do prompt).
  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result]);

  async function calculate() {
    if (!canCalculate) return;

    setIsCalculating(true);
    setError(null);
    setTab("resultado");

    try {
      // POST /api/chat (proxy do Vite -> backend na porta 8080)
      const data = await sendChat(cleanPrompt, { model, completionText: cleanOutput });
      setResult({ prompt: cleanPrompt, output: cleanOutput, data });
      if (user) addHistoryEntry(user.email, cleanPrompt, cleanOutput, data);
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
    setOutput("");
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
          <ConfirmDeleteDialog
            onConfirm={clear}
            description="Os textos digitados e o resultado atual serão apagados."
          >
            <Button
              type="button"
              size="sm"
              className="h-9 bg-muted-foreground text-white shadow-none hover:bg-muted-foreground/90"
            >
              <Eraser />
              Limpar
            </Button>
          </ConfirmDeleteDialog>
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

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-col">
            <label htmlFor="prompt" className="mb-2 text-sm font-medium text-foreground">
              Prompt de entrada
            </label>
            <div className="flex h-40 flex-col overflow-hidden rounded-xl border border-input bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring lg:h-[calc((100dvh-26rem)/2)] lg:min-h-40">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva aqui o seu prompt de entrada..."
                className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                <span>{integer.format(prompt.length)} caracteres</span>
                <span className={cn(promptTokens !== null && "font-semibold text-primary")}>
                  {promptTokens !== null
                    ? `${integer.format(promptTokens)} tokens de entrada`
                    : "Os tokens de entrada aparecem depois de calcular"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <label htmlFor="output" className="mb-2 text-sm font-medium text-foreground">
              Prompt de saída
            </label>
            <div className="flex h-40 flex-col overflow-hidden rounded-xl border border-input bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring lg:h-[calc((100dvh-26rem)/2)] lg:min-h-28">
              <textarea
                id="output"
                value={output}
                onChange={(event) => setOutput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva ou cole aqui o prompt de saída (a resposta da IA)..."
                className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                <span>{integer.format(output.length)} caracteres</span>
                <span className={cn(completionTokens !== null && "font-semibold text-primary")}>
                  {completionTokens !== null
                    ? `${integer.format(completionTokens)} tokens de saída`
                    : "Os tokens de saída aparecem depois de calcular"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:self-center">
          <Button
            type="button"
            size="lg"
            onClick={() => void calculate()}
            disabled={!canCalculate}
            aria-busy={isCalculating}
            className="h-11 w-full gap-2 px-6 text-base font-semibold sm:w-auto"
          >
            {isCalculating ? <Spinner aria-label="Calculando" /> : <Calculator />}
            Calcular
          </Button>
        </div>

        <div className="flex min-w-0 flex-col">
          <div role="group" aria-label="Seções do resultado" className="mb-2 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              id="result-label"
              aria-pressed={tab === "resultado"}
              onClick={() => setTab("resultado")}
              className={cn("h-8 shadow-none", tab === "resultado" && "bg-accent")}
            >
              Resultado
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              id="sources-label"
              aria-pressed={tab === "fontes"}
              onClick={() => setTab("fontes")}
              className={cn("h-8 shadow-none", tab === "fontes" && "bg-accent")}
            >
              Fontes
            </Button>
            <MethodologyInfo />
          </div>
          <div
            ref={resultRef}
            role="region"
            aria-labelledby={tab === "resultado" ? "result-label" : "sources-label"}
            aria-live="polite"
            className="min-h-36 scroll-mb-4 rounded-xl border border-input bg-muted/40 p-4 lg:h-[calc(100dvh-23.5rem)] lg:min-h-66 lg:overflow-y-auto"
          >
            {tab === "resultado" ? (
              <ResultContent
                result={result}
                error={error}
                isCalculating={isCalculating}
                hasPrompt={cleanPrompt.length > 0}
              />
            ) : (
              <SourcesContent />
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Os resultados são estimativas e podem variar dependendo do modelo de IA, do prompt e de
        outros fatores.
      </p>
    </section>
  );
}

// Fatores do back-end (GptImpactStrategy / GeminiImpactStrategy). Se mudarem lá, mude aqui.
type ModelFactors = {
  family: "gpt" | "gemini";
  name: string;
  energyWhPerToken: number;
  carbonGPerWh: number;
  waterMlPerToken: number;
  tokenizer: string;
  // Regras de estimativa dos tokens de saída (GptCompletionEstimator / GeminiCompletionEstimator),
  // usadas só quando o prompt de saída vem vazio. Avaliadas na ordem; a última é o padrão.
  rules: { label: string; terms: string[]; mult: number; add: number }[];
  fallback: { mult: number; add: number };
};

const GPT_FACTORS: ModelFactors = {
  family: "gpt",
  name: "GPT",
  energyWhPerToken: 0.00004,
  carbonGPerWh: 0.00045,
  waterMlPerToken: 0.0022,
  tokenizer: "o tokenizador do GPT-4o (biblioteca jtokkit)",
  rules: [
    { label: "resumo/lista/sim ou não", terms: ["resuma", "liste", "sim ou não", "responda em uma palavra"], mult: 0.5, add: 20 },
    { label: "explicação/descrição", terms: ["explique", "detalhe", "descreva", "análise completa"], mult: 2.0, add: 100 },
    { label: "código", terms: ["código", "function", "classe", "implemente", "script"], mult: 2.5, add: 150 },
  ],
  fallback: { mult: 1.3, add: 50 },
};

const GEMINI_FACTORS: ModelFactors = {
  family: "gemini",
  name: "Gemini",
  energyWhPerToken: 0.00003,
  carbonGPerWh: 0.00043,
  waterMlPerToken: 0.002,
  tokenizer: "a aproximação de 3 caracteres por token",
  rules: [
    { label: "resumo/lista/sim ou não", terms: ["resuma", "liste", "sim ou não"], mult: 0.4, add: 15 },
    { label: "explicação/descrição", terms: ["explique", "detalhe", "descreva"], mult: 1.6, add: 80 },
    { label: "código", terms: ["código", "function", "classe", "implemente"], mult: 2.2, add: 120 },
  ],
  fallback: { mult: 1.1, add: 40 },
};

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });

function ModelMethodologies() {
  return (
    <div className="flex flex-col gap-3">
      {[GPT_FACTORS, GEMINI_FACTORS].map((f) => (
        <section key={f.family} className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-primary">{f.name}</h4>
          <dl className="mt-2 flex flex-col gap-2 text-xs leading-5">
            <div>
              <dt className="font-medium text-foreground">Contagem de tokens</dt>
              <dd className="text-muted-foreground">
                Entrada e saída são contadas com o {f.tokenizer}. Total = entrada + saída.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Saída vazia (estimativa)</dt>
              <dd className="flex flex-col gap-0.5 font-mono text-muted-foreground">
                {f.rules.map((r) => (
                  <span key={r.label}>
                    {r.label}: entrada × {decimal.format(r.mult)} + {r.add}
                  </span>
                ))}
                <span>
                  outros pedidos: entrada × {decimal.format(f.fallback.mult)} + {f.fallback.add}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Energia</dt>
              <dd className="font-mono text-muted-foreground">
                tokens × {decimal.format(f.energyWhPerToken)} Wh
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">CO₂e</dt>
              <dd className="font-mono text-muted-foreground">
                energia (Wh) × {decimal.format(f.carbonGPerWh)} g
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Água</dt>
              <dd className="font-mono text-muted-foreground">
                tokens × {decimal.format(f.waterMlPerToken)} mL
              </dd>
            </div>
          </dl>
        </section>
      ))}
    </div>
  );
}

const SOURCES: { title: string; description: string; url: string }[] = [
  {
    title: "OpenAI — o que são tokens e a regra \"1 token ≈ 4 caracteres\"",
    description: "Base do nosso fallback length / 4.0.",
    url: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
  },
  {
    title: "OpenAI — tokenizador oficial",
    description: "Para comparar os nossos números com o real.",
    url: "https://platform.openai.com/tokenizer",
  },
  {
    title: "tiktoken",
    description:
      "Biblioteca Python oficial da OpenAI; mostra os encodings cl100k_base e o200k_base que usamos no JTokkit.",
    url: "https://github.com/openai/tiktoken",
  },
  {
    title: "JTokkit",
    description:
      "Biblioteca Java que usamos no GptTokenizer (contagem precisa dos tokens de entrada do GPT).",
    url: "https://github.com/knuddelsgmbh/jtokkit",
  },
  {
    title: "Google — documentação de tokens do Gemini",
    description: "Regra de ~4 caracteres por token e a API countTokens.",
    url: "https://ai.google.dev/gemini-api/docs/tokens",
  },
  {
    title: "Google AI Studio",
    description: "Onde dá para ver a contagem real de tokens do Gemini e calibrar a nossa heurística.",
    url: "https://aistudio.google.com/",
  },
  {
    title: "SentencePiece (Google)",
    description: "Algoritmo de subwords, base do tokenizador do Gemini.",
    url: "https://github.com/google/sentencepiece",
  },
  {
    title: "Hugging Face — docs de tokenizadores",
    description: "BPE, WordPiece e Unigram.",
    url: "https://huggingface.co/docs/tokenizers",
  },
  {
    title: "minbpe (Karpathy)",
    description: "Implementa BPE do zero em ~100 linhas; ótimo para entender como funciona.",
    url: "https://github.com/karpathy/minbpe",
  },
];

function SourcesContent() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Fontes e referências</h3>
      <ul className="flex flex-col gap-2">
        {SOURCES.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-primary">{source.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                  {source.description}
                </span>
                <span className="mt-0.5 block break-all text-xs text-muted-foreground/80">
                  {source.url}
                </span>
              </span>
              <ExternalLink aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const METHODOLOGY_LABEL = "Conheça a metodologia utilizada";

/** Bolinha cinza com "!" depois do botão Fontes: tooltip ao passar o mouse e janela translúcida ao clicar. */
function MethodologyInfo() {
  return (
    <Dialog>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label={METHODOLOGY_LABEL}
                className="ml-auto  mr-2 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-500 bg-linear-to-b from-zinc-300 to-zinc-500 text-sm font-extrabold leading-none text-white shadow-sm transition hover:from-zinc-400 hover:to-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden="true">!</span>
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{METHODOLOGY_LABEL}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto border-border/60 bg-background/85 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Metodologia por modelo</DialogTitle>
          <DialogDescription>
            Como cada modelo conta os tokens e calcula energia, CO₂e e água.
          </DialogDescription>
        </DialogHeader>
        <ModelMethodologies />
      </DialogContent>
    </Dialog>
  );
}

type ResultContentProps = {
  result: CalculationResult | null;
  error: string | null;
  isCalculating: boolean;
  hasPrompt: boolean;
};

function ResultContent({ result, error, isCalculating, hasPrompt }: ResultContentProps) {
  if (isCalculating) {
    return (
      <p className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
        <Spinner aria-label="Calculando" />
        Carregando...
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
        {hasPrompt
          ? "Clique em Calcular para ver o resultado da pegada ecológica."
          : "Aguardando..."}
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