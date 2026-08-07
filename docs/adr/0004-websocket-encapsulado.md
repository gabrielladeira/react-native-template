# 0004 — WebSocket nativo encapsulado em `RealtimeClient`

**Status:** Aceito · 2026-08

## Contexto

O backend pode expor WebSocket puro ou socket.io. No momento da decisão isso ainda não
estava fechado, e a escolha não deveria vazar para as features.

## Decisão

Implementar `src/shared/realtime/client.ts` com a `WebSocket` nativa do RN, expondo uma
interface pequena e estável: `connect`, `disconnect`, `subscribe(type, schema, handler)`,
`send`, `onStateChange`.

O protocolo é um envelope `{ type, payload }`. Todo payload é validado por Zod antes de
chegar ao handler.

## Consequências

- Se o backend for socket.io, troca-se **só** o interior desta classe — nenhuma feature muda.
- Reconexão com backoff exponencial + jitter total, exportada como `backoffDelay()` para
  ser testável de forma determinística.
- Heartbeat aplicativo (`ping`/`pong`) a cada 25s detecta conexão morta que o TCP não detecta.
- Evento fora do schema é logado e **descartado**, não propagado.
- **Custo:** funcionalidades do socket.io (rooms, ACK, fallback para long-polling) precisariam
  ser reimplementadas ou a decisão revista.

## Quando reconsiderar

Assim que o contrato do backend estiver fechado. Se for socket.io, substitua a implementação
interna por `socket.io-client` e mantenha a interface.
