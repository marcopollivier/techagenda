package ssr

import (
	"bytes"
	"fmt"
	"log/slog"
	"runtime/debug"
	"sync"

	gossr "github.com/natewong1313/go-react-ssr"

	"github.com/marcopollivier/techagenda/lib/config"
)

type Config struct {
	gossr.Config
}

type Engine struct {
	*gossr.Engine
	lastRender sync.Map
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

	return &Engine{Engine: engine}
}

// SafeRenderRoute wraps RenderRoute with panic recovery.
// On success it caches the result; on panic it returns the last-good render or a generic error page.
func (e *Engine) SafeRenderRoute(config gossr.RenderConfig) (result []byte) {
	panicked := true
	defer func() {
		if r := recover(); r != nil || panicked {
			slog.Error("SSR render panic", "file", config.File, "error", fmt.Sprint(r), "stack", string(debug.Stack()))
			if cached, ok := e.lastRender.Load(config.File); ok {
				result = cached.([]byte)
				return
			}
			result = []byte("<html><body><h1>Rendering error</h1><p>Please try again.</p></body></html>")
		}
	}()
	result = e.RenderRoute(config)
	panicked = false
	// Inject <base href="/"> so relative asset paths (./assets/...) resolve
	// correctly on nested routes like /events/:id
	result = injectBaseHref(result)
	e.lastRender.Store(config.File, result)
	return result
}

var headTag = []byte("<head>")
var baseTag = []byte("<head>\n\t<base href=\"/\" />")

func injectBaseHref(html []byte) []byte {
	return bytes.Replace(html, headTag, baseTag, 1)
}
