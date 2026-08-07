---
name: api-endpoint
description: Adicionar ou alterar um endpoint REST com schema Zod, hook do TanStack Query e teste de contrato. Use quando o pedido envolver consumir uma rota da API, integrar um novo endpoint, ou mudar o formato de uma resposta.
---

# Adicionar um endpoint REST

Nunca chame `fetch` diretamente. O caminho é sempre: schema → endpoint → hook → teste.

## 1. Schema (`src/features/<f>/model/schemas.ts`)

```ts
export const pedidoSchema = z.object({
  id: z.string(),
  total: z.number().nonnegative(),
  criadoEm: z.iso.datetime(),
});
export type Pedido = z.infer<typeof pedidoSchema>;
```

Seja **estrito**: se o campo é obrigatório no backend, não use `.optional()` "por segurança".
Um schema frouxo esconde a quebra de contrato que ele deveria detectar.

## 2. Endpoint (`src/features/<f>/api/endpoints.ts`)

```ts
export const getPedido = defineEndpoint({
  method: 'GET',
  path: ({ id }: { id: string }) => `/pedidos/${id}`,
  response: pedidoSchema,
});

export const criarPedido = defineEndpoint({
  method: 'POST',
  path: () => '/pedidos',
  body: novoPedidoSchema,
  response: pedidoSchema,
});
```

- `path` sempre deriva dos params — nunca concatene string fora daqui.
- Query string vai em `query:`, não no `path`.
- `auth: false` só em rotas realmente públicas (login, refresh).
- Resposta 204 sem corpo: use `response: z.undefined()`.

## 3. Query key (`src/shared/query/keys.ts`)

Adicione a entrada. Nada de array literal solto no hook.

```ts
pedidos: {
  all: ['pedidos'] as const,
  detail: (id: string) => [...queryKeys.pedidos.all, 'detail', id] as const,
},
```

## 4. Hook (`src/features/<f>/api/hooks.ts`)

```ts
export function usePedido(id: string) {
  return useQuery({
    queryKey: queryKeys.pedidos.detail(id),
    queryFn: ({ signal }) => call(getPedido, { params: { id } }, { signal }),
  });
}
```

Sempre repasse o `signal`. Em mutations, invalide as keys afetadas no `onSuccess`.

## 5. Teste de contrato

Use `stubFetch` de `@/test/fetchStub` — ele exercita o `call()` real, incluindo a
validação Zod. No mínimo: caminho feliz e uma resposta que viola o schema.

## 6. Verificação

```bash
npm run verify
```

## Erros comuns que este harness detecta

| Sintoma | Causa | Onde corrigir |
| --- | --- | --- |
| `ApiError { kind: 'contract' }` | resposta 2xx fora do schema | ajuste o schema **ou** avise o backend — nunca afrouxe para `z.any()` |
| lint: "Não use MMKV direto" | import de infraestrutura fora de `shared/storage` | importe do módulo indicado na mensagem |
| lint: "Violação de camada" | import cruzado entre features | suba o código para `src/shared/` |
