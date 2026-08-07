# Harness engineering neste projeto

Guia conceitual + mapa do que está montado aqui e por quê.

---

## 1. O conceito

**Agente = Modelo + Harness.** O modelo é a parte que você não controla. O harness é
todo o resto: o que o agente lê antes de agir, o que ele consegue executar, e o que ele
recebe de volta depois de agir.

Existe um harness *interno* (o que a Anthropic/OpenAI embutiu no Claude Code, no Codex —
system prompt, ferramentas, orquestração) e um harness *externo*, que é o seu: as regras,
documentos, scripts e verificações que você coloca no seu repositório.

Harness engineering é a prática de projetar esse harness externo como um sistema, e não
como um punhado de arquivos de configuração acumulados.

### Os dois eixos

Toda peça do harness cai numa célula desta matriz:

|  | **Computacional** (CPU, determinístico, rápido) | **Inferencial** (LLM, semântico, caro) |
|---|---|---|
| **Guide** — feedforward, atua *antes* | tipos do TypeScript, `defineEndpoint`, schemas Zod, alias de import, `theme` | `CLAUDE.md`, `docs/`, ADRs, skills, **specs (OpenSpec)** |
| **Sensor** — feedback, atua *depois* | ESLint, `tsc`, testes, dependency-cruiser, knip, `openspec validate`, CI | skill `code-review`, `/opsx:verify`, review humano |

Duas leituras práticas dessa matriz:

- **Só guides** = um agente que sabe as regras mas nunca descobre se as cumpriu.
- **Só sensors** = um agente que erra, corrige, e erra de novo amanhã.

Você precisa dos dois lados. E, sempre que possível, prefira a coluna computacional: é
barata, roda a cada edição, e não alucina.

### O loop de direção (steering loop)

O papel humano não é revisar cada linha — é **iterar o harness**:

```
o agente erra
      │
      ▼
o erro se repete uma segunda vez?
      │ sim
      ▼
qual controle teria evitado isso?
  ├─ dava para virar regra de lint / teste / tipo?  → sensor computacional
  ├─ era falta de contexto?                          → guide (doc, ADR, skill)
  └─ exige julgamento?                               → item na skill de review
      │
      ▼
o erro fica menos provável na próxima vez
```

A regra prática: **erro repetido é bug do harness, não do agente.**

### Harnessability (ou: "ambient affordances")

Nem todo código é igualmente governável. Um projeto com tipagem forte ganha um sensor de
graça (`tsc`). Um projeto com fronteiras de módulo claras permite regras de arquitetura.
Um projeto onde toda chamada de rede passa por uma única função permite validar contrato
num lugar só.

Isso inverte parte da decisão técnica: **você escolhe a stack também pelo quanto ela é
verificável**, não só pelo quanto ela é agradável de escrever. Foi o critério por trás de
quase todo ADR em `docs/adr/`.

### Três dimensões do que se regula

1. **Manutenibilidade** — qualidade interna. É a mais fácil: já existe ferramenta madura
   (lint, tipos, complexidade, ciclos, código morto).
2. **Fitness arquitetural** — as características não-funcionais: fronteiras de camada,
   performance, observabilidade, segurança. Média dificuldade.
3. **Comportamento** — o app faz a coisa certa? É a mais difícil e a menos resolvida.
   Hoje o estado da arte é: spec como feedforward + suíte de testes como feedback, e
   ainda depende bastante de teste manual e revisão humana. **Não confie apenas em testes
   gerados por IA para validar comportamento.**

Este projeto cobre bem (1) e (2). Em (3) ele te dá a base (testes de contrato, funções
puras isoladas, taxonomia de erro), mas o julgamento continua seu.

---

## 2. O harness deste projeto

### Guides computacionais — restringem o espaço de erro

