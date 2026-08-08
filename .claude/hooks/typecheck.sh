#!/usr/bin/env bash
# Sensor de fim de turno: impede o agente de encerrar com o projeto sem compilar.
set -uo pipefail

output=$(pnpm exec tsc --noEmit 2>&1)
status=$?

if [[ $status -ne 0 ]]; then
  {
    echo "tsc --noEmit falhou. O projeto não compila:"
    echo "$output" | head -40
    echo
    echo "Corrija os erros de tipo antes de encerrar. Depois rode: pnpm run verify"
  } >&2
  exit 2
fi

exit 0
