# ImpactaIA — Calculadora de impacto ambiental de IA

Projeto desenvolvido na **Residência Tecnológica do Porto Digital**, como parte de um projeto do **Banco do Brasil**.

O ImpactaIA é uma **calculadora de impacto ambiental do uso de inteligência artificial, baseada em tokens**. Você informa um **prompt de entrada** e o **prompt de saída** (a resposta da IA), e o sistema conta os tokens de cada um e estima a pegada ecológica **(energia, o CO₂e e a água)** consumidos.

Este repositório é o **front-end**. O cálculo é feito por um back-end separado em Java (Spring Boot).

## Funcionalidades

- **Login e cadastro** de usuários, com tela dividida: painel azul com a logo do Banco do Brasil e o nome ImpactaIA, e o formulário ao lado.
- **Calculadora** com seleção da IA (GPT ou Gemini), campo de prompt de entrada, campo de prompt de saída e botão **Calcular**.
- **Resultado** com tokens (entrada, saída e total), energia (Wh), CO₂e (g) e água (mL). Valores muito pequenos são mostrados em notação científica, como `2,19 × 10⁻⁷`.
- **Histórico** dos cálculos de cada usuário, com os dois prompts, os números de cada cálculo e o total acumulado. Dá para excluir um item ou limpar tudo.
- **Cabeçalho** nas páginas internas com o menu Calculadora e Histórico e, à direita, nome, e-mail e botão **Sair**.
- **Responsivo**: no celular o login empilha o painel azul sobre o formulário, e o menu do cabeçalho desce para uma segunda linha.

## Páginas

| Rota         | Descrição                                                   | Exige login |
| ------------ | ----------------------------------------------------------- | ----------- |
| `/login`     | Entrar na conta                                             | Não         |
| `/cadastro`  | Criar conta gratuita (nome, e-mail, senha de 8+ caracteres) | Não         |
| `/`          | Calculadora                                                 | Sim         |
| `/historico` | Cálculos já feitos pelo usuário logado                      | Sim         |

Quem não está logado e abre `/` ou `/historico` é enviado para `/login`.

## Tecnologias

- React 19 e TypeScript
- TanStack Start e TanStack Router (rotas baseadas em arquivos)
- TanStack Query
- Vite 8
- Tailwind CSS 4 e componentes shadcn/ui (Radix UI)
- Ícones: lucide-react

## Requisitos

- **Node.js 22** e npm 10 ou superior (front-end)
- **Java 25** (back-end, o `pom.xml` exige essa versão)

## Como rodar

### 1. Back-end

Na pasta do back-end (a que tem o `pom.xml`):

```bash
# Windows
mvnw.cmd spring-boot:run

# Linux e macOS
./mvnw spring-boot:run
```

O back sobe em `http://localhost:8080`. Na primeira vez, o Maven baixa as dependências, o que pode levar alguns minutos.

### 2. Front-end

Em outro terminal, na pasta do front-end:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

| Serviço   | Porta | URL                   |
| --------- | ----- | --------------------- |
| Front-end | 3000  | http://localhost:3000 |
| Back-end  | 8080  | http://localhost:8080 |

Se a porta 3000 estiver ocupada, o `npm run dev` falha em vez de trocar de porta (`strictPort`).

### Variáveis de ambiente

Em desenvolvimento não é preciso configurar nada. O Vite encaminha as chamadas `/api/*` para o back-end, sem problemas de CORS.

| Variável            | Onde vale                 | Padrão                  | Para que serve                                             |
| ------------------- | ------------------------- | ----------------------- | ---------------------------------------------------------- |
| `BACKEND_URL`       | `npm run dev` e `preview` | `http://localhost:8080` | Endereço do back-end para o proxy do Vite                  |
| `VITE_API_BASE_URL` | Build de produção         | vazio                   | Endereço do back-end quando o app roda sem o proxy do Vite |

Exemplo no PowerShell, com o back em outra porta:

```powershell
$env:BACKEND_URL="http://localhost:9090"; npm run dev
```

## Como o front conversa com o back

O front chama `POST /api/chat`.
```

**Modelos.** O back identifica o tipo pelo nome: qualquer modelo que contenha `gpt` usa o cálculo do GPT, e qualquer um que contenha `gemini` usa o do Gemini. A lista de opções do front fica em `MODELS`, no arquivo `src/components/calculator/footprint-calculator.tsx`.

**Prompt de saída.** O sistema não gera a resposta da IA. Você escreve ou cola o texto no campo, e o back conta os tokens dele. Se o campo ficar vazio, o back apenas estima os tokens de saída a partir do prompt de entrada.

## Contas e histórico (importante)

O back-end ainda não tem endpoints de login, cadastro ou histórico. Por isso, **hoje tudo isso fica salvo no navegador** (`localStorage`):

| Chave                       | Conteúdo                                       |
| --------------------------- | ---------------------------------------------- |
| `impactaia:users`           | Contas: nome, e-mail e hash da senha (SHA-256) |
| `impactaia:session`         | E-mail de quem está logado                     |
| `impactaia:history:<email>` | Histórico daquele usuário (até 100 cálculos)   |

Consequências:

- Uma conta criada em um navegador não existe em outro navegador ou computador.
- Limpar os dados do navegador apaga contas e históricos.
- Não é segurança real, serve para demonstração e para testar o fluxo das telas.

Para usar um back-end de verdade, troque as funções `login`, `register` e `logout` em `src/lib/auth.tsx` e as funções de `src/lib/history.ts` por chamadas à API. As telas não precisam mudar.

## Estrutura

```
src/
├── assets/icones/           logos do Banco do Brasil
├── components/
│   ├── app-shell/           cabeçalho, menu e proteção das páginas internas
│   ├── auth/                layout das telas de login e cadastro
│   ├── calculator/          calculadora de pegada ecológica
│   └── ui/                  componentes base (shadcn/ui)
├── lib/
│   ├── api/chat.ts          chamada ao back-end (POST /api/chat)
│   ├── auth.tsx             contas e sessão (localStorage)
│   ├── history.ts           histórico por usuário (localStorage)
│   └── format.ts            formatação dos números do impacto
├── routes/                  páginas: login, cadastro, index, historico
└── styles.css               cores e estilos globais
```

O arquivo `src/routeTree.gen.ts` é gerado automaticamente pelo TanStack Router ao rodar o projeto. Não edite à mão.

## Scripts

| Comando           | O que faz                          |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento (3000) |
| `npm run build`   | Build de produção                  |
| `npm run preview` | Serve o build localmente           |
| `npm run lint`    | Verifica o código com ESLint       |
| `npm run format`  | Formata o código com Prettier      |

## Aviso

Os resultados são **estimativas**. Eles dependem do modelo de IA, do tamanho do texto e dos fatores usados pelo back-end, e podem variar do consumo real.