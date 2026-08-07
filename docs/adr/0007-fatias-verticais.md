# 0007 — Fatias verticais com fronteiras verificadas por lint

**Status:** Aceito · 2026-08

## Contexto

A organização clássica por tipo técnico (`components/`, `hooks/`, `services/`) espalha uma
feature por cinco pastas. Para um agente, isso significa mais contexto por tarefa e mais
chance de deixar a mudança pela metade.

## Decisão

Organizar por fatia vertical (`src/features/<feature>/`) com uma camada base compartilhada
(`src/shared/`), e **verificar** a regra de dependência com ferramenta:

- `eslint-plugin-boundaries` — falha o lint em import ilegal, com mensagem que diz o que fazer
- `dependency-cruiser` — pega ciclos e módulos órfãos

Cada feature expõe uma API pública em `index.ts`; o resto é interno.

## Consequências

- Uma tarefa "adicionar X ao chat" tem um raio de alcance conhecido e pequeno.
- A regra é um **sensor computacional**: barata, determinística, roda a cada edição.
  Não depende de a IA (ou o revisor humano) lembrar dela.
- A mensagem de erro do lint é escrita para ser lida por um agente e conter a correção —
  isso fecha o loop de auto-correção sem intervenção humana.
- Código genuinamente comum tem um destino óbvio: `src/shared/`.
- **Custo:** alguma duplicação entre features é aceitável e preferível a acoplamento.

## Quando reconsiderar

Se o app ficar grande a ponto de `src/shared/` virar um depósito, quebre-o em pacotes
de workspace e aplique as mesmas regras entre pacotes.
