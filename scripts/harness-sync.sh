#!/usr/bin/env bash
#
# Mostra o que mudou no harness do template desde que este projeto nasceu.
#
# Templates apodrecem: o projeto derivado nunca recebe as melhorias que você fez
# no template depois. Este script não resolve isso automaticamente — de propósito.
# Merge automático de regra de lint e de doc de arquitetura quebra projeto sem
# avisar. Ele mostra o diff; a decisão de trazer cada pedaço é sua.
#
# Uso:
#   ./scripts/harness-sync.sh            # diff dos caminhos de harness
#   ./scripts/harness-sync.sh --stat     # só o resumo
#   ./scripts/harness-sync.sh --pull docs/architecture.md   # traz um caminho
#
set -euo pipefail
cd "$(dirname "$0")/.."

command -v git >/dev/null || { echo "git não encontrado." >&2; exit 1; }
[[ -f harness.json ]] || { echo "harness.json não encontrado." >&2; exit 1; }

TEMPLATE_URL=$(node -e 'process.stdout.write(require("./harness.json").template ?? "")')
BRANCH=${HARNESS_BRANCH:-main}

if [[ -z "$TEMPLATE_URL" || "$TEMPLATE_URL" == *SEU-USUARIO* ]]; then
  echo "Defina o campo \"template\" em harness.json com a URL do repositório do template." >&2
  exit 1
fi

# read -a em vez de mapfile: o bash padrão do macOS é 3.2 e não tem mapfile.
PATHS=()
while IFS= read -r line; do
  [[ -n "$line" ]] && PATHS+=("$line")
done < <(node -e '
  const paths = require("./harness.json").syncPaths ?? [];
  process.stdout.write(paths.join("\n"));
')
[[ ${#PATHS[@]} -gt 0 ]] || { echo "syncPaths vazio em harness.json." >&2; exit 1; }

if ! git remote get-url harness-template >/dev/null 2>&1; then
  echo "Adicionando remote 'harness-template' -> $TEMPLATE_URL"
  git remote add harness-template "$TEMPLATE_URL"
fi

echo "Buscando $BRANCH do template..."
git fetch --quiet harness-template "$BRANCH"
REF="harness-template/$BRANCH"

case "${1:-}" in
  --stat)
    git diff --stat "HEAD..$REF" -- "${PATHS[@]}"
    ;;
  --pull)
    [[ $# -ge 2 ]] || { echo "Uso: $0 --pull <caminho>" >&2; exit 1; }
    shift
    git checkout "$REF" -- "$@"
    echo "Trazido de $REF: $*"
    echo "Revise com 'git diff --cached' e rode 'pnpm run verify' antes de commitar."
    ;;
  *)
    echo
    echo "=== Diferenças no harness (seu projeto -> template) ==="
    echo "Nada é alterado por este comando. Para trazer algo: $0 --pull <caminho>"
    echo
    git --no-pager diff "HEAD..$REF" -- "${PATHS[@]}"
    ;;
esac
