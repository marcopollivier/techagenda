---
description: Cria uma nova migration goose em ./migrations
---

Crie uma nova migration goose para: $ARGUMENTS

1. Rode `make new-migration migration=<nome_em_snake_case>` para gerar o arquivo `.go` com timestamp em `./migrations`.
2. Implemente as funções `Up` e `Down` no arquivo gerado (migrations são em Go, não SQL puro — veja exemplos existentes em `./migrations`).
3. Garanta que o arquivo seja registrado via import side-effect (o pacote `migrations` é importado em `cmd/migrator.go`).
4. Para testar: `make migrate-status` e depois `make migrate-up` (precisa do Postgres rodando — `docker-compose up -d postgres`).

Sempre implemente o `Down` correspondente ao `Up`.
