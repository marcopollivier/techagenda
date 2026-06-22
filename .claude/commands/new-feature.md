---
description: Cria o scaffold de um novo módulo de feature (padrão fx) em pkg/
---

Crie um novo pacote de feature em `pkg/$ARGUMENTS/` seguindo o padrão existente do projeto (use `pkg/event` como referência). Gere:

1. `model.go` — struct GORM embedando `lib/model.Model` + DTO(s) se necessário. Lembre: IDs são `int64` com `json:",string"` e `ts_type:"string"`.
2. `service.go` — interface `Service` + implementação `<Feature>Service` recebendo `*gorm.DB` via `New<Feature>Service`.
3. `router.go` — `func Router(server *echo.Echo, ...)` registrando rotas sob `/api/$ARGUMENTS`.
4. `fx.go` — `func Module() fx.Option` com `fx.Provide` dos construtores e `fx.Invoke(Router)`.

Depois:
- Registre `$ARGUMENTS.Module()` na lista de módulos em `cmd/root.go`.
- Se a feature precisar passar dados para uma página SSR, adicione os campos em `lib/ssr/props.go`.
- Rode `go build ./...` para validar o grafo fx.

Não invente endpoints ou campos: pergunte o que a feature precisa antes de gerar lógica de negócio. O objetivo deste comando é só o scaffold.
