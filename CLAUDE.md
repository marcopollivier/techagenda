# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sobre o projeto

Tech Agenda é um agregador open source de eventos de tecnologia (DEV, DEVOPS, PRODUCT, DESIGN, MGMT). Backend em Go que serve uma UI React/TypeScript via **SSR** — não é uma SPA separada; o Go renderiza o React no servidor e devolve HTML.

## Comandos

```bash
make run                      # sobe o serviço (go run main.go) — porta 8000 por padrão
make migrate-up               # roda migrations pendentes (goose)
make migrate-status           # status das migrations
make new-migration migration=nome_da_migration   # cria nova migration .go em ./migrations
make key-gen                  # gera par de chaves ED25519 para o JWT
make install-deps             # instala goose e go-enum (necessário para gerar enums)

go test ./...                 # roda todos os testes
go test ./pkg/event/...       # roda testes de um pacote
go test -run TestNome ./pkg/event/   # roda um único teste

golangci-lint run             # lint (CI usa golangci-lint v2)
go generate ./...             # regenera enums (go-enum) a partir das diretivas //go:generate
```

Postgres local: `docker-compose up -d postgres` (sobe na 5432, auth `trust`). Config vem de variáveis de ambiente — veja `env.example`. O `Makefile` carrega `.env.local` se existir, senão `env.example`.

Dependências de UI: `cd ui && npm install` (ou `yarn`). O `go-react-ssr` cuida do bundling em runtime; não há build separado de frontend em dev.

## Arquitetura

**Injeção de dependência com Uber fx.** `main.go` → `cmd.Execute()` (cobra) → `rootCmd` monta o grafo fx em `cmd/root.go`, registrando cada módulo de `pkg/`. Cada feature em `pkg/<feature>/` expõe um `fx.go` com `Module()` que faz `fx.Provide(...)` dos services/handlers e `fx.Invoke(Router)` para registrar rotas no Echo. **Para adicionar uma feature nova: crie o módulo e registre-o na lista em `cmd/root.go`.**

**Camadas dentro de um pacote** (padrão em `pkg/event`):
- `model.go` — struct GORM + DTOs; embeda `lib/model.Model`
- `service.go` — interface `Service` + implementação com `*gorm.DB`
- `router.go` — registra rotas no `*echo.Echo`
- `fx.go` — `Module()` que amarra tudo
- `*_enum.go` / `model_enum.go` — gerado por `go-enum`

**HTTP**: Echo (`lib/server/http.go`). Sessões em cookie (gorilla/sessions) com payload gzipado. OAuth via `markbates/goth` (`pkg/oauth`); `AuthMiddleware` injeta o usuário no `context.Context`, recuperado com `oauth.GetUserFromCtx(ctx)`.

**SSR (ponto mais importante e não óbvio):**
- Engine em `lib/ssr/ssr.go` (`go-react-ssr`). Frontend em `ui/src`, páginas em `ui/src/pages/*.tsx`.
- Handlers chamam `engine.SafeRenderRoute(...)` passando `File: "pages/X.tsx"` e `Props: &ssr.Props{...}`. `SafeRenderRoute` tem recuperação de panic com cache do último render bom, e injeta `<base href="/">` para assets resolverem em rotas aninhadas (`/events/:id`).
- **Contrato Go↔TS**: a struct `ssr.Props` em `lib/ssr/props.go` é a fronteira de dados. Os tipos TS consumidos pelo React são **gerados** em `ui/src/props/generated.ts` — não edite esse arquivo à mão; ele reflete as structs Go (via `tkrajina/typescriptify`). Ao mudar dados passados para uma página, ajuste `Props` e a struct Go correspondente.
- **IDs como string**: `lib/model.Model` usa `int64` com tags `json:",string"` e `ts_type:"string"` porque IDs de BIGSERIAL podem exceder `Number.MAX_SAFE_INTEGER` do JS. Sempre trate IDs como string no TS e como `int64` no Go.

**Frontend**: React 18 + Tailwind + PrimeReact + Leaflet (mapas de venues). Organização por átomos: `components/` → `molecules/` → `organisms/` → `pages/`.

**Banco**: Postgres via GORM. Migrations em Go com `goose` (`./migrations`, registradas por import em `cmd/migrator.go`). Relações many2many: `events_tags`, `events_venues`. DSN montado em `lib/database.BuildDSN` — usa `DATABASE_URL` se presente, senão monta a partir de campos individuais.

## Convenções

- Logging estruturado com `log/slog`; em handlers use as variantes `*Context` (`slog.ErrorContext(ctx, ...)`).
- `samber/lo` é usado largamente para utilitários funcionais (`lo.Map`, `lo.IsNotEmpty`, etc.).
- Enums Go: anote o tipo com `// ENUM(valor1, valor2)` e a diretiva `//go:generate go-enum --marshal --sql -f model.go` no topo; rode `go generate`.

## Testes

**Regra: toda alteração de código deve vir com teste cobrindo a mudança, ao menos de forma unitária.** Antes de concluir qualquer mudança em `.go`:
1. Verifique se já existe teste cobrindo o comportamento alterado; se não, crie um.
2. Rode `go test ./...` (ou ao menos o pacote afetado) e garanta que passa.
3. Para lógica pura (parsing, validação, regras), teste direto. Para código que depende do banco (services com `*gorm.DB`), use a abordagem de `pkg/event/service_sqli_test.go`: conexão GORM sobre `go-sqlmock` em vez de um Postgres real.
4. Um bom teste deve **falhar** se a mudança for revertida — confirme isso quando o teste guardar uma correção de bug ou de segurança.

A cobertura ainda é inicial (o projeto começou sem testes), então priorize cobrir o que você toca em vez de tentar cobrir tudo de uma vez. O CI roda `go test ./...` em todo push.

## Deploy

Dockerfile multi-stage (Go builder + node para deps de UI). Deploy no Heroku via GitHub Actions (`.github/workflows/`): `on_push` (lint + test), `on_merge_main`, `on_release`. Versão é injetada em build via ldflags em `lib/config.version`.
