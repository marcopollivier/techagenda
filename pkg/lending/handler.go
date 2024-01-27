package lending

import (
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	gossr "github.com/natewong1313/go-react-ssr"

	"github.com/marcopollivier/techagenda/lib/ssr"
	"github.com/marcopollivier/techagenda/pkg/event"
)

func NewLendingHandler(server *echo.Echo, eventService event.Service) {
	engine, err := ssr.New("lending", "pkg/lending/props.go")
	if err != nil {
		slog.Error("Fail to start SSR engine", "error", err)
		panic(err)
	}

	server.Static("/assets", "./ui/public/")

	server.GET("/v2", func(c echo.Context) (err error) {
		events, _ := eventService.Get(c.Request().Context(), "", "", []string{}, []event.EventTypeOf{}, false, 0, 50)

		page := engine.RenderRoute(gossr.RenderConfig{
			File:  "pages/Lending.tsx",
			Title: "TechAgenda",
			MetaTags: map[string]string{
				"og:title":    "Tech Agenda",
				"description": "A Tech Agenda é um projeto OpenSource que foi criado pensando em ajudar as pessoas a encontrarem eventos de tecnologia perto delas.",
			},
			Props: &Props{
				Events: events,
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})
}
