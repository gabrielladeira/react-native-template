#!/usr/bin/env bash
#
# Sensor computacional das specs (OpenSpec).
#
# Degrada com aviso quando o CLI não está instalado, em vez de quebrar o `verify`.
# Racional: um sensor que trava a máquina de quem ainda não instalou a ferramenta
# é um sensor que alguém remove do `verify` na primeira sexta-feira ruim — e aí
# você perde a detecção inteira. Melhor avisar e seguir.
#
# No CI o comportamento é o oposto: lá o CLI é instalado de propósito e a ausência
# é tratada como erro (OPENSPEC_REQUIRED=1).
#
set -uo pipefail
cd "$(dirname "$0")/.."

if ! command -v openspec >/dev/null 2>&1; then
  if [[ "${OPENSPEC_REQUIRED:-0}" == "1" ]]; then
    echo "openspec não encontrado e OPENSPEC_REQUIRED=1." >&2
    echo "Instale com: npm install -g @fission-ai/openspec@latest" >&2
    exit 1
  fi
  echo "· specs: openspec não instalado — validação pulada."
  echo "  Instale com: npm install -g @fission-ai/openspec@latest"
  exit 0
fi

if [[ ! -d openspec ]]; then
  echo "· specs: pasta openspec/ ausente — rode 'openspec init --tools claude'."
  exit 0
fi

openspec validate --all --strict --no-interactive
