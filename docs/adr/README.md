# Architecture Decision Records

Registro curto do **porquê** de cada escolha estrutural. Um agente (ou uma pessoa nova)
que quiser trocar uma biblioteca deve ler o ADR correspondente antes.

Formato: contexto → decisão → consequências → quando reconsiderar.

Para adicionar: crie `NNNN-titulo-em-kebab.md` com o próximo número. ADRs não são
editados depois de aceitos — para mudar de ideia, escreva um novo que **supersede** o antigo.

| # | Decisão | Status |
| --- | --- | --- |
| [0001](0001-expo-como-base.md) | Expo (SDK 57) como base, com dev client | Aceito |
| [0002](0002-estado-servidor-tanstack-query.md) | TanStack Query para estado de servidor | Aceito |
| [0003](0003-zustand-para-estado-de-cliente.md) | Zustand para estado de cliente | Aceito |
| [0004](0004-websocket-encapsulado.md) | WebSocket nativo encapsulado em `RealtimeClient` | Aceito |
| [0005](0005-storage-em-tres-camadas.md) | Storage em três camadas (MMKV / SecureStore / SQLite) | Aceito |
| [0006](0006-zod-na-fronteira.md) | Zod como validação obrigatória em toda fronteira de I/O | Aceito |
| [0007](0007-fatias-verticais.md) | Fatias verticais com fronteiras verificadas por lint | Aceito |
| [0008](0008-openspec-como-framework-de-sdd.md) | OpenSpec como framework de spec-driven development | Aceito |
