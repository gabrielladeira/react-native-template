# AGENTS.md

Este projeto mantém as instruções para agentes em **`CLAUDE.md`** (mesmo conteúdo,
independente do agente que você estiver usando). Leia `CLAUDE.md` primeiro.

Resumo mínimo, caso você não consiga abrir aquele arquivo:

- Rode `pnpm run verify` antes de declarar qualquer tarefa concluída.
- Camadas: `app/` → `src/features/` → `src/shared/`. Nunca o contrário.
- Todo endpoint REST passa por `defineEndpoint` + schema Zod (`src/shared/api/http.ts`).
- Sem `any`, sem `console.log`, sem `fetch` solto, sem import cruzado entre features.
- Mudança relevante começa por uma spec: `/opsx:propose` antes de codar. Bug e refactor, não.
- Detalhes em `docs/architecture.md`, `docs/conventions.md`, `docs/testing.md`, `docs/adr/`.

---

> O OpenSpec (`openspec init` / `openspec update`) escreve o bloco dele abaixo desta linha.
> **Mantenha o ponteiro acima no topo** — ele é o que impede um agente de tratar as instruções
> geradas como a única fonte de verdade do projeto.
