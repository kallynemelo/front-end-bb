import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import logobb from "@/assets/icones/logobb.png";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { to: "/", label: "Calculadora", exact: true },
  { to: "/historico", label: "Histórico", exact: false },
  { to: "/dashboard", label: "Dashboard", exact: false },
] as const;

const navLinkClass =
  "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow data-[status=active]:bg-white/15 data-[status=active]:text-brand-yellow";

/** Layout das páginas internas: protege a rota e mostra o cabeçalho com menu e usuário. */
export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") void navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  if (status !== "authenticated") {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-primary">
        <Spinner aria-label="Carregando" className="size-6" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader />
      {children}
    </div>
  );
}

function AppHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="border-b-4 border-[#FCFC30] bg-[#465EFF] shadow-panel">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        {/* Coluna 1: logo */}
        <div className="flex min-w-0 items-center">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="ImpactaIA, início">
            <span className="flex h-10 w-18 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-yellow shadow-sm">
              <img src={logobb} alt="Banco do Brasil" className="h-full w-full object-contain" />
            </span>
            <strong className="text-lg font-semibold text-white">ImpactaIA</strong>
          </Link>
        </div>

        {/* Coluna 2: menu centralizado (só no desktop) */}
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className={navLinkClass}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Coluna 3: usuário e botão Sair */}
        <div className="flex min-w-0 items-center justify-end gap-3">
          <div className="hidden min-w-0 text-right leading-tight md:block">
            <strong className="block max-w-56 truncate text-sm font-semibold text-white">
              {user.name}
            </strong>
          </div>
          <span
            role="img"
            aria-label={user.name}
            title={user.name}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-semibold text-brand-blue md:hidden"
          >
            {initial}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={logout}
            className="h-9 shrink-0 border-white/70 bg-transparent px-3 text-white shadow-none hover:bg-white/10 hover:text-white focus-visible:ring-brand-yellow"
          >
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </div>
      </div>

      {/* Menu do celular: segunda linha */}
      <nav aria-label="Principal" className="border-t border-white/15 md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-1 px-4 py-1.5 sm:px-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className={navLinkClass}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}