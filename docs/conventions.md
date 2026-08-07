# Convenções

## Nomes

| Coisa | Padrão | Exemplo |
| --- | --- | --- |
| Componente / arquivo de componente | `PascalCase` | `ChatScreen.tsx` |
| Hook | `useAlgo` | `useMessages.ts` |
| Módulo não-componente | `camelCase` | `endpoints.ts`, `schemas.ts` |
| Rota (expo-router) | `kebab-case` / `[param]` | `app/pedido/[id].tsx` |
| Schema Zod | `<coisa>Schema` | `messageSchema` |
| Tipo derivado | `z.infer` do schema, nunca escrito à mão | `type Message = z.infer<typeof messageSchema>` |
| Booleano | `is` / `has` / `should` | `isExpired`, `hasNextPage` |

Imports usam o alias `@/` (mapeado para `src/`). Nada de `../../../`.

## Anatomia de uma feature

```
src/features/pedidos/
  api/endpoints.ts   # defineEndpoint — só declaração, zero lógica
  api/hooks.ts       # useQuery/useMutation — orquestra, não valida
  model/schemas.ts   # Zod + funções puras (ordenação, merge, cálculo)
  model/*.test.ts    # testes das funções puras
  store/*.ts         # Zustand, se houver estado de cliente
  ui/*.tsx           # componentes; sem chamada de rede direta
  index.ts           # reexporta APENAS o que outras camadas podem usar
```

Regra prática: se uma função tem `if` e não tem I/O, ela pertence a `model/` e tem teste.

## Erros

Toda falha de rede vira `ApiError` com um `kind` da taxonomia fechada
(`src/shared/api/errors.ts`). A UI **não** inspeciona status HTTP — usa `messageForError()`
de `@/shared/ui/ErrorView`, cujo `switch` é exaustivo por construção.

`kind: 'contract'` significa que o backend devolveu 2xx com corpo fora do schema.
Isso é bug, não caso de uso: não trate com fallback silencioso.

## Loading e estado vazio

Todo consumo de query trata explicitamente: `isPending`, `isError`, lista vazia, e o caso
com dado. Não renderize spinner infinito nem `data!`.

## Zustand

- Um store por preocupação, não um store global.
- Selecione fatias (`useSession((s) => s.user)`), nunca o objeto inteiro.
- Não guarde no store dado que já está no cache do TanStack Query.
- Ações assíncronas ficam no store; componentes só chamam.

## TanStack Query

- Toda key vem de `@/shared/query/keys.ts`. Sem array literal solto.
- Passe o `signal` do `queryFn` para `call()` — cancelamento é de graça.
- Mutations não fazem retry por padrão (evita ação duplicada).

## Acessibilidade

Todo elemento tocável tem `accessibilityRole` e rótulo. Campos de texto têm
`accessibilityLabel`. Isso é verificado no review (`.claude/skills/code-review`).

## Performance

- `FlatList`/`FlashList` para qualquer lista com tamanho não trivial; `keyExtractor` estável.
- Animações em Reanimated (worklets), nunca `Animated` do core em caminho crítico.
- Cuidado com `react-native-reanimated` e memória no Hermes V1 (ver `docs/adr/0005-*`).
