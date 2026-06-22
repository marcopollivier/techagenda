---
description: Regenera os enums Go (go-enum) a partir das diretivas //go:generate
---

Regenere os arquivos de enum do projeto.

1. Garanta que o `go-enum` está instalado (`make install-deps` instala junto com o goose).
2. Rode `go generate ./...` para reprocessar todas as diretivas `//go:generate go-enum`.
3. Os arquivos `*_enum.go` são **gerados — nunca edite à mão**. Para mudar um enum, altere a anotação `// ENUM(...)` acima do tipo no `model.go` correspondente e regenere.
4. Rode `go build ./...` depois para confirmar que nada quebrou.

Lembre que os tipos enum também atravessam a fronteira SSR (Go → TS gerado em `ui/src/props/generated.ts`) quando expostos em `lib/ssr/props.go`.
