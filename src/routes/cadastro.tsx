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
import { AuthError, MIN_PASSWORD_LENGTH, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta | ImpactaIA" },
      { name: "description", content: "Crie sua conta no ImpactaIA." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") void navigate({ to: "/", replace: true });
  }, [status, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Digite a mesma senha nos dois campos.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await register(username, password);
    } catch (caught) {
      setError(
        caught instanceof AuthError ? caught.message : "Não foi possível criar a conta agora.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Criar conta"
        description="Preencha os dados para começar a calcular"
        footer={
          <>
            Já tem conta?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            id="username"
            label="Usuário"
            hint="De 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou underline."
          >
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9._\-]{3,30}"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="seu.usuario"
              className={authInputClass}
            />
          </FormField>

          <FormField
            id="password"
            label="Senha"
            hint={`Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Crie uma senha"
            />
          </FormField>

          <FormField id="confirm-password" label="Confirmar senha">
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a senha"
            />
          </FormField>

          <FormError message={error} />

          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="h-11 w-full text-base font-semibold"
          >
            {isSubmitting ? <Spinner aria-label="Criando conta" /> : null}
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}