| Peça | Onde | O que impede |
|---|---|---|
| TypeScript estrito (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | `tsconfig.json` | acesso inseguro, opcionalidade acidental |
| `defineEndpoint` + `call` | `src/shared/api/http.ts` | endpoint sem schema, `fetch` solto, URL concatenada à mão |
| Schemas Zod | `**/model/schemas.ts` | dado externo não validado; tipo e validação dessincronizados |
| `createKvSlot`, `getSecure`, `getDb` | `src/shared/storage/` | escolher a camada de storage errada; token em lugar inseguro |
| `RealtimeClient` | `src/shared/realtime/` | socket sem reconexão, evento sem validação |
| `queryKeys` | `src/shared/query/keys.ts` | key literal solta, invalidação imprevisível |
| `theme` | `src/shared/ui/theme.ts` | cor e espaçamento mágicos |
| `env` validado no boot | `src/shared/config/env.ts` | config errada falhando difuso em runtime |

O padrão comum: **existe exatamente um jeito certo de fazer cada coisa, e ele é o mais
fácil de usar.** Isso é o que reduz variância — tanto de IA quanto de humano.

### Guides inferenciais — dão o contexto que a ferramenta não dá

| Peça | Onde | Papel |
|---|---|---|
| `CLAUDE.md` | raiz | ponto de entrada; curto de propósito |
| `AGENTS.md` | raiz | mesma coisa para agentes que não sejam Claude |
| `docs/architecture.md` | | camadas e fluxo de dados |
| `docs/conventions.md` | | nomes, padrões de erro/loading |
| `docs/testing.md` | | o que testar em cada camada |
| `docs/adr/` | | **por quê** — o que impede a IA de "melhorar" uma decisão deliberada |
| `.claude/skills/*` | | procedimentos carregados sob demanda |
| `openspec/changes/<m>/` | | **o que esta mudança deve fazer** — o guide de comportamento |

**Por que `CLAUDE.md` é curto:** contexto injetado no início compete com a tarefa. Um
`CLAUDE.md` de 400 linhas dilui as regras que importam. O padrão aqui é *just-in-time*:
`CLAUDE.md` tem as 8 regras não negociáveis e diz onde está o resto; skills carregam o
procedimento detalhado só quando a tarefa é daquele tipo.

**Por que ADRs:** sem eles, um agente encontra `RealtimeClient` e "ajuda" trocando por
socket.io. Com o ADR 0004, ele sabe que a escolha foi deliberada e qual é a condição para
reconsiderar. ADR é o antídoto contra churn arquitetural.

### Sensors computacionais — pegam o erro sem intervenção

| Sensor | Comando | Quando roda | Pega |
|---|---|---|---|
| ESLint + boundaries | `npm run lint` | a cada arquivo editado (hook), pre-PR, CI | violação de camada, infra fora do lugar, `any`, promise solta |
| TypeScript | `npm run typecheck` | fim do turno (hook), CI | tudo que o tipo consegue exprimir |
| Jest | `npm test` | pre-PR, CI | regressão de comportamento em funções puras e no contrato HTTP |
| dependency-cruiser | `npm run arch` | pre-PR, CI | ciclo de import, módulo órfão, dep não declarada |
| `openspec validate` | `npm run spec` | pre-PR, CI | spec estruturalmente inválida ou incompleta |
| knip | `npm run deadcode` | CI (não bloqueia) | código morto acumulado |
| expo-doctor | `npm run doctor` | CI (não bloqueia) | drift de versão do SDK |

**O detalhe que mais importa:** as mensagens desses sensores são escritas *para serem lidas
por um agente*. Compare:

```
✗  'react-native-mmkv' import is restricted.

✓  Não use MMKV direto. Importe de "@/shared/storage/kv" para manter um único
   ponto de configuração e permitir mock nos testes.
```

A segunda fecha o loop de auto-correção sozinha. A primeira gera uma rodada de
"onde é que eu importo isso, então?". Isso é o mais barato e mais subestimado do harness:
**mensagem de erro é interface com o agente.**

### Sensors inferenciais

- `.claude/skills/code-review` — julgamento semântico: a mudança corresponde à spec? Tem
  funcionalidade não solicitada? Tem `try/catch` engolindo erro? Schema afrouxado para
  "fazer passar"?
- `/opsx:verify` (OpenSpec, perfil expandido) — compara implementação × artefatos em três
  dimensões: completude (todo requisito tem código?), correção (o código honra a intenção?) e
  coerência (o design descreve o que foi feito?). É o sensor de comportamento.
- Revisão humana — o último sensor, e o mais caro. O harness existe para **direcionar** sua
  atenção para onde ela vale mais, não para eliminá-la.

### Distribuição no tempo ("keep quality left")

```
     agente edita         agente encerra          pre-PR            CI
          │                     │                   │                │
     eslint --fix          tsc --noEmit       npm run verify    verify + drift
     (hook, ~1s)           (hook, ~15s)          (~60s)         (~3min, tudo)
          │                     │                   │                │
     └── auto-correção sem custo humano ──┘   └─ /code-review ─┘  └ humano ┘
```

Quanto mais à esquerda o sensor dispara, mais barato é o conserto — e mais provável que o
próprio agente conserte sozinho, sem gastar seu tempo nem tokens de contexto.

---

## 3. Como evoluir este harness

Quando um erro se repetir, pergunte nesta ordem:

1. **Dá para tornar o erro impossível?** (tipo mais estrito, API mais estreita, função que
   só aceita o formato certo) → melhor opção, custo zero em runtime.
2. **Dá para detectar deterministicamente?** (regra de ESLint, teste, regra de
   dependency-cruiser) → segunda melhor. Escreva a mensagem pensando em quem vai lê-la.
3. **É falta de contexto?** → ADR se for decisão, skill se for procedimento, `docs/` se
   for referência. Cuidado: engordar `CLAUDE.md` é a saída preguiçosa e a que menos funciona.
4. **Exige julgamento?** → item na skill `code-review`.

### Sinais de que o harness está ficando ruim

- `CLAUDE.md` passou de ~100 linhas → provavelmente virou depósito; mova para skills.
- Aparecem `eslint-disable` no diff com frequência → a regra está errada ou o design está.
- Nenhum sensor dispara nunca → ou está tudo ótimo, ou a detecção é inadequada. Teste isso
  de propósito: introduza uma violação e veja se algo pega.
- Guides se contradizem (`CLAUDE.md` diz X, uma skill diz Y) → o agente vai escolher errado.
  Coerência entre guides é responsabilidade de manutenção contínua.
- O `verify` demora tanto que você para de rodar → ele deixou de ser sensor.

### O que ainda falta aqui (honestamente)

- **Harness de comportamento — parcialmente resolvido.** O OpenSpec (ADR 0008) trouxe o lado
  feedforward: a spec agora é um artefato revisável, escrito antes do código e independente
  dele. Do lado do sensor, `/opsx:verify` compara implementação com os artefatos — mas é
  inferencial, então não é prova. **O problema de fundo continua aberto:** a IA escreve a
  spec, o código *e* o teste; se ela entendeu o pedido errado, os três concordam entre si e
  ninguém percebe. É por isso que a revisão humana da spec — antes do `/opsx:apply` — é o
  ponto do fluxo onde a sua atenção rende mais. Falta ainda E2E (Maestro) e vale investigar
  o padrão *approved fixtures*.
- **Sensores de runtime.** Crash rate, latência, logs — hoje nada disso realimenta o ciclo.
  `eas-observe` e Sentry seriam os próximos passos.
- **Teste de mutação.** Mede se os testes realmente detectam quebra, em vez de só cobrir linha.
- **Métrica do próprio harness.** Não existe ainda um "coverage de harness". Na prática:
  anote os erros que você corrigiu à mão; a lista é o backlog do harness.

---

## 4. Referências

- Birgitta Böckeler — [Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html) (martinfowler.com, abr/2026) — a base conceitual deste documento
- Birgitta Böckeler — [Sensors for coding agents](https://martinfowler.com/articles/sensors-for-coding-agents.html) — follow-up prático sobre sensores
- Birgitta Böckeler — [Context engineering for coding agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
- OpenAI — [Harness Engineering](https://openai.com/index/harness-engineering/) — como um time interno faz (linters custom, structural tests, "garbage collection" de drift)
- Anthropic — [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- LangChain — [The anatomy of an agent harness](https://blog.langchain.com/the-anatomy-of-an-agent-harness/)
- Stripe — [Minions: one-shot end-to-end coding agents](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents)
- Thoughtworks — [Architectural fitness function](https://www.thoughtworks.com/radar/techniques/architectural-fitness-function)
- [awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering) — lista viva de ferramentas e padrões
- [expo/skills](https://github.com/expo/skills) — skills oficiais do Expo; instale-as, não reescreva
