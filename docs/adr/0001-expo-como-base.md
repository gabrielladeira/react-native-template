# 0001 — Expo (SDK 57) como base, com development build

**Status:** Aceito · 2026-08

## Contexto

O app precisa de módulos nativos (MMKV, SecureStore, SQLite), o que descarta o Expo Go
como ambiente de desenvolvimento. A alternativa era React Native CLI puro.

## Decisão

Usar Expo SDK 57 (React Native 0.86, React 19.2) com **Continuous Native Generation**
(`expo prebuild`) e **development build** (`expo-dev-client`). As pastas `ios/` e `android/`
são geradas e ficam no `.gitignore`.

## Consequências

- Upgrades de SDK viram `npx expo install expo@latest --fix` em vez de merge manual de
  arquivos nativos. Isso importa muito num fluxo com agente: menos superfície onde a IA
  pode errar de forma difícil de detectar.
- Config nativa é declarativa (`app.json` + config plugins), portanto revisável em diff.
- `expo-doctor` vira um sensor de saúde do setup, executável em CI.
- **Custo:** módulo nativo sem config plugin exige escrever um plugin ou sair da CNG.
- Expo Go não funciona neste projeto. Sempre `npm run ios` / `npm run android` (dev build).

## Quando reconsiderar

Se o app precisar embutir SDK nativo de terceiro sem config plugin e sem viabilidade de
escrever um, ou se for integrado a um app nativo existente (aí veja a skill `expo-brownfield`).
