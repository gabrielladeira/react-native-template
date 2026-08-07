# Usar e manter este template

Este repositório é um **harness template**: um pacote de guias e sensores amarrados a uma
topologia específica (app mobile Expo que consome REST, mantém socket e guarda dados locais).

A ideia por trás disso: um agente pode gerar quase qualquer coisa. Comprometer-se com uma
topologia estreita o espaço de saídas possíveis, e um espaço mais estreito é um espaço que dá
para governar bem. Escolher a stack pensando no harness que já existe para ela é uma decisão
legítima de engenharia, não preguiça.

---

## Criar um projeto novo

```bash
# 1. GitHub > "Use this template" > Create a new repository
git clone git@github.com:voce/seu-projeto.git && cd seu-projeto

# 2. Renomeia tudo e aponta para o seu backend
./scripts/init.sh

# 3. Instala, alinha versões com o SDK e roda os sensores
./scripts/bootstrap.sh

# 4. Development build (MMKV e SecureStore não rodam em Expo Go)
npm run ios     # ou npm run android
```

`init.sh` também aceita flags, para automação:

```bash
./scripts/init.sh --name "Acme Delivery" --slug acme-delivery \
  --bundle com.acme.delivery --api https://api.acme.com \
  --ws wss://api.acme.com/ws --remove-example --yes
```

O que ele faz: reescreve nome, slug, bundle id, scheme e URLs; opcionalmente remove a feature
de exemplo (`chat`) e a substitui por uma home vazia; registra a inicialização em `harness.json`.

Depois de rodar, confira `git diff` antes de commitar. E apague `scripts/init.sh` — ele já
cumpriu o papel e só confunde quem chegar depois.

---

## Por que o template usa valores reais, não placeholders

Um template cheio de `__APP_NAME__` não compila, não passa no lint e não roda os próprios
testes. Ou seja: **os sensores do template ficam desligados justamente no repositório onde eles
precisam estar mais afiados.** Você só descobre que quebrou alguma coisa depois que um projeto
derivado quebra.

Por isso o template usa defaults funcionais (`rn-harness`, `com.example.rnharness`,
`https://api.example.com`) e o `init.sh` faz busca-e-troca. O template roda `npm run verify`
como qualquer projeto — o CI dele é a garantia de que os projetos derivados nascem saudáveis.

Consequência prática: **se você mudar esses defaults, atualize as constantes `OLD_*` no topo do
`init.sh`.** É o único acoplamento frágil do arranjo.

---

## O que é do template e o que é do projeto

| Camada | Arquivos | Muda no projeto derivado? |
|---|---|---|
| **Harness** | `CLAUDE.md`, `AGENTS.md`, `HARNESS.md`, `docs/`, `.claude/`, `eslint.config.js`, `.dependency-cruiser.cjs`, `knip.json`, `tsconfig.json`, `.github/workflows/` | raramente — melhorias voltam para o template |
| **Base** | `src/shared/` | ocasionalmente — evoluções genéricas voltam para o template |
| **Produto** | `app/`, `src/features/` | sempre — é o projeto |
| **Config** | `app.json`, `harness.json`, `package.json` | no `init.sh` |

A lista canônica está em `harness.json > syncPaths`.

**Regra prática:** achou um problema que um sensor deveria ter pego? A correção pertence ao
template, não ao projeto onde você a descobriu. Senão cada projeto conserta a mesma coisa
sozinho e o template fica sendo o pior de todos.

---

## Trazer melhorias do template para um projeto existente

Templates apodrecem: o projeto derivado não recebe o que você melhorou no template depois.
Não existe solução mágica — merge automático de regra de lint e de doc de arquitetura quebra
projeto em silêncio. O que existe é tornar a divergência **visível e barata de resolver**:

```bash
./scripts/harness-sync.sh --stat                    # o que divergiu
./scripts/harness-sync.sh                           # diff completo
./scripts/harness-sync.sh --pull docs/architecture.md   # traz um caminho
npm run verify                                      # sempre, depois de puxar
```

O script adiciona o template como um remote git (`harness-template`) e compara só os caminhos
de harness. Ele nunca altera nada sozinho.

Hábito recomendado: rodar `--stat` a cada dois ou três meses, ou quando você lembrar de ter
melhorado algo no template.

---

## Evoluir o template

O template está sujeito ao mesmo loop de direção descrito em `HARNESS.md`:

```
erro se repetiu em dois projetos diferentes
        │
        ▼
que controle teria evitado?  →  entra no template
        │
        ▼
harnessVersion sobe, projetos puxam quando quiserem
```

**Versionamento** (`harness.json > harnessVersion`, semver informal):

- **patch** — texto de doc, mensagem de lint, exemplo. Puxar é seguro.
- **minor** — sensor ou skill novo. Puxar exige rodar `verify` e talvez corrigir violações.
- **major** — mudança estrutural (camada, convenção de pasta). Puxar é migração; escreva um ADR.

**Antes de aceitar qualquer coisa no template, pergunte:** isso vale para o *próximo* projeto,
ou é específico do projeto onde eu descobri? Template que absorve especificidade vira lixo
comum — e aí ninguém usa.

**Mantenha o próprio CI verde.** Um template com CI vermelho ensina projetos derivados a
conviverem com CI vermelho.

---

## SDD (OpenSpec)

Decidido — ver [`adr/0008-openspec-como-framework-de-sdd.md`](adr/0008-openspec-como-framework-de-sdd.md).
O `bootstrap.sh` instala o CLI e roda `openspec init --tools claude`, então cada projeto derivado
já nasce com a camada de specs.

O que **não** é gerado automaticamente e você deve fazer uma vez por projeto:

1. **`openspec/config.yaml`** — preencha o contexto de projeto com um **ponteiro** para o
   `CLAUDE.md`, nunca uma cópia das regras. Duas fontes de verdade divergem com o tempo, e o
   agente escolhe a errada.
2. **Perfil expandido** — `openspec config profile` (config global, interativo) e depois
   `openspec update`. Vale pelo `/opsx:verify`, que compara implementação com os artefatos.
3. **Telemetria** — `OPENSPEC_TELEMETRY=0` se te incomodar.

`openspec/config.yaml` está no `syncPaths`; `openspec/changes/` e `openspec/specs/` não —
são do projeto, não do template.

## Checklist antes de publicar uma versão do template

- [ ] `npm run verify:full` passa
- [ ] `./scripts/init.sh --yes` numa cópia limpa produz um projeto que também passa no `verify`
- [ ] Nenhuma referência sobrou aos defaults antigos depois do `init`
- [ ] `harness.json > template` aponta para a URL real do repositório
- [ ] `harnessVersion` foi incrementado com o degrau certo
- [ ] `CLAUDE.md` continua com menos de ~100 linhas
- [ ] Os ADRs continuam refletindo as decisões vigentes
