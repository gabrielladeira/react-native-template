#!/usr/bin/env bash
#
# Inicializa um projeto novo a partir deste template.
#
# Roda uma vez, logo depois de clonar. Renomeia o projeto, aponta as URLs para o
# seu backend e (opcionalmente) remove a feature de exemplo.
#
# Uso:
#   ./scripts/init.sh                       # interativo
#   ./scripts/init.sh --name "Meu App" --slug meu-app \
#     --bundle com.acme.meuapp --api https://api.acme.com --ws wss://api.acme.com/ws \
#     --remove-example --yes
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Valores atuais do template. init.sh faz busca-e-troca sobre eles.
# (O template usa defaults REAIS, não placeholders tipo __APP_NAME__, para que
#  `pnpm run verify` passe no próprio template — um template que não roda os
#  próprios sensores está quebrado e ninguém percebe.)
OLD_SLUG='rn-harness'
OLD_PKG='react-native-template'
OLD_BUNDLE='com.example.rnharness'
OLD_API='https://api.example.com'
OLD_WS='wss://api.example.com/ws'

NAME=''; SLUG=''; BUNDLE=''; API=''; WS=''
REMOVE_EXAMPLE=''; ASSUME_YES=''

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)           NAME="$2"; shift 2 ;;
    --slug)           SLUG="$2"; shift 2 ;;
    --bundle)         BUNDLE="$2"; shift 2 ;;
    --api)            API="$2"; shift 2 ;;
    --ws)             WS="$2"; shift 2 ;;
    --remove-example) REMOVE_EXAMPLE=1; shift ;;
    --keep-example)   REMOVE_EXAMPLE=0; shift ;;
    --yes|-y)         ASSUME_YES=1; shift ;;
    -h|--help)        sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "Opção desconhecida: $1" >&2; exit 1 ;;
  esac
done

ask() { # ask <var> <pergunta> <default>
  local __var="$1" __q="$2" __def="$3" __ans=''
  if [[ -n "${!__var}" ]]; then return; fi
  if [[ -n "$ASSUME_YES" ]]; then printf -v "$__var" '%s' "$__def"; return; fi
  read -r -p "$__q [$__def]: " __ans
  printf -v "$__var" '%s' "${__ans:-$__def}"
}

echo "== Inicialização do projeto =="
ask NAME   "Nome do app (exibido no device)" "Meu App"

DEFAULT_SLUG=$(printf '%s' "$NAME" | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-z0-9]\+/-/g; s/^-//; s/-$//')
ask SLUG   "Slug (kebab-case, usado em package.json e no scheme)" "$DEFAULT_SLUG"

DEFAULT_BUNDLE="com.example.$(printf '%s' "$SLUG" | tr -d '-')"
ask BUNDLE "Bundle id / package (iOS e Android)" "$DEFAULT_BUNDLE"
ask API    "URL base da API REST" "$OLD_API"
ask WS     "URL do WebSocket" "$OLD_WS"

