// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Frontend: porta 3000. Backend (API): porta 8080.
const FRONTEND_PORT = 3000;
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      port: FRONTEND_PORT,
      strictPort: true, // falha em vez de "pular" para outra porta (evita colidir com a 8080)
      proxy: {
        // O browser chama /api/* na porta 3000; o Vite encaminha para o backend na 8080.
        // Resultado: sem CORS em desenvolvimento.
        "/api": {
          target: BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        "/api": { target: BACKEND_URL, changeOrigin: true },
      },
    },
  },
});
