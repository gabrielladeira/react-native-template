# 0005 — Storage em três camadas com papéis distintos

**Status:** Aceito · 2026-08

## Contexto

"Armazenamento local" em mobile não é uma coisa só. Misturar tudo numa API única
(estilo AsyncStorage para tudo) é a origem clássica de vazamento de token e de gargalo
de performance.

## Decisão

Três camadas com fronteira explícita, cada uma com um único módulo de acesso:

| Camada | Biblioteca | Para quê | Módulo |
| --- | --- | --- | --- |
| Chave-valor rápido, **síncrono** | `react-native-mmkv` | preferências, flags, persist do Zustand | `@/shared/storage/kv` |
| Segredos | `expo-secure-store` (Keychain/Keystore) | access/refresh token | `@/shared/storage/secure` |
| Relacional / offline | `expo-sqlite` | histórico, listas grandes, outbox | `@/shared/storage/db` |

O ESLint proíbe importar essas bibliotecas diretamente fora dos módulos acima
(`no-restricted-imports`, com mensagem apontando o caminho certo).

## Consequências

- MMKV é síncrono, o que elimina a classe de bug de "estado ainda não hidratado" em boot.
- Token nunca aparece em MMKV nem em store persistido — a regra é verificável por lint
  e por review.
- Migrations de SQLite são versionadas por `user_version` e **append-only**: adicionar
  um item ao array é a única operação permitida.
- Todos os três são mockáveis num lugar só (`src/test/setup.ts`), então testes rodam em Node.
- **Custo:** MMKV exige development build (não funciona em Expo Go) — coerente com o ADR 0001.
- **Atenção:** `react-native-reanimated` + Hermes V1 tem regressão de memória conhecida no
  SDK 56/57; se aparecer, habilite o *worklets bundle mode*.

## Quando reconsiderar

Se o volume de dados relacionais crescer, avalie um ORM tipado sobre o SQLite
(Drizzle) — a fronteira já está pronta para isso, pois só `db.ts` muda.
