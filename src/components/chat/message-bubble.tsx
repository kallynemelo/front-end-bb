import { Bot, Copy, Droplets, Leaf, ThumbsDown, ThumbsUp, UserRound, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatImpact } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  metrics?: {
    tokens: number;
    waterMl: number;
    energyWh: number;
    carbonG: number;
    // Preenchidos quando a resposta vem do backend (POST /api/chat)
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
  };
  isError?: boolean;
};

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article className={cn("group mx-auto flex w-full max-w-3xl gap-3 px-4 py-5 sm:px-6", isUser && "justify-end")}> 
      {!isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Bot className="size-4" />
        </div>
      ) : null}

      <div className={cn("min-w-0", isUser ? "max-w-[82%]" : "flex-1")}> 
        <div
          className={cn(
            "text-[15px] leading-7",
            isUser
              ? "rounded-[22px] rounded-tr-md bg-user-message px-4 py-2.5 text-foreground"
              : "pt-0.5 text-foreground",
          )}
        >
          <p className={cn("whitespace-pre-wrap", message.isError && "text-destructive")}>
            {message.content}
          </p>
          {message.metrics ? <EnvironmentalMetrics metrics={message.metrics} /> : null}
        </div>

        {!isUser ? (
          <div className="mt-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <MessageAction label="Copiar resposta"><Copy /></MessageAction>
            <MessageAction label="Resposta útil"><ThumbsUp /></MessageAction>
            <MessageAction label="Resposta não útil"><ThumbsDown /></MessageAction>
          </div>
        ) : null}
      </div>

      {isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
          <UserRound className="size-4" />
        </div>
      ) : null}
    </article>
  );
}

function MessageAction({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:bg-secondary" aria-label={label}>
      {children}
    </Button>
  );
}

function EnvironmentalMetrics({ metrics }: { metrics: NonNullable<ChatMessage["metrics"]> }) {
  const cards = [
    { icon: Droplets, label: "Água", value: `${formatImpact(metrics.waterMl)} mL` },
    { icon: Zap, label: "Energia", value: `${formatImpact(metrics.energyWh)} Wh` },
    { icon: Leaf, label: "CO₂e", value: `${formatImpact(metrics.carbonG)} g` },
  ];

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <strong className="block text-sm text-primary">ImpactaIA</strong>
          <span className="text-xs text-muted-foreground">
            Estimativa ambiental da interação
            {metrics.model ? ` · ${metrics.model}` : ""}
            {metrics.promptTokens !== undefined && metrics.completionTokens !== undefined
              ? ` · ${metrics.promptTokens} entrada / ${metrics.completionTokens} saída`
              : ""}
          </span>
        </div>
        <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">{metrics.tokens} tokens</span>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-3">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card p-4">
            <Icon className="size-4 text-primary" />
            <span className="mt-2 block text-xs text-muted-foreground">{label}</span>
            <strong className="mt-0.5 block text-sm text-foreground">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
