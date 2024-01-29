package lending

import (
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	gossr "github.com/natewong1313/go-react-ssr"

	"github.com/marcopollivier/techagenda/lib/ssr"
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/user"
)

type QueryParams struct {
	Name      string              `query:"name"`
	City      string              `query:"city"`
	Tags      []string            `query:"tags"`
	TypeOf    []event.EventTypeOf `query:"type_of"`
	Available bool                `query:"available"`
	Page      int                 `query:"page"`
	Limit     int                 `query:"limit"`
}

func NewLendingHandler(server *echo.Echo, eventService event.Service, engine *ssr.Engine) {
	server.Static("/assets", "./ui/public/")

	server.GET("/v2", func(c echo.Context) (err error) {
		var (
			ctx = c.Request().Context()
			qp  QueryParams
		)
		if err = c.Bind(&qp); err != nil {
			slog.ErrorContext(ctx, "Error parsing query params", "error", err.Error())
		}

		events, _ := eventService.Get(ctx, qp.Name, qp.City, qp.Tags, qp.TypeOf, qp.Available, qp.Page, qp.Limit)

		page := engine.RenderRoute(gossr.RenderConfig{
			File:  "pages/Lending.tsx",
			Title: "TechAgenda",
			MetaTags: map[string]string{
				"og:title":    "Tech Agenda",
				"description": "A Tech Agenda é um projeto OpenSource que foi criado pensando em ajudar as pessoas a encontrarem eventos de tecnologia perto delas.",
			},
			Props: &ssr.Props{
				Events: events,
				User:   user.GetUserFromCtx(ctx),
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})
}
