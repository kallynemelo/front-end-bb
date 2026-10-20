import type { ReactNode } from "react";

import {
  Bot,
  ChevronRight,
  History,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logobb from "@/assets/icones/logobb.png";

export type AppSection = "chat" | "tools" | "profile";

export type RecentConversation = {
  id: string;
  title: string;
  preview: string;
};

type SidebarProps = {
  section: AppSection;
  collapsed?: boolean;
  recentConversations: RecentConversation[];
  activeConversationId?: string | null;
  onNavigate: (section: AppSection) => void;
  onNewConversation: () => void;
  onOpenConversation: (conversationId: string) => void;
  onToggleCollapse?: () => void;
  mobile?: boolean;
};

export function Sidebar({
  section,
  collapsed = false,
  recentConversations,
  activeConversationId,
  onNavigate,
  onNewConversation,
  onOpenConversation,
  onToggleCollapse,
  mobile = false,
}: SidebarProps) {
  const isCompact = collapsed && !mobile;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        isCompact ? "w-[76px]" : "w-[280px]",
        mobile && "w-full border-r-0",
      )}
    >
      <div className={cn("flex h-18 items-center gap-3 border-b border-sidebar-border px-4", isCompact && "justify-center px-2")}> 
        <button
          type="button"
          onClick={() => onNavigate("chat")}
          className={cn("flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow", isCompact && "justify-center")}
          aria-label="Ir para a conversa"
        >
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-yellow shadow-sm">
            <img src={logobb} alt="Banco do Brasil" className="h-full w-full object-cover" />
          </span>
          {!isCompact ? (
            <span className="min-w-0 text-left">
              <strong className="block truncate text-sm font-semibold text-white">ImpactaIA</strong>
              <span className="block truncate text-xs text-sidebar-muted">Assistente conversacional</span>
            </span>
          ) : null}
        </button>
        {!mobile && !isCompact ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onToggleCollapse}
            className="ml-auto text-sidebar-muted hover:bg-white/10 hover:text-white"
            aria-label="Recolher menu lateral"
          >
            <PanelLeftClose />
          </Button>
        ) : null}
      </div>

      <div className={cn("px-3 pt-3", isCompact && "px-2")}> 
        {isCompact ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            className="w-full bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90"
            aria-label="Nova conversa"
          >
            <MessageSquarePlus />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNewConversation}
            className="h-11 w-full justify-start rounded-xl bg-brand-yellow px-3 font-semibold text-brand-blue shadow-none hover:bg-brand-yellow/90"
          >
            <MessageSquarePlus />
            Nova conversa
          </Button>
        )}
      </div>

      <nav className={cn("mt-3 space-y-1 px-3", isCompact && "px-2")} aria-label="Navegação principal">
        <SidebarButton
          active={section === "chat"}
          collapsed={isCompact}
          icon={<Bot />}
          label="Conversar"
          onClick={() => onNavigate("chat")}
        />
        <SidebarButton
          active={section === "tools"}
          collapsed={isCompact}
          icon={<Wrench />}
          label="Ferramentas"
          onClick={() => onNavigate("tools")}
        />
      </nav>

      {!isCompact ? (
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">Recentes</span>
            <History className="size-3.5 text-sidebar-muted" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            {recentConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onOpenConversation(conversation.id)}
                className={cn(
                  "group w-full rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow",
                  activeConversationId === conversation.id && section === "chat"
                    ? "bg-white/10 text-white"
                    : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="block truncate text-sm font-medium">{conversation.title}</span>
                <span className="mt-0.5 block truncate text-xs opacity-70">{conversation.preview}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-start justify-center pt-4">
          <Sparkles className="size-4 text-sidebar-muted" aria-hidden="true" />
        </div>
      )}

      <div className={cn("border-t border-sidebar-border p-3", isCompact && "px-2")}> 
        <SidebarButton
          active={section === "profile"}
          collapsed={isCompact}
          icon={<UserRound />}
          label="Perfil e preferências"
          onClick={() => onNavigate("profile")}
        />
        {!isCompact ? (
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="mt-2 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
          >
            <Avatar className="size-9 border border-white/15">
              <AvatarFallback className="bg-brand-yellow text-xs font-bold text-brand-blue">UB</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-medium text-white">Usuário BB</strong>
              <span className="block truncate text-xs text-sidebar-muted">Conta demonstração</span>
            </span>
            <Settings className="size-4 text-sidebar-muted" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="mt-2 flex w-full justify-center rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
            aria-label="Abrir perfil"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-brand-yellow text-xs font-bold text-brand-blue">UB</AvatarFallback>
            </Avatar>
          </button>
        )}
        {!mobile && isCompact ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onToggleCollapse}
            className="mt-2 w-full text-sidebar-muted hover:bg-white/10 hover:text-white"
            aria-label="Expandir menu lateral"
          >
            <PanelLeftOpen />
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

type SidebarButtonProps = {
  active: boolean;
  collapsed: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

function SidebarButton({ active, collapsed, icon, label, onClick }: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow [&_svg]:size-4",
        collapsed && "justify-center px-0",
        active ? "bg-white/10 text-white" : "text-sidebar-muted hover:bg-white/5 hover:text-white",
      )}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      {!collapsed ? <span>{label}</span> : null}
      {!collapsed && active ? <ChevronRight className="ml-auto size-3.5 opacity-70" /> : null}
    </button>
  );
}
