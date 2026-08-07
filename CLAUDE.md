# Contexto do projeto

App mobile React Native (Expo SDK 57 / RN 0.86, New Architecture) que consome APIs REST,
mantém uma conexão WebSocket e guarda dados localmente.

Este arquivo é o **guia de entrada**. Ele é curto de propósito: detalhes ficam em
`docs/` e nas skills de `.claude/skills/`, carregados sob demanda.

## Comandos

| Objetivo | Comando |
| --- | --- |
| Verificação completa (rode antes de dizer que terminou) | `npm run verify` |
| Tipos | `npm run typecheck` |
| Lint (inclui regras de arquitetura) | `npm run lint` |
| Testes | `npm test` |
| Fitness de arquitetura (ciclos, órfãos) | `npm run arch` |
| Código morto | `npm run deadcode` |
| Saúde do setup Expo | `npm run doctor` |

**Nunca** considere uma tarefa concluída sem `npm run verify` passando.

## Arquitetura em uma frase

`app/` (rotas) → `src/features/<feature>/` (fatias verticais) → `src/shared/` (base).
As setas são unidirecionais e o ESLint bloqueia o contrário. Detalhes: `docs/architecture.md`.

## Regras não negociáveis

1. **Nada de `fetch` solto.** Todo endpoint é declarado com `defineEndpoint` em
   `src/features/<f>/api/endpoints.ts` e chamado por `call()`. Resposta sem schema Zod não entra.
2. **Nada de `any`.** Se o tipo é desconhecido, use `unknown` e valide com Zod.
3. **Features não importam features.** Código comum sobe para `src/shared/`.
4. **Segredos só no SecureStore** (`@/shared/storage/secure`). MMKV é para dados não sensíveis.
5. **Estado de servidor é do TanStack Query**; Zustand só para estado de cliente (UI, sessão, preferências).
   Não duplique dado de API em store.
6. **Sem `console.log`** — use `createLogger` de `@/shared/lib/logger`.
7. **Sem cor/espaçamento literal** em componentes — use `theme` de `@/shared/ui/theme`.
8. **Migration de SQLite é append-only**: adicione ao array em `src/shared/storage/db.ts`, nunca edite uma existente.

## Onde ler mais

- `docs/architecture.md` — camadas, dependências permitidas, onde cada coisa mora
- `docs/conventions.md` — nomes, estrutura de arquivo, padrões de erro e loading
- `docs/testing.md` — o que testar em cada camada e como
- `docs/adr/` — por que as escolhas foram feitas (leia antes de propor troca de biblioteca)
- `HARNESS.md` — como este harness funciona e como evoluí-lo
- `docs/template.md` — este repo é um template; o que é dele e o que é do projeto
- `docs/sdd-comparativo.md` — decisão pendente sobre framework de spec-driven development

## Spec-driven development (OpenSpec)

Mudança relevante começa por uma spec, não por código. Fluxo:
`/opsx:explore` (opcional, quando o requisito está vago) → `/opsx:propose` → revisar os
artefatos com o humano → `/opsx:apply` → `/opsx:verify` → `/opsx:archive`.

**Quando usar spec:**

| Trabalho | Spec? |
| --- | --- |
| Feature nova, mudança de contrato de API, fluxo de usuário | sim |
| Refactor sem mudança de comportamento | não — o teste já é a spec |
| Correção de bug | não — escreva o teste que falha |
| Build, lint, dependência | não |
| Decisão estrutural ("trocar X por Y") | ADR, não spec |

A spec descreve **comportamento**, não implementação. Se ela cita nome de arquivo ou biblioteca,
virou plano disfarçado e vai apodrecer no primeiro refactor.
Detalhes e racional: `docs/adr/0008-openspec-como-framework-de-sdd.md`.

## Skills disponíveis

- `feature-nova` — criar uma feature do zero na estrutura correta
- `api-endpoint` — adicionar um endpoint REST com schema, hook e teste
- `code-review` — revisar mudanças contra este harness antes de abrir PR
- `debug-mobile` — investigar bugs específicos de mobile (build nativo, socket, storage)

## Antes de propor uma dependência nova

Verifique em `docs/adr/` se já existe decisão sobre o assunto. Se a nova dependência
substituir algo existente, escreva um ADR justificando — não troque em silêncio.
Para pacotes Expo/RN use `npx expo install <pacote>` (resolve a versão compatível com o SDK),
nunca `npm install` direto.

## Limites

- Não rode `expo prebuild`, builds EAS, ou comandos que alterem `ios/`/`android/` sem pedir.
- Não edite arquivos em `ios/` ou `android/` — eles são gerados. Use config plugins.
- Não commite. Prepare a mudança e deixe a decisão de commit para o humano.
