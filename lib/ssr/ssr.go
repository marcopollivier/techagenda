package ssr

import (
	gossr "github.com/natewong1313/go-react-ssr"

	"github.com/marcopollivier/techagenda/lib/config"
)

type Config struct {
	gossr.Config
}

type Engine struct {
	*gossr.Engine
}

func New(generatedTypesPath, propsStructsPath string) (*Engine, error) {
	cfg := config.Get()

	engine, err := gossr.New(gossr.Config{
		AppEnv:             cfg.Environment,
		AssetRoute:         "/assets",
		FrontendDir:        "./ui/src",
		GeneratedTypesPath: generatedTypesPath,
		TailwindConfigPath: "./ui/tailwind.config.js",
		LayoutCSSFilePath:  "main.css",
		PropsStructsPath:   propsStructsPath,
	})

	return &Engine{engine}, err
}
