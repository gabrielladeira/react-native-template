---
name: debug-mobile
description: Investigar bugs específicos de mobile neste projeto — build nativo, Metro, socket que não conecta, storage, diferenças iOS/Android, upgrade de SDK. Use quando algo "não funciona no device/simulador" ou o erro não for um erro comum de JavaScript.
---

# Debug em mobile

Regra geral: **reduza antes de mudar**. Descubra em qual camada o problema está antes de
editar código.

## 1. Isole a camada

| Sintoma | Camada provável | Primeiro comando |
| --- | --- | --- |
| Erro só depois de instalar pacote | nativo / prebuild | `npx expo-doctor` |
| "Unable to resolve module" | Metro / alias | `npx expo start --clear` |
| Tela branca no boot | erro no `_layout` ou em `env.ts` | veja o log do Metro, não do device |
| Funciona no simulador, quebra no device | permissão / rede / release build | log nativo (Xcode / logcat) |
| Socket não conecta | token, URL, TLS | `realtime.getState()` + logs de `[realtime]` |
| Dado some ao reabrir o app | camada de storage errada | veja ADR 0005 |
| Divergência iOS × Android | API de plataforma | teste os dois; não assuma |

## 2. Comandos úteis

```bash
npx expo-doctor                 # incompatibilidade de versão, config quebrada
npx expo start --clear          # limpa cache do Metro
npx expo install --fix          # alinha deps com o SDK atual
npx expo prebuild --clean       # regenera ios/ e android/ do zero (peça antes de rodar)
npm run arch                    # ciclo de import travando o bundle
```

## 3. Erros conhecidos deste projeto

**`Configuração inválida em app.json > expo.extra`**
`src/shared/config/env.ts` falhou de propósito no boot. Corrija `app.json`, não o schema.

**`ApiError { kind: 'contract' }`**
Backend respondeu 2xx com corpo fora do schema. A mensagem tem o caminho exato do campo.
Decida: schema errado ou backend errado. Não afrouxe o schema para calar o erro.

**`ApiError { kind: 'timeout' }` só em device**
Backend em `localhost` não existe do ponto de vista do device. Use IP da máquina na rede.

**MMKV lança em runtime**
MMKV não roda em Expo Go. Use development build (`npm run ios` / `npm run android`).

**Memória alta com Reanimated**
Regressão conhecida do Hermes V1 no SDK 56/57 (importar `react-native-reanimated` aumenta
o uso de memória em 25–30%). Mitigação: habilitar *worklets bundle mode*.

## 4. Antes de encerrar

- Reproduza o bug num teste que falha, depois conserte. Se não der para testar, explique por quê.
- `npm run verify`.
- Se o bug tinha como ser pego por um sensor, proponha o sensor (ver `HARNESS.md`).
