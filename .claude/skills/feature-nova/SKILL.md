---
name: feature-nova
description: Criar uma feature nova no projeto seguindo a estrutura de fatia vertical (api/model/store/ui + index público). Use quando o pedido for "adicionar a feature X", "criar um módulo de Y", ou quando for necessária uma nova pasta em src/features/.
---

# Criar uma feature

## 0. Feature nova precisa de spec

Antes de criar pasta: rode `/opsx:propose` (ou `/opsx:explore` se o requisito estiver vago).
A spec é o contrato do que a feature deve fazer, e o `tasks.md` dela vira o seu roteiro.
Feature nova é o caso mais claro de "precisa de spec" na tabela do `CLAUDE.md`.

Se já existe uma mudança ativa, leia os artefatos dela e siga o `tasks.md` em vez de improvisar.

## 1. Confirme o escopo antes de escrever código

Responda para si mesmo (e pergunte ao humano se não souber):

- Qual domínio? O nome da pasta é o nome do domínio, em singular e kebab-case.
- Precisa de rede? Socket? Estado persistido? Tela?
- Alguma parte disso pertence a `src/shared/` porque outra feature vai usar?

## 2. Estrutura

Crie apenas o que a feature realmente usa:

```
src/features/<nome>/
  model/schemas.ts      # Zod + funções puras          (quase sempre)
  model/schemas.test.ts # testes das funções puras     (se houver função pura)
  api/endpoints.ts      # defineEndpoint               (se houver REST)
  api/hooks.ts          # useQuery / useMutation       (se houver REST)
  store/<nome>.ts       # Zustand                      (se houver estado de cliente)
  ui/<Tela>.tsx         # componentes                  (se houver UI)
  index.ts              # API pública                  (sempre)
```

Use `src/features/chat/` como referência viva — copie o formato, não o conteúdo.

## 3. Ordem de implementação

Nesta ordem, porque cada passo restringe o próximo:

1. `model/schemas.ts` — schemas Zod primeiro. Os tipos saem de `z.infer`, nunca escritos à mão.
2. Funções puras em `model/` + testes. Toda lógica com `if` e sem I/O mora aqui.
3. `api/endpoints.ts` — declaração com `defineEndpoint`. Zero lógica.
4. `api/hooks.ts` — keys vindas de `@/shared/query/keys.ts` (adicione a entrada lá).
5. `store/` se necessário.
6. `ui/` — trate `isPending`, `isError`, lista vazia e sucesso. Sem `data!`.
7. `index.ts` — exporte o mínimo. Se está em dúvida, não exporte.

## 4. Regras que o lint vai cobrar

- A feature **não pode** importar outra feature. Precisa de algo de outra? Suba para `src/shared/`.
- Só `src/shared/storage/*` importa MMKV / SecureStore / expo-sqlite.
- Sem `any`, sem `console.log`, sem cor ou espaçamento literal (use `theme`).

## 5. Antes de terminar

```bash
npm run verify
```

Se falhar, corrija a causa — não silencie a regra. Se a regra estiver genuinamente errada
para este caso, diga isso ao humano e proponha a mudança da regra num PR separado.
