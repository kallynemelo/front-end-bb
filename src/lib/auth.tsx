import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Autenticação de protótipo.
 *
 * O backend (porta 8080) ainda não expõe endpoints de login/cadastro, então as contas ficam no
 * localStorage do navegador. Para integrar com a API real, troque apenas o corpo de `login`,
 * `register` e `logout` neste arquivo — as telas continuam iguais.
 */

export type User = { name: string; email: string };

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type StoredUser = User & { passwordHash: string };

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const MIN_PASSWORD_LENGTH = 8;

const USERS_KEY = "impactaia:users";
const SESSION_KEY = "impactaia:session";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new AuthError(
      "Não foi possível salvar os dados no navegador. Verifique o armazenamento.",
    );
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Nunca guardamos a senha em texto puro, mesmo sendo um protótipo local. */
async function hashPassword(email: string, password: string): Promise<string> {
  const input = `${email}:${password}`;

  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback para contextos sem Web Crypto (ex.: http em rede local durante testes no celular).
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return `weak-${hash.toString(16)}`;
}

function toPublicUser({ name, email }: StoredUser): User {
  return { name, email };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // O localStorage só existe no navegador; por isso a sessão é lida depois da hidratação.
  useEffect(() => {
    function syncSession() {
      const email = readJson<string | null>(SESSION_KEY, null);
      const found = email
        ? readJson<StoredUser[]>(USERS_KEY, []).find((item) => item.email === email)
        : undefined;

      setUser(found ? toPublicUser(found) : null);
      setStatus(found ? "authenticated" : "unauthenticated");
    }

    syncSession();

    // Mantém várias abas sincronizadas (sair em uma aba sai em todas).
    function onStorage(event: StorageEvent) {
      if (event.key === SESSION_KEY || event.key === null) syncSession();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const cleanEmail = normalizeEmail(email);
    const users = readJson<StoredUser[]>(USERS_KEY, []);
    const found = users.find((item) => item.email === cleanEmail);
    const hash = await hashPassword(cleanEmail, password);

    if (!found || found.passwordHash !== hash) {
      throw new AuthError("E-mail ou senha incorretos. Confira os dados e tente de novo.");
    }

    writeJson(SESSION_KEY, found.email);
    setUser(toPublicUser(found));
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);

    if (cleanName.length < 2) throw new AuthError("Informe seu nome.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new AuthError("Informe um e-mail válido, como nome@email.com.");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AuthError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }

    const users = readJson<StoredUser[]>(USERS_KEY, []);
    if (users.some((item) => item.email === cleanEmail)) {
      throw new AuthError("Já existe uma conta com este e-mail. Entre ou use outro e-mail.");
    }

    const created: StoredUser = {
      name: cleanName,
      email: cleanEmail,
      passwordHash: await hashPassword(cleanEmail, password),
    };

    writeJson(USERS_KEY, [...users, created]);
    writeJson(SESSION_KEY, created.email);
    setUser(toPublicUser(created));
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Sem acesso ao storage: ainda assim encerramos a sessão em memória.
    }
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return context;
}
