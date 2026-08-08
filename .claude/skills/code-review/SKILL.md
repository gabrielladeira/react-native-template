---
name: code-review
description: Revisar mudanças deste projeto contra o harness antes de abrir PR. Use quando o pedido for "revise minhas mudanças", "code review", "está pronto para PR?", ou depois de terminar uma implementação relevante.
---

# Review (sensor inferencial)

Este é o passo de julgamento semântico que os sensores computacionais não cobrem.
Rode **depois** de `pnpm run verify` passar — se não passou, não há o que revisar ainda.

## Como proceder

1. `git diff --stat` e depois `git diff` do que mudou. Revise só o diff, não o repositório.
2. Percorra as seções abaixo. Para cada achado, aponte **arquivo:linha**, o problema, e a
   correção concreta.
3. Classifique: **Bloqueia** / **Deveria corrigir** / **Nota**. Não misture os três num monte.
4. Se não achou nada relevante, diga isso claramente. Não invente achado para parecer útil.

## Aderência à spec

Se existe uma mudança ativa em `openspec/changes/<nome>/`, ela é o contrato desta revisão.
Leia `proposal.md` e `specs/` antes do diff (`openspec show <nome>`, `openspec status`).

- Cada requisito da spec tem implementação correspondente? Cite o que ficou de fora.
- Existe código no diff que **não** está na spec? Ou a spec está incompleta, ou é escopo
  clandestino. Diga qual dos dois.
- Os cenários da spec têm teste? Cenário sem teste é requisito sem sensor.
- `design.md` descreve algo que a implementação contradiz? Corrija o código ou o design —
  os dois divergentes é o pior estado possível.

Se não há mudança ativa: ou o trabalho não precisava de spec (bug, refactor, build — ver a
tabela em `CLAUDE.md`), ou alguém pulou o passo. Diga qual dos dois você acha que é.

## Correção

Perguntas que nenhum linter faz:

- A mudança faz o que o pedido pediu — nem menos, nem mais? Funcionalidade não solicitada é defeito.
- Existe caso de borda tratado por acidente (`?.`, `??`) em vez de decisão explícita?
- Algum `try/catch` engole erro sem tratar nem logar?
- Erro de contrato (`kind: 'contract'`) sendo tratado com fallback silencioso? Isso é bug mascarado.

## Contrato e dados

- Todo dado externo passa por Zod? (HTTP, socket, MMKV, `app.json > extra`)
- Algum schema foi afrouxado (`.optional()`, `.passthrough()`, `z.any()`) para "fazer passar"?
  Isso desliga o sensor. Questione.
- Tipos derivados de `z.infer`, ou escritos em paralelo ao schema (risco de dessincronizar)?

## Arquitetura

- Lógica de negócio dentro de componente ou de hook, em vez de função pura em `model/`?
- `index.ts` da feature exportando mais do que o necessário?
- Algo em `src/features/` que claramente pertence a `src/shared/` (ou o contrário)?
- Estado de servidor duplicado num store Zustand?

## Mobile especificamente

- Lista sem `FlatList`/`FlashList`, ou com `keyExtractor` instável (`index`)?
- Trabalho pesado no render, ou `useEffect` sem cleanup (subscription, timer, socket)?
- Elemento tocável sem `accessibilityRole` / rótulo?
- Diferença de comportamento iOS vs Android não considerada (permissões, teclado, safe area)?
- Segredo indo parar em MMKV, em log, ou em store persistido?

## Testes

- As funções puras novas têm teste? Os testes falhariam se a lógica quebrasse, ou só cobrem linha?
- Algum teste mocka módulo interno do projeto? Isso é sinal de acoplamento errado.
- Algum `eslint-disable` novo? Cada um precisa de justificativa no diff.

## Formato do relatório

```
## Bloqueia
- src/features/x/api/hooks.ts:34 — <problema>. <correção concreta>.

## Deveria corrigir
- ...

## Notas
- ...

## Sensores
verify: OK | falhou em <etapa>
spec:   aderente | divergências acima | não se aplica
```

## Feche o loop

Se você encontrou aqui um problema que um sensor **poderia** ter pego automaticamente,
diga isso no final e proponha a regra (lint, teste, dependency-cruiser). É assim que o
harness melhora — ver `HARNESS.md`.
