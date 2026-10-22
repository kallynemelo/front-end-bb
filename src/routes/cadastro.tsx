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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") void navigate({ to: "/", replace: true });
  }, [status, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await register(name, email, password);
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
          <FormField id="name" label="Nome">
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Como você quer ser chamado(a)"
              className={authInputClass}
            />
          </FormField>

          <FormField id="email" label="E-mail">
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
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
