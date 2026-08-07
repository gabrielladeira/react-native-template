# 0006 — Zod como validação obrigatória em toda fronteira de I/O

**Status:** Aceito · 2026-08

## Contexto

TypeScript não existe em runtime. Uma resposta de API tipada como `User` é só uma promessa;
se o backend mudar um campo, o app quebra longe da origem — e um agente vai "consertar"
o sintoma, não a causa.

## Decisão

Nenhum dado externo entra na aplicação sem passar por um schema Zod. Isso vale para:

- respostas HTTP (`Endpoint.response` é obrigatório em `defineEndpoint`)
- corpos de requisição (`Endpoint.body`)
- eventos de socket (`realtime.subscribe(type, schema, handler)`)
- valores lidos do MMKV (`createKvSlot`)
- configuração em `app.json > extra` (`src/shared/config/env.ts`)

Tipos TypeScript são **derivados** dos schemas (`z.infer`), nunca escritos em paralelo.

## Consequências

- Resposta 2xx fora do contrato vira `ApiError` com `kind: 'contract'` — um erro alto e
  específico, em vez de `undefined is not an object` três telas depois.
- O schema é documentação executável do contrato: é o que o agente lê para saber o formato.
- Um único schema define validação, tipo e mensagem de erro — não há como dessincronizar.
- **Custo:** ~1 schema por recurso e um pouco de overhead de parse. Aceitável.

## Quando reconsiderar

Se o parse aparecer em profile como gargalo em listas muito grandes, considere validar
só na borda de página em vez de item a item.
