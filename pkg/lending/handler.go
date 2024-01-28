package lending

import (
	"net/http"

	"github.com/labstack/echo/v4"
	gossr "github.com/natewong1313/go-react-ssr"

	"github.com/marcopollivier/techagenda/lib/ssr"
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/user"
)

func NewLendingHandler(server *echo.Echo, eventService event.Service, engine *ssr.Engine) {
	server.Static("/assets", "./ui/public/")

	server.GET("/v2", func(c echo.Context) (err error) {
		var userPtr *user.User
		events, _ := eventService.Get(c.Request().Context(), "", "", []string{}, []event.EventTypeOf{}, false, 0, 50)
		if userData, ok := c.Request().Context().Value(user.MiddlewareUserKey).(user.User); ok {
			userPtr = &userData
		}

		page := engine.RenderRoute(gossr.RenderConfig{
			File:  "pages/Lending.tsx",
			Title: "TechAgenda",
			MetaTags: map[string]string{
				"og:title":    "Tech Agenda",
				"description": "A Tech Agenda é um projeto OpenSource que foi criado pensando em ajudar as pessoas a encontrarem eventos de tecnologia perto delas.",
			},
			Props: &ssr.Props{
				Events: events,
				User:   userPtr,
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})
}
