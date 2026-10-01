import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Check,
  ChevronDown,
  FileText,
  Leaf,
  Menu,
  MessageCircleMore,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  WandSparkles,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Sidebar, type AppSection, type RecentConversation } from "@/components/app-shell/sidebar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { MessageBubble, type ChatMessage } from "@/components/chat/message-bubble";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ApiError, sendChat } from "@/lib/api/chat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BB Inteligência | Assistente conversacional" },
      {
        name: "description",
        content: "Interface conversacional demonstrativa com identidade visual inspirada no Banco do Brasil.",
      },
      { property: "og:title", content: "BB Inteligência" },
      {
        property: "og:description",
        content: "Uma experiência conversacional moderna preparada para ferramentas e futuras integrações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type ConversationTemplate = RecentConversation & {
  messages: ChatMessage[];
};

const conversations: ConversationTemplate[] = [
  {
    id: "credito-rural",
    title: "Crédito rural sustentável",
    preview: "Resumo de oportunidades e riscos",
    messages: [
      {
        id: "cr-1",
        role: "user",
        content: "Resuma as principais oportunidades em crédito rural sustentável.",
      },
      {
        id: "cr-2",
        role: "assistant",
        content:
          "As oportunidades se concentram em financiamento de tecnologias de baixo carbono, modernização de irrigação, recuperação de áreas produtivas e rastreabilidade. Para uma análise real, a aplicação ainda precisaria de uma fonte de dados e de integração com um backend; esta resposta é apenas uma demonstração de interface.",
      },
    ],
  },
  {
    id: "pegada-ia",
    title: "Pegada ambiental de IA",
    preview: "Estimativa de água, energia e CO₂e",
    messages: [
      {
        id: "pa-1",
        role: "user",
        content: "Qual seria o impacto ambiental estimado de um prompt de 600 caracteres?",
      },
      {
        id: "pa-2",
        role: "assistant",
        content:
          "Usei a ferramenta demonstrativa ImpactaIA para gerar uma estimativa simplificada. Os valores abaixo são apenas ilustrativos e variam conforme modelo, datacenter, região e infraestrutura.",
        metrics: { tokens: 516, waterMl: 1.4, energyWh: 2.83, carbonG: 1.23 },
      },
    ],
  },
  {
    id: "relatorio-executivo",
    title: "Relatório executivo",
    preview: "Estrutura curta para apresentação",
    messages: [
      {
        id: "re-1",
        role: "user",
        content: "Monte uma estrutura objetiva para um relatório executivo.",
      },
      {
        id: "re-2",
        role: "assistant",
        content:
          "Uma estrutura enxuta pode conter: contexto, objetivo, principais achados, indicadores-chave, riscos, recomendações e próximos passos. A interface está preparada para futuramente transformar essa conversa em um fluxo conectado a ferramentas reais.",
      },
    ],
  },
];

const promptSuggestions = [
  {
    icon: BarChart3,
    title: "Analisar cenário",
    text: "Resuma tendências do mercado financeiro brasileiro em tópicos.",
  },
  {
    icon: Leaf,
    title: "Medir impacto",
    text: "Estime a pegada ambiental deste prompt usando o ImpactaIA.",
  },
  {
    icon: FileText,
    title: "Criar documento",
    text: "Crie uma estrutura de relatório executivo com introdução e próximos passos.",
  },
  {
    icon: WandSparkles,
    title: "Organizar ideias",
    text: "Transforme minhas anotações em uma lista de prioridades objetiva.",
  },
];

