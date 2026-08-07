# Estratégia de testes

O objetivo aqui não é cobertura por cobertura: é dar ao agente um **sensor** que
diferencia "compila" de "funciona".

## O que testar em cada camada

| Camada | Testar | Não testar |
| --- | --- | --- |
| `model/` (funções puras, schemas) | Sempre. Casos de borda, invariantes, rejeição de input inválido. | — |
| `shared/api/`, `shared/realtime/` | Contrato: mapeamento de status, quebra de schema, timeout, backoff. | Implementação interna do fetch |
| `api/hooks.ts` | Fluxos com efeito colateral (invalidação, optimistic update) | Que o TanStack Query funciona |
| `ui/` | Comportamento visível: o que o usuário vê e toca. Testing Library. | Snapshots de árvore inteira |
| Rotas | Fluxo E2E crítico (Maestro), poucos e escolhidos | Tudo |

## Limiares (em `package.json` → `jest.coverageThreshold`)

- Global: 60% de linhas — o piso, não a meta.
- `src/features/**/model/`: 90% — é onde mora a regra de negócio.
- `src/shared/api/`: 85% — é o ponto único de falha de toda a rede.

Se um limiar estiver atrapalhando, discuta o limiar; não escreva teste vazio para passar.

## Padrões

- **Zero mock de módulo interno.** Se precisou mockar `@/features/...` em um teste, o
  acoplamento está errado. Mocks legítimos: nativos (MMKV, SecureStore) — já feitos em
  `src/test/setup.ts`.
- **Rede é stub, não mock de função.** Use `stubFetch` (`src/test/fetchStub.ts`), que exercita
  o `call()` de verdade — inclusive a validação Zod. Para telas com muitas rotas, considere MSW.
- **Teste de contrato > teste de implementação.** O teste deve quebrar quando o backend mudar
  a resposta, não quando você renomear uma variável.
- **Sem `waitFor` sem asserção dentro.**

## E2E (opcional, recomendado quando o app amadurecer)

[Maestro](https://maestro.mobile.dev) — YAML declarativo, roda em simulador/emulador e em CI.
Comece por 3 fluxos: login, listar salas, enviar mensagem. Mais que isso vira manutenção.
