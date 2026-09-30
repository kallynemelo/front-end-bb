# BB Inteligência — Front-end conversacional

Protótipo front-end de uma experiência conversacional com identidade visual inspirada no Banco do Brasil. A aplicação usa React 19, TypeScript, Vite 8, TanStack Start/Router e Tailwind CSS 4, preservando a arquitetura original do projeto.

## O que foi implementado

A tela principal foi reorganizada como uma aplicação conversacional com sidebar responsiva, nova conversa, histórico mockado, área principal de chat, sugestões de prompts, ferramentas e perfil do usuário. A funcionalidade ambiental existente foi preservada como a ferramenta demonstrativa **ImpactaIA**, integrada visualmente às respostas do chat.

Não há integração real com IA, autenticação ou backend nesta versão. As mensagens, conversas, dados do perfil e resultados das ferramentas são mocks de interface.

## Requisitos

- Node.js 22.x recomendado
- npm 10.x ou compatível

## Executar localmente

```bash
npm install
npm run dev
```

O Vite normalmente disponibiliza a aplicação em:

```text
http://localhost:5173
```

Caso a porta esteja ocupada ou o ambiente aplique uma configuração própria, utilize a URL exibida pelo Vite no terminal.

## Validações

```bash
npm run build
npm run lint
```

## Estrutura preservada

O projeto continua utilizando o sistema de rotas e inicialização existentes. Não foram adicionadas novas dependências nem alteradas as versões principais das bibliotecas.
