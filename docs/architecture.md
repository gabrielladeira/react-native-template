# Arquitetura

## Camadas

```
app/                       rotas do expo-router (thin: só compõem telas)
  _layout.tsx              providers, boot, wiring
  index.tsx
  room/[id].tsx

src/features/<feature>/    fatia vertical, dona de um domínio
  api/endpoints.ts         declaração dos endpoints (defineEndpoint)
  api/hooks.ts             useQuery / useMutation da feature
  model/schemas.ts         schemas Zod, tipos e regras PURAS
  store/*.ts               estado de cliente da feature (Zustand)
  ui/*.tsx                 componentes e telas
  index.ts                 API PÚBLICA — o único ponto de entrada da feature

src/shared/                base reutilizável, não conhece features
  api/                     http client, taxonomia de erros
  realtime/                cliente WebSocket
  storage/                 kv (MMKV), secure (Keychain), db (SQLite)
  query/                   QueryClient e query keys
  ui/                      design system e tokens
  lib/                     utilitários puros
  config/                  env validado
```

## Regra de dependência

```
app/  ──►  src/features/  ──►  src/shared/
                │
                └─► (nunca outra feature)
```

Isso é **verificado, não sugerido**:

- `eslint-plugin-boundaries` (`eslint.config.js`) falha o lint em import ilegal, com mensagem
  explicando a correção.
- `dependency-cruiser` (`.dependency-cruiser.cjs`) pega ciclos e órfãos que atravessam arquivos.

Se uma regra atrapalhar um caso legítimo, **mude a regra num PR próprio** com justificativa —
não adicione `eslint-disable`.

## Por que fatias verticais e não `components/ hooks/ services/`

Pastas por tipo técnico crescem horizontalmente: uma feature nova toca cinco pastas e o
agente precisa segurar cinco lugares na cabeça. Fatia vertical dá **localidade**: tudo de
`chat` está em `src/features/chat/`. Isso reduz o contexto necessário por tarefa e torna
as regras de fronteira expressáveis (o que é o ponto do harness).

## Fluxo de dados

**REST**
`endpoints.ts` (contrato Zod) → `call()` (auth, timeout, taxonomia de erro, validação)
→ `hooks.ts` (TanStack Query, cache, retry) → componente.

**WebSocket**
`RealtimeClient` (reconexão + validação Zod) → `useRealtimeEvent` → hook da feature que
escreve **no cache do TanStack Query**. Não existe estado paralelo para dado que veio do socket.

**Storage**

| Precisa | Use | Onde |
| --- | --- | --- |
| Preferência, flag, cache leve, persist do Zustand | MMKV (síncrono) | `@/shared/storage/kv` |
| Token, refresh token, segredo | Keychain/Keystore | `@/shared/storage/secure` |
| Lista grande, histórico, offline queue, consulta | SQLite | `@/shared/storage/db` |
| Dado de servidor com TTL | cache do TanStack Query | `@/shared/query/client` |

## Boot

`app/_layout.tsx` faz, nesta ordem: `installAuthInterceptor()` → `hydrate()` da sessão →
`wireAppStateToQuery()` → `realtime.connect()`. Trocar a ordem quebra a autenticação do socket.

## Inversão de dependência da autenticação

`src/shared/api/http.ts` não pode importar `src/features/auth` (violaria a regra de camada).
Por isso o http expõe `configureAuth({ getToken, onUnauthorized })` e a feature auth se registra
no boot. Mesmo padrão vale para qualquer necessidade futura de shared → feature.