function Index() {
  const [section, setSection] = useState<AppSection>("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const recentConversations = useMemo<RecentConversation[]>(
    () => conversations.map(({ id, title, preview }) => ({ id, title, preview })),
    [],
  );

  function navigate(nextSection: AppSection) {
    setSection(nextSection);
    setMobileMenuOpen(false);
  }

  function newConversation() {
    setSection("chat");
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setMobileMenuOpen(false);
  }

  function openConversation(conversationId: string) {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    setSection("chat");
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setInput("");
    setMobileMenuOpen(false);
  }

  async function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean || isSending) return;

    const stamp = Date.now();
    const userMessage: ChatMessage = { id: `user-${stamp}`, role: "user", content: clean };

    setMessages((current) => [...current, userMessage]);
    setActiveConversationId(null);
    setInput("");
    setIsSending(true);

    try {
      // POST http://localhost:8080/api/chat (via proxy do Vite em /api/chat)
      const data = await sendChat(clean);
      const assistantMessage: ChatMessage = {
        id: `assistant-${stamp}`,
        role: "assistant",
        content: `Requisição processada pelo modelo ${data.model}. O backend retornou apenas o consumo; veja a estimativa ambiental abaixo.`,
        metrics: {
          tokens: data.environmentalImpact.totalTokens,
          energyWh: data.environmentalImpact.energyConsumedWh,
          carbonG: data.environmentalImpact.carbonFootprintGrams,
          waterMl: data.environmentalImpact.waterConsumedMl,
          model: data.model,
          promptTokens: data.usage.promptTokens,
          completionTokens: data.usage.completionTokens,
        },
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Erro inesperado ao falar com o backend.";
      setMessages((current) => [
        ...current,
        { id: `error-${stamp}`, role: "assistant", content: message, isError: true },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-dvh min-h-[640px] overflow-hidden bg-background text-foreground">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar
          section={section}
          collapsed={sidebarCollapsed}
          recentConversations={recentConversations}
          activeConversationId={activeConversationId}
          onNavigate={navigate}
          onNewConversation={newConversation}
          onOpenConversation={openConversation}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader
          section={section}
          menuOpen={mobileMenuOpen}
          onMenuOpenChange={setMobileMenuOpen}
          onNavigate={navigate}
          onNewConversation={newConversation}
          onOpenConversation={openConversation}
          recentConversations={recentConversations}
          activeConversationId={activeConversationId}
        />

        {section === "chat" ? (
          <ChatWorkspace
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={sendMessage}
            isSending={isSending}
            onSuggestion={(text) => setInput(text)}
          />
        ) : null}
        {section === "tools" ? <ToolsView onUseTool={(prompt) => { setSection("chat"); setInput(prompt); }} /> : null}
        {section === "profile" ? <ProfileView /> : null}
      </div>
    </div>
  );
}

type MobileHeaderProps = {
  section: AppSection;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onNavigate: (section: AppSection) => void;
  onNewConversation: () => void;
  onOpenConversation: (conversationId: string) => void;
  recentConversations: RecentConversation[];
  activeConversationId: string | null;
};

function MobileHeader({
  section,
  menuOpen,
  onMenuOpenChange,
  onNavigate,
  onNewConversation,
  onOpenConversation,
  recentConversations,
  activeConversationId,
}: MobileHeaderProps) {
  return (
    <header className="flex h-15 shrink-0 items-center justify-between border-b border-border bg-card/95 px-3 backdrop-blur lg:hidden">
      <Sheet open={menuOpen} onOpenChange={onMenuOpenChange}>
        <SheetTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Abrir menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] max-w-[88vw] border-0 bg-sidebar p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <Sidebar
            mobile
            section={section}
            recentConversations={recentConversations}
            activeConversationId={activeConversationId}
            onNavigate={onNavigate}
            onNewConversation={onNewConversation}
            onOpenConversation={onOpenConversation}
          />
        </SheetContent>
      </Sheet>
      <div className="text-center">
        <strong className="block text-sm font-semibold text-primary">BB Inteligência</strong>
        <span className="block text-[11px] text-muted-foreground">Demonstração de interface</span>
      </div>
      <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => onNavigate("profile")} aria-label="Abrir perfil">
        <UserRound />
      </Button>
    </header>
  );
}

type ChatWorkspaceProps = {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: (value: string) => void;
  isSending: boolean;
  onSuggestion: (value: string) => void;
};

