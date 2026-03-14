package manage

import (
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	gossr "github.com/natewong1313/go-react-ssr"
	"github.com/samber/lo"

	"github.com/marcopollivier/techagenda/lib/config"
	"github.com/marcopollivier/techagenda/lib/ssr"
	"github.com/marcopollivier/techagenda/pkg/cfp"
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/oauth"
	"github.com/marcopollivier/techagenda/pkg/tag"
	"github.com/marcopollivier/techagenda/pkg/venue"
)

type ManageHandler struct {
	eventService event.Service
	tagService   tag.Service
	venueService venue.Service
	cfpService   cfp.Service
	engine       *ssr.Engine
}

func NewManageHandler(eventService event.Service, tagService tag.Service, venueService venue.Service, cfpService cfp.Service, engine *ssr.Engine) *ManageHandler {
	return &ManageHandler{
		eventService: eventService,
		tagService:   tagService,
		venueService: venueService,
		cfpService:   cfpService,
		engine:       engine,
	}
}

// ManagePage renders the event management SSR page
func (h *ManageHandler) ManagePage(c echo.Context) error {
	ctx := c.Request().Context()

	currentUser := oauth.GetUserFromCtx(ctx)
	if currentUser == nil || (!currentUser.IsAdmin() && !currentUser.IsMod()) {
		return c.Redirect(http.StatusFound, "/")
	}

	events, err := h.eventService.GetByCreator(ctx, currentUser.ID)
	if err != nil {
		slog.ErrorContext(ctx, "Fail to get events for manage page", "error", err.Error())
	}

	tags, _ := h.tagService.GetAllTags(ctx)
	tagsList, _ := h.tagService.GetAll(ctx)
	venues, _ := h.venueService.GetAll(ctx)

	props := &ssr.Props{
		Environment: config.Get().Environment,
		Events:      events,
		User:        currentUser,
		Tags:        tags,
		TagsList:    tagsList,
		Venues:      venues,
	}

	page := h.engine.SafeRenderRoute(gossr.RenderConfig{
		File:  "pages/Manage.tsx",
		Title: "TechAgenda - Gerenciar Eventos",
		MetaTags: map[string]string{
			"og:title": "Tech Agenda - Event Manager",
		},
		Props: props,
	})
	return c.HTML(http.StatusOK, string(page))
}

// --- Event CRUD (ownership-scoped) ---

type eventRequest struct {
	event.EventDTO
	Tags     []string `json:"tags"`
	VenueIDs []string `json:"venue_ids"`
	CfpHref  string   `json:"cfp_href"`
	CfpBegin string   `json:"cfp_begin"`
	CfpEnd   string   `json:"cfp_end"`
}

func (r *eventRequest) buildCfp() *cfp.Cfp {
	if lo.IsEmpty(r.CfpHref) {
		return nil
	}
	beginDate, _ := time.Parse(time.RFC3339, r.CfpBegin)
	endDate, _ := time.Parse(time.RFC3339, r.CfpEnd)
	return &cfp.Cfp{
		Href:      r.CfpHref,
		BeginDate: beginDate,
		EndDate:   endDate,
	}
}

func (h *ManageHandler) CreateEvent(c echo.Context) error {
	ctx := c.Request().Context()
	var req eventRequest

	currentUser := oauth.GetUserFromCtx(ctx)
	if currentUser == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	if err := c.Bind(&req); err != nil {
		slog.ErrorContext(ctx, "Fail to bind event request", "error", err.Error())
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	venueIDs, err := parseVenueIDs(req.VenueIDs)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid venue_id"})
	}

	result, err := h.eventService.Create(ctx, *currentUser, req.EventDTO, req.Tags, venueIDs, req.buildCfp())
	if err != nil {
		slog.ErrorContext(ctx, "Fail to create event", "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	result, _ = h.eventService.GetByID(ctx, result.ID)
	return c.JSON(http.StatusCreated, result)
}

func (h *ManageHandler) UpdateEvent(c echo.Context) error {
	ctx := c.Request().Context()
	var req eventRequest

	currentUser := oauth.GetUserFromCtx(ctx)
	if currentUser == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	// Ownership check
	ev, err := h.eventService.GetByID(ctx, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "event not found"})
	}
	if ev.UserID != currentUser.ID {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "you can only edit your own events"})
	}

	if err := c.Bind(&req); err != nil {
		slog.ErrorContext(ctx, "Fail to bind event request", "error", err.Error())
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	venueIDs, verr := parseVenueIDs(req.VenueIDs)
	if verr != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid venue_id"})
	}

	result, err := h.eventService.Update(ctx, id, req.EventDTO, req.Tags, venueIDs, req.buildCfp())
	if err != nil {
		slog.ErrorContext(ctx, "Fail to update event", "id", id, "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	result, _ = h.eventService.GetByID(ctx, result.ID)
	return c.JSON(http.StatusOK, result)
}

func (h *ManageHandler) DeleteEvent(c echo.Context) error {
	ctx := c.Request().Context()

	currentUser := oauth.GetUserFromCtx(ctx)
	if currentUser == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	// Ownership check
	ev, err := h.eventService.GetByID(ctx, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "event not found"})
	}
	if ev.UserID != currentUser.ID {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "you can only delete your own events"})
	}

	if err := h.eventService.Delete(ctx, id); err != nil {
		slog.ErrorContext(ctx, "Fail to delete event", "id", id, "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *ManageHandler) GetEvent(c echo.Context) error {
	ctx := c.Request().Context()

	currentUser := oauth.GetUserFromCtx(ctx)
	if currentUser == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	ev, err := h.eventService.GetByID(ctx, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "event not found"})
	}
	if ev.UserID != currentUser.ID {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "you can only view your own events"})
	}

	return c.JSON(http.StatusOK, ev)
}

// --- Venue endpoints ---

func (h *ManageHandler) CreateVenue(c echo.Context) error {
	ctx := c.Request().Context()
	var v venue.Venue
	if err := c.Bind(&v); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	result, err := h.venueService.Create(ctx, v)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *ManageHandler) GetVenues(c echo.Context) error {
	ctx := c.Request().Context()
	venues, err := h.venueService.GetAll(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, venues)
}

// --- Middleware ---

// ModMiddleware allows both admins and mods
func ModMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := c.Request().Context()
		currentUser := oauth.GetUserFromCtx(ctx)
		if currentUser == nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		}
		if !currentUser.IsAdmin() && !currentUser.IsMod() {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "forbidden"})
		}
		return next(c)
	}
}

// --- Helpers ---

func parseID(c echo.Context) (int64, error) {
	return strconv.ParseInt(c.Param("id"), 10, 64)
}

func parseVenueIDs(raw []string) ([]int64, error) {
	result := make([]int64, len(raw))
	for i, v := range raw {
		parsed, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return nil, err
		}
		result[i] = parsed
	}
	return result, nil
}
