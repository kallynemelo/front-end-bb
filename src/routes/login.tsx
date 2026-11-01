import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import {
  AuthCard,
  AuthLayout,
  FormError,
  FormField,
  PasswordInput,
  authInputClass,
} from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AuthError, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | ImpactaIA" },
      { name: "description", content: "Acesse sua conta para calcular a pegada ecológica de IA." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quem já está logado não precisa ver o login de novo.
  useEffect(() => {
    if (status === "authenticated") void navigate({ to: "/", replace: true });
  }, [status, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await login(username, password);
    } catch (caught) {
      setError(caught instanceof AuthError ? caught.message : "Não foi possível entrar agora.");
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Bem-vindo(a) de volta"
        description="Acesse sua conta para continuar"
        footer={
          <>
            Não tem conta?{" "}
            <Link to="/cadastro" className="font-semibold text-primary hover:underline">
              Criar conta
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField id="username" label="Usuário">
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="seu.usuario"
              className={authInputClass}
            />
          </FormField>

          <FormField id="password" label="Senha">
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
            />
          </FormField>

          <FormError message={error} />

          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="h-11 w-full text-base font-semibold"
          >
            {isSubmitting ? <Spinner aria-label="Entrando" /> : null}
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