# --- validação: falhar aqui é muito mais barato que falhar no build nativo ---
[[ "$SLUG"   =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || { echo "Slug inválido: use kebab-case." >&2; exit 1; }
[[ "$BUNDLE" =~ ^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$ ]] || { echo "Bundle id inválido: use com.empresa.app (sem hífen)." >&2; exit 1; }
[[ "$API"    =~ ^https?:// ]] || { echo "API deve começar com http:// ou https://" >&2; exit 1; }
[[ "$WS"     =~ ^wss?:// ]]   || { echo "WS deve começar com ws:// ou wss://" >&2; exit 1; }

SCHEME=$(printf '%s' "$SLUG" | tr -d '-')

if [[ -z "$REMOVE_EXAMPLE" ]]; then
  if [[ -n "$ASSUME_YES" ]]; then
    REMOVE_EXAMPLE=0
  else
    read -r -p "Remover a feature de exemplo (chat)? [s/N]: " r
    [[ "$r" =~ ^[sSyY]$ ]] && REMOVE_EXAMPLE=1 || REMOVE_EXAMPLE=0
  fi
fi

cat <<SUMMARY

  Nome ............ $NAME
  Slug ............ $SLUG
  Bundle id ....... $BUNDLE
  Scheme .......... $SCHEME
  API ............. $API
  WebSocket ....... $WS
  Remover exemplo . $([[ "$REMOVE_EXAMPLE" == 1 ]] && echo sim || echo não)

SUMMARY

if [[ -z "$ASSUME_YES" ]]; then
  read -r -p "Confirma? [S/n]: " c
  [[ "$c" =~ ^[nN]$ ]] && { echo "Cancelado."; exit 0; }
fi

# --- substituições ----------------------------------------------------------
# Restrito aos arquivos que realmente contêm os valores; nada de sed no repo todo.
TARGETS=(package.json app.json README.md CLAUDE.md docs/architecture.md docs/template.md harness.json)

replace() { # replace <de> <para>
  local from="$1" to="$2"
  [[ "$from" == "$to" ]] && return 0
  for f in "${TARGETS[@]}"; do
    [[ -f "$f" ]] || continue
    # delimitador | porque os valores contêm barras (URLs)
    perl -pi -e "s|\Q$from\E|$to|g" "$f"
  done
}

replace "$OLD_API"    "$API"
replace "$OLD_WS"     "$WS"
replace "$OLD_BUNDLE" "$BUNDLE"
replace "$OLD_PKG"    "$SLUG"
replace "$OLD_SLUG"   "$SLUG"

# "name" do app.json é o rótulo exibido: recebe o nome legível, não o slug.
perl -0pi -e "s/(\"expo\":\s*\{\s*\n\s*\"name\":\s*\")[^\"]*/\${1}$NAME/" app.json
# scheme não aceita hífen em alguns contextos nativos
perl -pi -e "s/(\"scheme\":\s*\")[^\"]*/\${1}$SCHEME/" app.json

# --- feature de exemplo -----------------------------------------------------
if [[ "$REMOVE_EXAMPLE" == 1 ]]; then
  rm -rf src/features/chat app/room
  cat > app/index.tsx <<'TSX'
import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/shared/ui/Screen';
import { theme } from '@/shared/ui/theme';

export default function HomeRoute() {
  return (
    <Screen>
      <Text style={styles.title}>Tudo pronto</Text>
      <Text style={styles.body}>
        Crie sua primeira feature com a skill `feature-nova`.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.color.text,
    fontSize: theme.font.xl,
    fontWeight: '700',
    padding: theme.space.md,
  },
  body: {
    color: theme.color.textMuted,
    fontSize: theme.font.md,
    paddingHorizontal: theme.space.md,
  },
});
TSX
  # queryKeys perde o namespace chat
  perl -0pi -e "s/\n  chat: \{.*?\n  \},//s" src/shared/query/keys.ts

  # Os guides apontavam para chat/ como referência viva. Guide apontando para
  # pasta que não existe é pior que guide nenhum: repontar para auth/.
  perl -pi -e 's|src/features/chat/|src/features/auth/|g' \
    docs/architecture.md .claude/skills/feature-nova/SKILL.md
  perl -pi -e 's|`chat` está em|`auth` está em|' docs/architecture.md
  perl -ni -e 'print unless m|^\s+room/\[id\]\.tsx\s*$|' docs/architecture.md

  echo "Feature de exemplo removida. src/features/auth/ continua como referência."
fi

# --- registro ---------------------------------------------------------------
if [[ -f harness.json ]]; then
  node -e '
    const fs = require("fs");
    const h = JSON.parse(fs.readFileSync("harness.json", "utf8"));
    h.project = process.argv[1];
    h.initializedAt = new Date().toISOString().slice(0, 10);
    fs.writeFileSync("harness.json", JSON.stringify(h, null, 2) + "\n");
  ' "$SLUG"
fi

echo
echo "Feito. Próximos passos:"
echo "  1. ./scripts/bootstrap.sh      # instala deps e roda os sensores"
echo "  2. pnpm run ios                # development build (Expo Go não serve)"
echo "  3. rm scripts/init.sh          # opcional: já cumpriu o papel"
echo
echo "Confira o diff antes de commitar:  git diff"
