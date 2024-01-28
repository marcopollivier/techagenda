package ssr

import (
	"log/slog"

	gossr "github.com/natewong1313/go-react-ssr"

	"github.com/marcopollivier/techagenda/lib/config"
)

type Config struct {
	gossr.Config
}

type Engine struct {
	*gossr.Engine
}

func NewEngine() *Engine {
	cfg := config.Get()

	engine, err := gossr.New(gossr.Config{
		AppEnv:             cfg.Environment,
		AssetRoute:         "/assets",
		FrontendDir:        "./ui/src",
		GeneratedTypesPath: "./ui/src/props/generated.ts",
		TailwindConfigPath: "./ui/tailwind.config.js",
		LayoutCSSFilePath:  "main.css",
		PropsStructsPath:   "lib/ssr/props.go",
	})

	if err != nil {
		slog.Error("Fail to start ssr engine", "error", err.Error())
		panic(err)
	}

	return &Engine{engine}
}
