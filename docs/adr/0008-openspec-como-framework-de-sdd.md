# 0008 — OpenSpec como framework de spec-driven development

**Status:** Aceito · 2026-08

## Contexto

O `HARNESS.md` deste projeto identifica um buraco explícito: o **harness de comportamento**.
Os sensores computacionais (tipos, lint, fronteiras, testes de contrato) regulam bem
manutenibilidade e fitness arquitetural, mas nada no repo captura *o que a mudança deve fazer*
antes de ela ser feita. Essa intenção vive no histórico do chat e morre com a janela de contexto.

Sem esse artefato, a skill `code-review` pergunta "a mudança faz o que foi pedido?" sem ter
contra o que conferir, e a suíte de testes é escrita pelo mesmo agente que escreveu o código —
com a mesma interpretação, possivelmente errada, do pedido.

Candidatos avaliados em `docs/sdd-comparativo.md`: OpenSpec, GitHub Spec Kit, AWS Kiro, BMAD.

## Decisão

Adotar **OpenSpec** (`@fission-ai/openspec`, MIT) como camada de SDD.

A spec entra no harness como **guide inferencial de comportamento** — o quadrante que estava
vazio. Não substitui nenhum controle existente.

**A regra que sustenta a decisão:** um fato mora em um lugar só.

| Conhecimento | Onde mora |
|---|---|
| Regras invioláveis, comandos, camadas | `CLAUDE.md` |
| Por que uma decisão técnica foi tomada | `docs/adr/` |
| Procedimento repetível | `.claude/skills/` |
| O que **esta mudança** deve fazer | `openspec/changes/<nome>/` |

O `openspec/config.yaml` (contexto de projeto que o OpenSpec injeta nos artefatos) deve
**apontar** para o `CLAUDE.md`, nunca copiá-lo.

## Consequências

- Cada mudança relevante ganha `proposal.md`, `specs/`, `design.md` e `tasks.md` numa pasta
  própria, revisáveis antes do diff grande.
- `openspec validate --all --strict` vira **sensor computacional** no `npm run verify` e no CI
  (via `scripts/spec-validate.sh`, que degrada com aviso se o CLI não estiver instalado — um
  sensor que quebra a máquina de quem não instalou a ferramenta é um sensor que será removido).
- `/opsx:verify` (perfil expandido) compara implementação × artefatos em três dimensões
  (completude, correção, coerência). É o sensor inferencial de comportamento que faltava.
  Recomendado habilitar: `openspec config profile` → `openspec update`.
- A skill `code-review` passa a ter um artefato concreto para conferir aderência.
- Mesmo toolchain do projeto (Node ≥ 20.19). Nada de Python no `bootstrap.sh`.
- **Custo:** mais um passo antes de codar. Mitigado pela regra explícita de quando **não**
  usar spec (bug, refactor sem mudança de comportamento, ajuste de build) — SDD em tudo vira
  teatro e os artefatos passam a mentir.
- **Custo:** dependência de um projeto com mantenedor pequeno. Mitigado porque os artefatos são
  Markdown no repo: se o projeto morrer, as specs continuam legíveis e a migração para
  spec-kit é factível.
- Telemetria anônima é ligada por padrão. `OPENSPEC_TELEMETRY=0` ou `DO_NOT_TRACK=1` desliga.

## Alternativa principal descartada

**GitHub Spec Kit** é maior (~106k estrelas vs ~52k), tem `/speckit.analyze` e
`/speckit.checklist` sem equivalente, e um ecossistema de extensões de governança. Foi
descartado por dois motivos: (1) a `constitution` dele ocupa exatamente o terreno que
`CLAUDE.md` + ADRs já ocupam, criando duas fontes de verdade que divergem com o tempo — o modo
de falha que o `HARNESS.md` lista como sinal de harness apodrecendo; (2) toolchain Python num
projeto Node, e gates demais para um time de uma pessoa. Gate que se pula por pressa é pior que
gate nenhum, porque o artefato existe e mente.

## Quando reconsiderar

- Time de 3+ pessoas, ou rastreabilidade formal (auditoria, regulação) virando requisito: o
  ecossistema de gates e governança do spec-kit passa a valer o peso.
- OpenSpec ficar sem manutenção. Os artefatos são Markdown; a migração é viável.
- Se, depois de dois ou três ciclos, as specs estiverem sendo escritas mas não consultadas —
  aí o problema não é a ferramenta, é o processo, e vale voltar a não ter nenhum.
