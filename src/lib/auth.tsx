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
 * Autenticação real com o backend (porta 8080) usando JWT.
 *
 * - POST /api/auth/register  { username, password }          -> 201 { username }
 * - POST /api/auth/login     { username, password }          -> 200 { accessToken, tokenType, expiresIn }
 * - Demais rotas (/api/chat) exigem o header `Authorization: Bearer <accessToken>`.
 *
 * O token fica no localStorage e é conferido (expiração) ao abrir o app.
 */

export type User = { name: string; email: string };

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72; // limite do BCrypt no backend
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

const TOKEN_KEY = "impactaia:token";
const SESSION_EVENT = "impactaia:session-changed";

// Vazio => caminho relativo (/api/...) e o proxy do Vite cuida do resto.
const API_BASE_URL = ((import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "").replace(
  /\/$/,
  "",
);

type LoginResponse = { accessToken: string; tokenType: string; expiresIn: number };

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

/** Lê o `sub` (usuário) e o `exp` do payload do JWT. Não valida assinatura: quem valida é o backend. */
function decodeToken(token: string): { sub: string; exp: number } | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)),
    );
    const payload = JSON.parse(json) as { sub?: unknown; exp?: unknown };
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

function readValidToken(): { token: string; sub: string } | null {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const decoded = decodeToken(token);
    if (!decoded || decoded.exp * 1000 <= Date.now()) {
      window.localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return { token, sub: decoded.sub };
  } catch {
    return null;
  }
}

/** Token JWT atual (ou null se não há sessão / expirou). Usado pelas chamadas ao backend. */
export function getToken(): string | null {
  return readValidToken()?.token ?? null;
}

/** Encerra a sessão local (ex.: backend respondeu 401). */
export function clearSession() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sem acesso ao storage: nada a limpar.
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function saveToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    throw new AuthError("Não foi possível salvar a sessão no navegador. Verifique o armazenamento.");
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function toUser(username: string): User {
  return { name: username, email: username };
}

async function callAuth<T>(path: string, username: string, password: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new AuthError("Não foi possível conectar ao backend (porta 8080). Ele está em execução?");
  }

  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new AuthError("Dados inválidos. Confira usuário e senha.");
      case 401:
        throw new AuthError("Usuário ou senha incorretos. Confira os dados e tente de novo.");
      case 409:
        throw new AuthError("Esse nome de usuário já está em uso. Escolha outro.");
      case 429:
        throw new AuthError("Muitas tentativas. Aguarde alguns minutos e tente de novo.");
      default:
        throw new AuthError(`O backend respondeu com erro ${response.status}.`);
    }
  }

  return (await response.json().catch(() => {
    throw new AuthError("O backend retornou uma resposta inválida.");
  })) as T;
}

async function loginRequest(username: string, password: string) {
  const data = await callAuth<LoginResponse>("login", username, password);
  if (typeof data.accessToken !== "string" || !decodeToken(data.accessToken)) {
    throw new AuthError("O backend não retornou um token válido.");
  }
  saveToken(data.accessToken);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // O localStorage só existe no navegador; por isso a sessão é lida depois da hidratação.
  useEffect(() => {
    function syncSession() {
      const session = readValidToken();
      setUser(session ? toUser(session.sub) : null);
      setStatus(session ? "authenticated" : "unauthenticated");
    }

    syncSession();

    // Mantém várias abas sincronizadas e reage a token expirado / 401.
    function onStorage(event: StorageEvent) {
      if (event.key === TOKEN_KEY || event.key === null) syncSession();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(SESSION_EVENT, syncSession);

    // Derruba a sessão sozinha quando o token expira com o app aberto.
    const timer = window.setInterval(syncSession, 30_000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SESSION_EVENT, syncSession);
      window.clearInterval(timer);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const cleanUser = normalizeUsername(username);
    if (!cleanUser || !password) throw new AuthError("Informe usuário e senha.");
    await loginRequest(cleanUser, password);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const cleanUser = normalizeUsername(username);

    if (!USERNAME_PATTERN.test(cleanUser)) {
      throw new AuthError(
        "Usuário deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou underline.",
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AuthError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
      throw new AuthError(`A senha deve ter no máximo ${MAX_PASSWORD_BYTES} bytes.`);
    }

    await callAuth<{ username: string }>("register", cleanUser, password);
    // O cadastro não devolve token: entra em seguida com as mesmas credenciais.
    await loginRequest(cleanUser, password);
  }, []);

  const logout = useCallback(() => {
    clearSession();
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