function ChatWorkspace({
  messages,
  input,
  onInputChange,
  onSend,
  isSending,
  onSuggestion,
}: ChatWorkspaceProps) {
  const isEmpty = messages.length === 0;

  if (isEmpty) {
    return (
      <main className="relative flex min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-8 text-center sm:mb-10">
              <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-brand-mark">
                <Sparkles className="size-5" />
              </span>
              <p className="text-sm font-medium text-primary">BB Inteligência</p>
              <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                Como posso ajudar hoje?
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Converse, organize ideias e acesse ferramentas em uma experiência preparada para futuras integrações.
              </p>
            </div>

            <ChatComposer value={input} onChange={onInputChange} onSubmit={onSend} disabled={isSending} />

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {promptSuggestions.map(({ icon: Icon, title, text }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => onSuggestion(text)}
                  className="group flex min-h-20 items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm font-semibold text-foreground">{title}</strong>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">
              Protótipo front-end: as respostas e ferramentas exibidas são mockadas e não representam uma integração ativa com sistemas do Banco do Brasil.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-0 flex-1 flex-col bg-chat-canvas">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-center border-b border-border/70 bg-chat-canvas/95 px-4 backdrop-blur">
          <button type="button" className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-foreground hover:bg-secondary">
            BB Inteligência <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 pb-36 pt-2 sm:pt-4">
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          {isSending ? (
            <p className="mx-auto max-w-3xl px-6 py-3 text-sm text-muted-foreground">Consultando o backend…</p>
          ) : null}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-chat-canvas via-chat-canvas to-transparent px-4 pb-3 pt-8 sm:px-6 sm:pb-5">
        <div className="mx-auto max-w-3xl">
          <ChatComposer compact value={input} onChange={onInputChange} onSubmit={onSend} disabled={isSending} />
          <p className="mt-2 text-center text-[10px] text-muted-foreground">Consumo e impacto ambiental retornados pelo backend (porta 8080).</p>
        </div>
      </div>
    </main>
  );
}

function ToolsView({ onUseTool }: { onUseTool: (prompt: string) => void }) {
  const tools = [
    {
      icon: Leaf,
      title: "ImpactaIA",
      description: "Estima de forma demonstrativa o consumo de água, energia e emissões associados a um prompt.",
      status: "Disponível",
      prompt: "Estime a pegada ambiental deste prompt usando o ImpactaIA.",
    },
    {
      icon: FileText,
      title: "Assistente de documentos",
      description: "Estrutura rascunhos, resumos e documentos a partir da conversa atual.",
      status: "Demonstração",
      prompt: "Crie uma estrutura objetiva para um relatório executivo.",
    },
    {
      icon: Search,
      title: "Pesquisa contextual",
      description: "Espaço preparado para futura conexão com bases internas ou fontes autorizadas.",
      status: "Em breve",
      prompt: "Pesquise informações relacionadas ao contexto desta conversa.",
    },
  ];

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary"><Wrench className="size-3.5" />Ferramentas</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Recursos que ampliam a conversa</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">A estrutura foi preparada para incorporar novas capacidades sem mudar o fluxo principal da aplicação.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map(({ icon: Icon, title, description, status, prompt }) => (
            <Card key={title} className="rounded-2xl border-border bg-card shadow-panel transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", status === "Disponível" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>{status}</span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
                <Button type="button" variant="outline" className="mt-5 h-10 w-full rounded-xl" onClick={() => onUseTool(prompt)} disabled={status === "Em breve"}>
                  <MessageCircleMore />Usar na conversa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

function ProfileView() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary"><Settings2 className="size-3.5" />Conta</span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Perfil e preferências</h1>
            <p className="mt-2 text-sm text-muted-foreground">Dados fictícios utilizados apenas para demonstrar a experiência da interface.</p>
          </div>
          <Avatar className="size-16 border-4 border-card shadow-md">
            <AvatarFallback className="bg-brand-yellow text-lg font-bold text-brand-blue">UB</AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <Card className="rounded-2xl border-border shadow-panel">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-base font-semibold">Informações da conta</h2>
              <div className="mt-5 divide-y divide-border">
                <ProfileField label="Nome" value="Usuário BB" />
                <ProfileField label="E-mail" value="usuario@exemplo.com" />
                <ProfileField label="Plano" value="Ambiente de demonstração" />
              </div>
              <Button type="button" variant="outline" className="mt-5 rounded-xl">Editar perfil</Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-panel">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-base font-semibold">Preferências</h2>
              <div className="mt-5 space-y-5">
                <PreferenceRow title="Respostas mais objetivas" description="Prioriza textos curtos e diretos." defaultChecked />
                <PreferenceRow title="Sugestões de ferramentas" description="Exibe atalhos de recursos durante a conversa." defaultChecked />
                <PreferenceRow title="Salvar histórico" description="Mantém conversas recentes disponíveis na sidebar." defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-panel sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Check className="size-4" /></span>
            <div>
              <h2 className="text-sm font-semibold">Arquitetura preparada para autenticação futura</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Nenhuma autenticação real foi adicionada. Esta área é um mock visual e pode ser conectada a dados reais quando o backend disponibilizar identidade e preferências.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[120px_1fr] sm:items-center sm:gap-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <strong className="text-sm font-medium text-foreground">{value}</strong>
    </div>
  );
}

function PreferenceRow({ title, description, defaultChecked }: { title: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} aria-label={title} />
    </div>
  );
}
