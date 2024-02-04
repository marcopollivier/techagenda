osArch:=$(shell uname -a)
envfile:=.env.local
ifeq ($(shell test ! -f .env.loical && echo -n yes),yes)
	envfile=env.example
endif

include $(envfile)
export $(shell sed 's/=.*//' $(envfile))
export BRANCH=$(shell git branch --show-current | cut -d '/' -f2)
version:=BRANCH

install-deps:
	@go install github.com/pressly/goose/v3/cmd/goose@latest
	@curl -fsSL "https://github.com/abice/go-enum/releases/download/v0.6.0/go-enum_$(uname -s)_$(uname -m)" -o $(shell go env GOPATH)/bin/go-enum

run:
	@go run main.go

key-gen:
	@go run main.go key-gen

new-migration:
	@go run main.go migrator create $(migration) go

migrate-status:
	@go run main.go migrator status

migrate-up:
	@go run main.go migrator status
	@go run main.go migrator up
