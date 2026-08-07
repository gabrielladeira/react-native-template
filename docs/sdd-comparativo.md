# SDD: comparativo e recomendação

> **Decidido em ago/2026: OpenSpec.** A decisão e as consequências estão em
> [`adr/0008-openspec-como-framework-de-sdd.md`](adr/0008-openspec-como-framework-de-sdd.md).
> Este documento fica como registro da análise que levou até lá — é o que você vai querer
> reler se um dia precisar reconsiderar.

---

## 1. Por que SDD entra aqui

O `HARNESS.md` deste projeto termina admitindo um buraco:

> **Harness de comportamento.** Testes de contrato e funções puras cobrem parte; falta E2E e uma
> resposta boa para "a IA escreveu o teste *e* o código, quem valida?".

SDD é exatamente a peça que falta desse lado. Na matriz do harness:

| | Computacional | Inferencial |
|---|---|---|
| **Guide** (antes) | tipos, `defineEndpoint`, Zod | `CLAUDE.md`, ADRs, skills, **← a spec entra aqui** |
| **Sensor** (depois) | ESLint, tsc, testes | `code-review` |

A spec é um **guide inferencial de comportamento**: o artefato que diz o que o software deve
fazer, escrito e acordado *antes* do código, e que persiste depois que a janela de contexto morre.
Sem ela, "o que era pra fazer" só existe no histórico do chat — e o agente não tem contra o que
se corrigir.

O que SDD **não** resolve: ele não valida se o código faz o que a spec diz. Isso continua sendo
trabalho dos sensores (testes) e seu. Quem promete que a spec vira verificação automática está
vendendo mais do que entrega.

---

## 2. O risco número um: guides que se contradizem

Todo framework de SDD quer escrever regras de projeto num arquivo próprio — o spec-kit chama de
**constitution**, o Kiro chama de **steering**. Esse arquivo cobre o mesmo terreno que o
`CLAUDE.md` e os ADRs que já existem aqui.

Se você deixar os dois vivos, o agente vai receber duas fontes de verdade parcialmente
divergentes e escolher a errada em algum momento. Esse é o modo de falha que o próprio
`HARNESS.md` lista como sinal de harness apodrecendo.

**Regra para qualquer opção escolhida:** um fato mora em um lugar só.

| Tipo de conhecimento | Onde mora | Por quê |
|---|---|---|
| Regras invioláveis, comandos, camadas | `CLAUDE.md` | já é o ponto de entrada de todo agente |
| Por que uma decisão técnica foi tomada | `docs/adr/` | tem contexto e "quando reconsiderar" |
| Procedimento repetível | `.claude/skills/` | carregado sob demanda |
| **O que esta mudança específica deve fazer** | **spec (SDD)** | é o único vazio hoje |

A "constitution" do framework deve ser **um ponteiro de três linhas** para `CLAUDE.md`, nunca uma
cópia.

---

## 3. Os candidatos

### OpenSpec

CLI em TypeScript (`npm i -g @fission-ai/openspec`, Node ≥ 20.19), MIT, ~52k estrelas,
v1.4.1 em jun/2026. `openspec init` no repo, depois slash commands no agente.

Cada mudança vira uma pasta:

```
openspec/changes/<nome-da-mudanca>/
  proposal.md   por que fazer, o que muda
  specs/        requisitos e cenários (delta, não a spec inteira do sistema)
  design.md     abordagem técnica
  tasks.md      checklist de implementação
```

Fluxo: `/opsx:propose <ideia>` → revisar → `/opsx:apply` → `/opsx:archive` (move para
`archive/` e atualiza as specs vivas).

- **A favor:** setup em minutos, sem Python. Filosofia explícita de "fluido, não rígido" e
  "feito para brownfield". O *spec delta* deixa revisar a intenção em segundos, antes do diff
  grande. Venceu uma avaliação independente de fev/2026 em 13 critérios.
- **Contra:** ecossistema bem menor que o do spec-kit. Depende de um mantenedor pequeno
  (risco de projeto). Telemetria anônima ligada por padrão (`OPENSPEC_TELEMETRY=0` desliga).
- **Sobreposição com este harness:** baixa. Ele quer o `AGENTS.md`, que aqui já é um ponteiro
  curto para o `CLAUDE.md` — encaixa sem conflito.

### GitHub Spec Kit

CLI Python (`uvx --from git+... specify init`), ~106k estrelas, 200+ contribuidores,
30 integrações de agente, 105 extensões, 22 presets. v0.8.7 em mai/2026.

Fluxo completo: `/speckit.constitution` → `specify` → `clarify` → `checklist` → `plan` →
`tasks` → `analyze` → `implement`. Detecta a feature ativa pelo nome do branch git
(`001-nome-da-feature`).

- **A favor:** o mais adotado, com folga — mais material, mais gente resolvendo o mesmo problema
  que você. `/speckit.analyze` (consistência entre spec, plano e tarefas) e `/speckit.checklist`
  são gates que nenhum concorrente tem prontos. Funciona offline e atrás de firewall; dá para
  hospedar catálogo próprio de extensões. Extensões de governança (CI Guard, Architecture Guard)
  conversam bem com a ideia de sensores.
- **Contra:** pesado. Toolchain Python num projeto Node. Muitos gates para um dev solo — e gate
  que você pula por pressa é gate que vira ruído. Setup mais longo.
- **Sobreposição com este harness:** **alta e problemática.** A `constitution` foi desenhada para
  ser o que o `CLAUDE.md` + ADRs já são. Exige disciplina explícita para não duplicar.

### AWS Kiro

IDE spec-first da AWS. Requisitos em notação EARS, doc de design, lista de tarefas com
rastreabilidade requisito→tarefa. Tem *agent hooks* (automações por evento de arquivo).

