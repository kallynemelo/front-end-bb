# ImpactaIA — Front-end conversacional

Protótipo front-end de uma experiência conversacional com identidade visual inspirada no Banco do Brasil. A aplicação usa React 19, TypeScript, Vite 8, TanStack Start/Router e Tailwind CSS 4, preservando a arquitetura original do projeto.

## O que foi implementado

A tela principal é uma **calculadora de pegada ecológica de IA**, em layout de duas colunas: à esquerda o campo para escrever o prompt (com contagem de caracteres e de tokens de entrada) e à direita o resultado (tokens, energia, CO₂e e água). O botão **Calcular** fica entre os dois campos. Há ainda os atalhos Carregar exemplo, Limpar e Copiar resultado.

O cálculo envia `POST /api/chat` ao backend (porta 8080) e exibe o consumo/impacto ambiental retornado. Não há autenticação.

## Requisitos

- Node.js 22.x recomendado
- npm 10.x ou compatível

## Executar localmente

```bash
npm install
npm run dev
```

| Serviço  | Porta | URL                   |
| -------- | ----- | --------------------- |
| Frontend | 3000  | http://localhost:3000 |
| Backend  | 8080  | http://localhost:8080 |

Copie `.env.example` para `.env`. Em desenvolvimento, deixe `VITE_API_BASE_URL` vazio: o Vite faz proxy de `/api/*` para `BACKEND_URL` (padrão `http://localhost:8080`), sem CORS. Se a porta 3000 estiver ocupada, o Vite falha (`strictPort`) em vez de trocar de porta.

## Validações

```bash
npm run build
npm run lint
```

## Estrutura preservada

O projeto continua utilizando o sistema de rotas e inicialização existentes. Não foram adicionadas novas dependências nem alteradas as versões principais das bibliotecas.
