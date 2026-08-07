#!/usr/bin/env bash
# Bootstrap do projeto. Roda uma vez, na máquina do desenvolvedor.
#
# As versões no package.json são um ponto de partida; `npx expo install --fix`
# é a autoridade final sobre quais versões são compatíveis com o SDK.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Instalando dependências"
npm install

echo "==> Alinhando pacotes com o Expo SDK"
npx expo install --fix

echo "==> Verificando saúde do setup"
npx expo-doctor@latest || echo "(expo-doctor apontou avisos — revise acima)"

echo "==> Instalando OpenSpec (camada de SDD — ver docs/adr/0008)"
npm install -g @fission-ai/openspec@latest

if [[ ! -d openspec ]]; then
  echo "==> Inicializando OpenSpec para Claude Code"
  openspec init --tools claude
else
  echo "==> openspec/ já existe — rodando update"
  openspec update
fi

echo "==> Rodando os sensores"
npm run verify

cat <<'MSG'

Pronto.

Próximos passos:
  1. Ajuste app.json > expo.extra.apiBaseUrl e wsUrl para o seu backend.
  2. Gere o development build (MMKV e SecureStore não rodam em Expo Go):
       npm run ios      # ou: npm run android
  3. Instale as skills oficiais do Expo (opcional, recomendado):
       claude plugin install expo@claude-plugins-official
  4. Habilite o perfil expandido do OpenSpec para ganhar /opsx:verify
     (compara implementação x spec — é o sensor de comportamento):
       openspec config profile   # selecione os workflows
       openspec update
  5. Leia HARNESS.md (o loop do harness) e docs/adr/0008 (por que SDD).

Primeira mudança:  /opsx:explore  →  /opsx:propose  →  /opsx:apply

MSG
