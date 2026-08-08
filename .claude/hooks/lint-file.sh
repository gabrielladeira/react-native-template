#!/usr/bin/env bash
# Sensor mais à esquerda possível: roda a cada arquivo editado pelo agente.
# Corrige o que dá para corrigir sozinho e devolve o resto como texto que o
# agente lê e usa para se auto-corrigir (exit 2 = bloqueia e realimenta).
set -uo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | node -e '
  let raw = "";
  process.stdin.on("data", (c) => (raw += c));
  process.stdin.on("end", () => {
    try {
      const data = JSON.parse(raw);
      process.stdout.write(data?.tool_input?.file_path ?? "");
    } catch {
      process.stdout.write("");
    }
  });
' 2>/dev/null)

[[ -z "$file" ]] && exit 0
[[ "$file" =~ \.(ts|tsx)$ ]] || exit 0
[[ -f "$file" ]] || exit 0

output=$(pnpm exec eslint --fix --max-warnings=0 "$file" 2>&1)
status=$?

if [[ $status -ne 0 ]]; then
  {
    echo "ESLint reprovou $file. Corrija antes de continuar:"
    echo "$output"
    echo
    echo "Regras de camada e infraestrutura estão em eslint.config.js; o racional está em docs/architecture.md."
  } >&2
  exit 2
fi

exit 0
