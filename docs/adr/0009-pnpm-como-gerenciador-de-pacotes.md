# 0009 — pnpm como gerenciador de pacotes

**Status:** Aceito · 2026-08

## Contexto

O template usava npm (implícito, sem `packageManager` fixado). Em uma máquina limpa,
`npm install` falhou com `ERESOLVE` no par `react@19.2.0` / `react-native@0.86.0` × peer
dependency de `expo-linking`, exigindo `--force` ou `--legacy-peer-deps` — ambos escondem
incompatibilidades reais em vez de resolvê-las. O mesmo sintoma apareceu de outra forma no
hook de typecheck: `npx tsc` resolveu para o pacote `tsc` (abandonado, sem relação com o
TypeScript real) porque não havia `node_modules` para `npx` encontrar o binário do projeto.

## Decisão

pnpm é o gerenciador de pacotes do projeto, fixado via `"packageManager"` em
`package.json`. Todos os scripts internos (`verify`, `verify:full`), hooks
(`.claude/hooks/*.sh`), scripts de bootstrap/init e o workflow de CI passam a chamar
`pnpm run` / `pnpm exec` / `pnpm dlx` em vez de `npm run` / `npx`.

## Consequências

- `pnpm-lock.yaml` substitui `package-lock.json` como lockfile committado.
  `pnpm-workspace.yaml` também é committado — hoje só guarda a política de build scripts
  (`allowBuilds`, ver abaixo).
- **Correção (verificado com `pnpm peers check` após a migração):** o pnpm NÃO é mais
  estrito aqui — ele instala mesmo com peer dependencies incompatíveis e só avisa
  (`Issues with peer dependencies found`), enquanto o `npm install` original falhava
  (`ERESOLVE`) exigindo `--force`/`--legacy-peer-deps`. Ou seja, a troca resolveu o
  *sintoma* (instalar ficou possível) sendo **mais permissiva**, não mais rigorosa — e por
  isso é fácil não perceber que os conflitos continuam sem resolver. Rodar
  `pnpm peers check` mostrou pelo menos 5 pendências reais: `react@19.2.0` (react-native e
  `@react-native/jest-preset` querem `^19.2.3`), `expo-constants@18.0.13`
  (expo-router quer `^57.0.9`), `expo-linking@8.0.12` (expo-router quer `^57.0.5`),
  `react-native-screens@4.20.0` (expo-router quer `^4.26.0`) e
  `@react-native/jest-preset@0.86.2` (react-native quer exatamente `0.86.0`). Isso é dívida
  de versão pré-existente que a migração apenas deixou de bloquear a instalação, em vez de
  resolver — não foi corrigida nesta ADR. Rode `pnpm peers check` antes de assumir que o
  projeto está livre de conflito de versão.
- `pnpm exec <bin>` sempre resolve para o binário instalado localmente, eliminando a classe
  de erro que motivou esta ADR (`npx` buscando um pacote publicado com o mesmo nome do
  binário esperado).
- Por segurança, pnpm bloqueia scripts de build de dependências nativas por padrão
  (`pnpm approve-builds`). `unrs-resolver` (transitiva de lint) ficou sem build aprovado —
  não afetou `verify`; reavalie com `pnpm approve-builds` se algum sensor passar a depender
  dela.
- **A estrutura de `node_modules` do pnpm (pacotes reais vivem em
  `node_modules/.pnpm/<pkg>@<versão>/node_modules/<pkg>/`, não soltos em `node_modules/`)
  quebrou o `transformIgnorePatterns` do Jest em `package.json`.** O regex original
  assumia que o nome do pacote aparecia logo depois do primeiro `node_modules/` — verdade
  no layout plano do npm, falso no do pnpm. Corrigido trocando a checagem por uma busca
  tolerante a prefixo (`(?:.*/)?` antes da lista de pacotes permitidos) em vez de casar só
  logo após `node_modules/`. Qualquer nova dependência RN/Expo que precise ser transformada
  pelos testes entra nessa mesma lista.
- **Custo:** todo humano e agente que rodar comandos manualmente precisa trocar o hábito de
  digitar `npm`/`npx` por `pnpm`. CI e hooks já foram atualizados; documentação
  operacional (`README.md`, `HARNESS.md`, `CLAUDE.md`, `AGENTS.md`, `docs/template.md`,
  skills) também. ADRs já aceitos (0001, 0008) e `docs/sdd-comparativo.md` **não** foram
  editados — são registro histórico, e exemplos de comando ali devem ser lidos como pnpm.
- Pacotes Expo/RN continuam instalados via `pnpm exec expo install <pacote>`, nunca
  `pnpm add` direto — a regra já existia para npm (ver `CLAUDE.md`) e vale igual aqui.
- A migração expôs dívida que estava invisível porque ninguém tinha rodado `npm install`
  neste checkout: `expo-router` fixado numa faixa de versão inexistente (`~7.0.0`, corrigido
  para `~57.0.0`), `eslint.config.js` aplicando regras type-checked a `.cjs`/`.js` sem
  parser info, `@react-native/jest-preset` faltando como devDependency, e alguns
  `@typescript-eslint/require-await` em código de teste. Nada disso é causado pelo pnpm —
  só ficou visível porque `pnpm run verify` finalmente rodou de ponta a ponta.

## Quando reconsiderar

Se o time adotar monorepo com múltiplos apps compartilhando dependências, reavalie pnpm
workspaces (que já ganha, de graça) contra Turborepo/Nx antes de assumir que pnpm sozinho
resolve o problema.
