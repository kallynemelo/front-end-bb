import { ArrowUp, Paperclip, Sparkles } from "lucide-react";
import { useRef, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  className?: string;
  compact?: boolean;
};

export function ChatComposer({ value, onChange, onSubmit, className, compact = false }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const clean = value.trim();
    if (!clean) return;
    onSubmit(clean);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-[24px] border border-composer-border bg-card p-2 shadow-composer transition-shadow focus-within:shadow-composer-focus",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={compact ? 2 : 3}
        placeholder="Envie uma mensagem para o BB Inteligência"
        className={cn(
          "block w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground",
          compact ? "min-h-12 max-h-36" : "min-h-20 max-h-48",
        )}
        aria-label="Mensagem"
      />
      <div className="flex items-center justify-between gap-3 px-1 pb-1">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-secondary" aria-label="Anexar arquivo (demonstração)">
            <Paperclip />
          </Button>
          <span className="hidden items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground sm:flex">
            <Sparkles className="size-3.5 text-primary" />
            BB IA
          </span>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim()}
          className="rounded-full bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
          aria-label="Enviar mensagem"
        >
          <ArrowUp />
        </Button>
      </div>
    </form>
  );
}
