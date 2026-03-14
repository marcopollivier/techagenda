package lending

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	gossr "github.com/natewong1313/go-react-ssr"
	"github.com/samber/lo"

	"github.com/marcopollivier/techagenda/lib/config"
	"github.com/marcopollivier/techagenda/lib/ssr"
	"github.com/marcopollivier/techagenda/pkg/attendee"
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/oauth"
	"github.com/marcopollivier/techagenda/pkg/tag"
	"github.com/marcopollivier/techagenda/pkg/venue"
)

func NewLendingHandler(server *echo.Echo, eventService event.Service, tagService tag.Service, venueService venue.Service, attendeeService attendee.Service, engine *ssr.Engine) {
	server.Static("/assets", "./ui/public/")
	server.Static("/favicon.ico", "./ui/public/favicon.ico")

	server.GET("/", func(c echo.Context) (err error) {
		var (
			ctx         = c.Request().Context()
			qp          event.QueryParams
			mainTag     = ""
			typeOfSlice []string
		)
		if err = c.Bind(&qp); err != nil {
			slog.ErrorContext(ctx, "Error parsing query params", "error", err.Error())
		}

		if len(qp.Tags) > 0 {
			mainTag = qp.Tags[0]
		}

		if len(qp.TypeOf) > 0 {
			typeOfSlice = strings.Split(qp.TypeOf, ",")
		}
		typeOf := lo.Map(typeOfSlice, func(i string, _ int) event.EventTypeOf {
			o, _ := event.ParseEventTypeOf(i)
			return o
		})

		tags, _ := tagService.GetAllTags(ctx)
		cities, _ := venueService.GetAllCities(ctx)
		events, _ := eventService.Get(ctx, qp.Name, qp.City, qp.Tags, typeOf, qp.Available, qp.Page, qp.Limit)

		page := engine.SafeRenderRoute(gossr.RenderConfig{
			File:  "pages/Lending.tsx",
			Title: "TechAgenda",
			MetaTags: map[string]string{
				"og:title":    "Tech Agenda",
				"description": "A Tech Agenda é um projeto OpenSource que foi criado pensando em ajudar as pessoas a encontrarem eventos de tecnologia perto delas.",
			},
			Props: &ssr.Props{
				Environment: config.Get().Environment,
				MainTag:     mainTag,
				Events:      events,
				User:        oauth.GetUserFromCtx(ctx),
				Tags:        tags,
				Cities:      cities,
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})

	server.GET("/termos", func(c echo.Context) error {
		page := engine.SafeRenderRoute(gossr.RenderConfig{
			File:  "pages/Termos.tsx",
			Title: "Termos de Uso | TechAgenda",
			MetaTags: map[string]string{
				"og:title":    "Termos de Uso",
				"description": "Termos de Uso da plataforma TechAgenda",
			},
			Props: &ssr.Props{
				Environment: config.Get().Environment,
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})

	server.GET("/events/:id", func(c echo.Context) error {
		ctx := c.Request().Context()

		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil {
			return c.Redirect(http.StatusFound, "/")
		}

		ev, err := eventService.GetByID(ctx, id)
		if err != nil {
			slog.ErrorContext(ctx, "Error fetching event", "id", id, "error", err.Error())
			return c.Redirect(http.StatusFound, "/")
		}

		page := engine.SafeRenderRoute(gossr.RenderConfig{
			File:  "pages/EventDetail.tsx",
			Title: ev.Title + " | TechAgenda",
			MetaTags: map[string]string{
				"og:title":    ev.Title,
				"description": ev.Description,
			},
			Props: &ssr.Props{
				Environment: config.Get().Environment,
				Event:       &ev,
				User:        oauth.GetUserFromCtx(ctx),
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})

	server.GET("/profile", func(c echo.Context) error {
		ctx := c.Request().Context()

		u := oauth.GetUserFromCtx(ctx)
		if u == nil {
			return c.Redirect(http.StatusFound, "/")
		}

		attendedEvents, _ := eventService.GetByUserAttendance(ctx, u.ID)

		page := engine.SafeRenderRoute(gossr.RenderConfig{
			File:  "pages/Profile.tsx",
			Title: "Meu Perfil | TechAgenda",
			MetaTags: map[string]string{
				"og:title":    "Meu Perfil",
				"description": "Perfil do usuário no TechAgenda",
			},
			Props: &ssr.Props{
				Environment: config.Get().Environment,
				User:        u,
				Events:      attendedEvents,
			},
		})
		return c.HTML(http.StatusOK, string(page))
	})

	server.POST("/api/events/:id/attend", func(c echo.Context) error {
		ctx := c.Request().Context()
		u := oauth.GetUserFromCtx(ctx)
		if u == nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "login required"})
		}

		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid event id"})
		}

		if err = attendeeService.Add(ctx, id, u.ID, u.Name); err != nil {
			if errors.Is(err, attendee.ErrPreviouslyCancelled) {
				return c.JSON(http.StatusConflict, map[string]string{"error": "previously_cancelled"})
			}
			slog.ErrorContext(ctx, "Error adding attendee", "error", err.Error())
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to register"})
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	server.PUT("/api/events/:id/attend", func(c echo.Context) error {
		ctx := c.Request().Context()
		u := oauth.GetUserFromCtx(ctx)
		if u == nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "login required"})
		}

		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid event id"})
		}

		if err = attendeeService.Reactivate(ctx, id, u.ID); err != nil {
			slog.ErrorContext(ctx, "Error reactivating attendee", "error", err.Error())
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to reactivate"})
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	server.DELETE("/api/events/:id/attend", func(c echo.Context) error {
		ctx := c.Request().Context()
		u := oauth.GetUserFromCtx(ctx)
		if u == nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "login required"})
		}

		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid event id"})
		}

		if err = attendeeService.Remove(ctx, id, u.ID); err != nil {
			slog.ErrorContext(ctx, "Error removing attendee", "error", err.Error())
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to unregister"})
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
}
