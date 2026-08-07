# react-native-template

App mobile React Native com um **harness** montado desde o dia zero: guias que orientam
agentes de código antes de agirem, e sensores que verificam o resultado depois.

- **Stack:** Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript estrito
- **Dados:** TanStack Query (servidor) · Zustand (cliente) · Zod (contratos)
- **Storage:** MMKV (rápido) · SecureStore (segredos) · SQLite (relacional/offline)
- **Realtime:** WebSocket encapsulado, com reconexão e validação por schema
- **Specs:** OpenSpec — mudança relevante começa por uma spec ([ADR 0008](docs/adr/0008-openspec-como-framework-de-sdd.md))

> **Este repo é um template.** Para um projeto novo: "Use this template" no GitHub, clone,
> e rode `./scripts/init.sh`. Detalhes em [`docs/template.md`](docs/template.md).

## Começar

```bash
./scripts/init.sh        # só em projeto novo: renomeia e aponta para o seu backend
./scripts/bootstrap.sh   # instala deps, alinha versões com o SDK, roda os sensores
```

Depois:

1. Ajuste `app.json` → `expo.extra.apiBaseUrl` e `wsUrl`.
2. Gere o development build — MMKV e SecureStore **não** rodam em Expo Go:
   ```bash
   npm run ios      # ou npm run android
   ```
3. `npm start` para o dia a dia.

## Comandos

| | |
|---|---|
| `npm run verify` | tipos + lint + arquitetura + specs + testes — **rode antes de todo PR** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, incluindo fronteiras de camada |
| `npm test` | Jest + Testing Library |
| `npm run arch` | dependency-cruiser: ciclos, órfãos, deps não declaradas |
| `npm run spec` | valida as specs do OpenSpec (pula com aviso se o CLI não estiver instalado) |
| `npm run deadcode` | knip |
| `npm run doctor` | expo-doctor |
| `./scripts/harness-sync.sh --stat` | o que mudou no harness do template desde este projeto |

## Estrutura

```
app/                  rotas (expo-router) — finas, só compõem telas
src/features/<f>/     fatias verticais: api · model · store · ui · index público
src/shared/           base: api · realtime · storage · query · ui · lib · config
docs/                 arquitetura, convenções, testes, ADRs
.claude/              skills e hooks do agente
scripts/              bootstrap
```

A regra de dependência (`app/` → `features/` → `shared/`, sem cruzar features) é
**verificada por lint**, não sugerida. Detalhes em [`docs/architecture.md`](docs/architecture.md).

## O harness

| Camada | Onde |
|---|---|
| Guias inferenciais | `CLAUDE.md`, `AGENTS.md`, `docs/`, `docs/adr/`, `.claude/skills/` |
| Guias computacionais | `tsconfig.json`, `defineEndpoint`, schemas Zod, `theme`, `queryKeys` |
| Sensores computacionais | `eslint.config.js`, `.dependency-cruiser.cjs`, Jest, `knip.json`, CI |
| Sensores inferenciais | skill `code-review`, `/opsx:verify` |
| Comportamento | `openspec/changes/<mudança>/` — spec como guide, `openspec validate` como sensor |
| Automação | `.claude/settings.json` (lint por arquivo editado; typecheck ao encerrar) |

O conceito, o racional de cada peça e como evoluir tudo isso está em
**[`HARNESS.md`](HARNESS.md)**.

## Fluxo de uma mudança

```
/opsx:explore      requisito vago? investigue antes de comprometer nada
/opsx:propose      gera proposal, specs, design e tasks — revise com o humano aqui
/opsx:apply        implementa as tasks
npm run verify     sensores computacionais (inclui openspec validate)
/code-review       sensor inferencial: aderência à spec + qualidade
/opsx:verify       implementação x artefatos (completude, correção, coerência)
/opsx:archive      arquiva e funde as specs delta nas specs vivas
```

Bug, refactor sem mudança de comportamento e ajuste de build **não** passam por spec —
a tabela de quando usar está no `CLAUDE.md`.

## Skills do projeto

| Skill | Para |
|---|---|
| `feature-nova` | criar uma feature na estrutura correta |
| `api-endpoint` | adicionar endpoint REST com schema, hook e teste |
| `code-review` | revisar mudanças contra o harness antes do PR |
| `debug-mobile` | investigar bugs de build nativo, socket, storage, plataforma |

Recomendado instalar também as skills oficiais do Expo — elas cobrem Expo Router, EAS,
upgrades e UI nativa muito melhor do que vale reescrever aqui:

```bash
claude plugin install expo@claude-plugins-official
```

## Decisões

Antes de trocar qualquer biblioteca, leia o ADR correspondente em
[`docs/adr/`](docs/adr/README.md). Cada um registra contexto, consequências e
**quando reconsiderar**.
