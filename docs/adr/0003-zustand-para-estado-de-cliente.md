# 0003 — Zustand para estado de cliente

**Status:** Aceito · 2026-08

## Contexto

Sobra pouco estado depois que o TanStack Query cuida do servidor: sessão, preferências,
estado efêmero de UI compartilhado entre telas.

## Decisão

Zustand v5, com `persist` apoiado no MMKV (`zustandKvStorage`). Um store por preocupação.

## Consequências

- Sem provider, sem boilerplate: um agente consegue criar um store novo corretamente a
  partir de um exemplo curto.
- `partialize` controla explicitamente o que é persistido — tokens **não** são
  (ficam no SecureStore, ver ADR 0005).
- Seleção por fatia evita re-render desnecessário. É convenção verificada em review.
- **Custo:** menos estrutura significa que a disciplina precisa vir do harness, não da
  biblioteca. Daí a regra explícita "não duplique dado de API em store".

## Quando reconsiderar

Se surgirem muitos stores com dependências entre si, avalie Jotai (atômico) ou consolidar
em Redux Toolkit.