- **A favor:** rastreabilidade requisito↔tarefa é o melhor do grupo. EARS reduz ambiguidade de
  requisito de forma real.
- **Contra:** você é obrigado a trocar de IDE e fica preso ao perímetro AWS. Descarta na largada,
  porque seu fluxo é Claude Code + este repo — e trocar de ferramenta é um custo maior que o
  ganho.

### BMAD

Sistema multi-agente com papéis (PM, arquiteto, dev, QA). Poderoso e com curva de aprendizado
íngreme.

- **Contra:** orquestração multi-agente é a resposta certa para times grandes com processo
  formal. Para um dev com um harness afiado, o custo de setup e de manutenção não se paga.
  Descartado.

---

## 4. Comparativo

| Critério | OpenSpec | Spec Kit | Kiro | BMAD |
|---|---|---|---|---|
| Custo de setup | minutos | ~30 min + Python | trocar de IDE | dias |
| Toolchain | Node (igual ao projeto) | Python | IDE própria | Node |
| Rigidez do fluxo | fluido, sem gates | gates por fase | fases fixas | papéis + fases |
| Brownfield | desenhado para | funciona | funciona | pesado |
| Conflito com o harness atual | baixo | **alto** (constitution) | alto | alto |
| Lock-in | nenhum | nenhum | AWS + IDE | nenhum |
| Tamanho do ecossistema | médio | **grande** | AWS | pequeno |
| Rastreabilidade req↔tarefa | média | boa (`analyze`) | **melhor** | boa |
| Risco de projeto | mantenedor pequeno | GitHub | AWS | comunidade |

---

## 5. Recomendação: OpenSpec

Três motivos, em ordem de peso:

1. **Sobreposição mínima.** Este repo já tem a camada de regras resolvida e verificada por
   ferramenta. O que falta é só o artefato de intenção por mudança — que é exatamente o escopo
   do OpenSpec. O spec-kit traria junto uma segunda camada de regras que você teria que
   ativamente manter desalinhada de si mesma.
2. **Atrito baixo o bastante para ser usado.** Processo que não é seguido não é processo. Como
   template para vários projetos, "roda `openspec init` e pronto" é adotável; "instala Python,
   configura, passa por sete gates" não é, e você vai acabar pulando etapas — o pior dos mundos,
   porque aí os artefatos existem mas mentem.
3. **Mesmo toolchain.** Node, como o resto. Uma coisa a menos para dar errado no `bootstrap.sh`
   e no CI.

**Quando eu mudaria de ideia:** se aparecer um time (3+ pessoas), ou se auditoria/rastreabilidade
formal virar requisito. Aí `/speckit.analyze`, `/speckit.checklist` e o ecossistema de extensões
de governança do spec-kit passam a valer o peso. A migração é factível: os artefatos dos dois são
Markdown no repo.

### O que muda no repo se você aceitar

```
openspec/                      ← novo, gerado por `openspec init`
  changes/<mudanca>/           proposal.md, specs/, design.md, tasks.md
  changes/archive/             mudanças concluídas
  specs/                       specs vivas do sistema
```

- `CLAUDE.md` ganha uma seção curta: quando usar SDD e quando não (correção de uma linha não
  precisa de spec — SDD para tudo vira teatro).
- `AGENTS.md` continua sendo ponteiro; o OpenSpec escreve nele, então mantenha o ponteiro no topo.
- A skill `code-review` ganha um item: *a mudança corresponde à spec da mudança?* — hoje ela
  pergunta "faz o que foi pedido", que é a mesma pergunta sem artefato para conferir.
- `scripts/bootstrap.sh` ganha `npm i -g @fission-ai/openspec && openspec init`.
- Desligue a telemetria se te incomodar: `export OPENSPEC_TELEMETRY=0`.

### Onde traçar a linha

| Tipo de trabalho | Precisa de spec? |
|---|---|
| Feature nova, mudança de contrato de API, fluxo de usuário | **sim** |
| Refactor com comportamento idêntico | não — o teste já é a spec |
| Correção de bug | não; escreva o teste que falha |
| Ajuste de build, lint, dependência | não |
| Decisão estrutural ("trocar X por Y") | ADR, não spec |

---

## 6. Independente de qual você escolher

- **A spec descreve comportamento, não implementação.** Se ela cita nome de arquivo ou biblioteca,
  virou plano de implementação disfarçado, e vai apodrecer no primeiro refactor.
- **Spec por mudança, não por sistema.** Uma spec gigante do app inteiro nunca fica atualizada.
- **Arquive.** Spec de mudança concluída sai do caminho, senão o agente lê intenção antiga como
  se fosse atual — pior que não ter spec nenhuma.
- **A spec é feedforward, não sensor.** Escrever a spec não prova nada. `npm run verify` continua
  sendo obrigatório, e a suíte de testes continua sendo o que dá ou tira sua confiança.
- **Contexto limpo entre planejar e implementar.** Os dois frameworks recomendam isso, e vale:
  a fase de spec enche a janela de discussão que atrapalha a implementação.

---

## Referências

- [OpenSpec](https://openspec.pro/) · [repositório](https://github.com/Fission-AI/OpenSpec)
- [GitHub Spec Kit](https://github.github.com/spec-kit/) · [metodologia](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- [Kiro (AWS)](https://kiro.dev)
- [9 Best AI Tools for Spec-Driven Development in 2026 — MarkTechPost](https://www.marktechpost.com/2026/05/08/9-best-ai-tools-for-spec-driven-development-in-2026-kiro-bmad-gsd-and-more-compare/)
- [Kiro vs OpenSpec (2026)](https://codemyspec.com/blog/kiro-vs-openspec)
- [Harness engineering — Martin Fowler](https://martinfowler.com/articles/harness-engineering.html)
