package lending

import (
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	gossr "github.com/natewong1313/go-react-ssr"

	"github.com/marcopollivier/techagenda/lib/ssr"
)

func NewLendingHandler(server *echo.Echo) {
	engine, err := ssr.New("./ui/generated_props.lending.ts", "pkg/lending/props.go")
	if err != nil {
		slog.Error("Fail to start SSR engine", "error", err)
		panic(err)
	}

	server.Static("/assets", "./ui/public/")

	server.GET("/v2", func(c echo.Context) (err error) {
		page := engine.RenderRoute(gossr.RenderConfig{
			File:  "pages/Lending.tsx",
			Title: "TechAgenda",
			MetaTags: map[string]string{
				"og:title":    "TechAgenda",
				"description": "A Tech Agenda é um projeto OpenSource que foi criado pensando em ajudar as pessoas a encontrarem eventos de tecnologia perto delas.",
			},
			Props: &IndexRouteProps{
				InitialCount: 171,
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})
}
