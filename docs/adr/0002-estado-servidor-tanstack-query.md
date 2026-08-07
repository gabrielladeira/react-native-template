# 0002 — TanStack Query para estado de servidor

**Status:** Aceito · 2026-08

## Contexto

O app é majoritariamente leitura de API REST com atualizações via socket. As opções
consideradas foram: Redux Toolkit + RTK Query, TanStack Query, e SWR.

## Decisão

TanStack Query v5 é a **única** fonte de verdade para dado que vem do servidor.
Estado de cliente fica no Zustand (ADR 0003) e nunca duplica dado de API.

## Consequências

- Cache, deduplicação, retry, paginação e invalidação vêm prontos e configurados num
  lugar só (`src/shared/query/client.ts`).
- A separação "servidor vs cliente" é uma regra simples o suficiente para um agente
  aplicar sem ambiguidade — o que é o critério principal aqui.
- Query keys centralizadas em `src/shared/query/keys.ts` tornam invalidação previsível.
- Eventos de socket escrevem no cache (`setQueryData`) em vez de criarem estado paralelo.
- **Custo:** o mental model de `staleTime`/`gcTime` precisa ser aprendido.

## Alternativa descartada

RTK Query resolveria o mesmo problema, mas traz junto o modelo de store do Redux para um
app que não precisa dele — mais boilerplate por endpoint e mais superfície para o agente
gerar código repetitivo e ligeiramente inconsistente.

## Quando reconsiderar

Se o app passar a ter estado de cliente altamente compartilhado e com lógica de transição
complexa (undo/redo, colaboração), o modelo de reducer centralizado volta a valer.
