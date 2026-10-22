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

## Como rodar

### Front-end

Em outro terminal, na pasta do front-end:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Como o front conversa com o back

O front chama `POST /api/chat`.

**Modelos.** O back identifica o tipo pelo nome: qualquer modelo que contenha `gpt` usa o cálculo do GPT, e qualquer um que contenha `gemini` usa o do Gemini. A lista de opções do front fica em `MODELS`, no arquivo `src/components/calculator/footprint-calculator.tsx`.

**Prompt de saída.** O sistema não gera a resposta da IA. Você escreve ou cola o texto no campo, e o back conta os tokens dele. Se o campo ficar vazio, o back apenas estima os tokens de saída a partir do prompt de entrada.

## Contas e histórico

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

```bash
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

## Aviso

Os resultados são **estimativas**. Eles dependem do modelo de IA, do tamanho do texto e dos fatores usados pelo back-end, e podem variar do consumo real.