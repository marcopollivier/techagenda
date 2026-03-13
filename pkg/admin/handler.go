package admin

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
	"github.com/marcopollivier/techagenda/pkg/attendee"
	"github.com/marcopollivier/techagenda/pkg/cfp"
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/oauth"
	"github.com/marcopollivier/techagenda/pkg/tag"
	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/marcopollivier/techagenda/pkg/venue"
)

type AdminHandler struct {
	eventService    event.Service
	tagService      tag.Service
	venueService    venue.Service
	cfpService      cfp.Service
	userService     user.Service
	attendeeService attendee.Service
	engine          *ssr.Engine
}

func NewAdminHandler(eventService event.Service, tagService tag.Service, venueService venue.Service, cfpService cfp.Service, userService user.Service, attendeeService attendee.Service, engine *ssr.Engine) *AdminHandler {
	return &AdminHandler{
		eventService:    eventService,
		tagService:      tagService,
		venueService:    venueService,
		cfpService:      cfpService,
		userService:     userService,
		attendeeService: attendeeService,
		engine:          engine,
	}
}

// AdminPage renders the admin SSR page
func (h *AdminHandler) AdminPage(c echo.Context) error {
	ctx := c.Request().Context()

	currentUser := oauth.GetUserFromCtx(ctx)
	if currentUser == nil || !currentUser.IsAdmin() {
		return c.Redirect(http.StatusFound, "/")
	}

	events, err := h.eventService.Get(ctx, "", "", nil, nil, false, 0, 100)
	if err != nil {
		slog.ErrorContext(ctx, "Fail to get events for admin page", "error", err.Error())
	}

	tags, _ := h.tagService.GetAllTags(ctx)
	tagsList, _ := h.tagService.GetAll(ctx)
	venues, _ := h.venueService.GetAll(ctx)

	users, _ := h.userService.GetAll(ctx)

	props := &ssr.Props{
		Environment: config.Get().Environment,
		Events:      events,
		User:        currentUser,
		Tags:        tags,
		TagsList:    tagsList,
		Venues:      venues,
		Users:       users,
	}

	page := h.engine.SafeRenderRoute(gossr.RenderConfig{
		File:  "pages/Admin.tsx",
		Title: "TechAgenda - Admin",
		MetaTags: map[string]string{
			"og:title": "Tech Agenda Admin",
		},
		Props: props,
	})
	return c.HTML(http.StatusOK, string(page))
}

// --- Event CRUD ---

type eventRequest struct {
	event.EventDTO
	Tags     []string `json:"tags"`
	VenueIDs []uint   `json:"venue_ids"`
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

func (h *AdminHandler) CreateEvent(c echo.Context) error {
	ctx := c.Request().Context()
	var req eventRequest

	currentUser := oauth.GetUserFromCtx(ctx)

	if err := c.Bind(&req); err != nil {
		slog.ErrorContext(ctx, "Fail to bind event request", "error", err.Error())
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	result, err := h.eventService.Create(ctx, *currentUser, req.EventDTO, req.Tags, req.VenueIDs, req.buildCfp())
	if err != nil {
		slog.ErrorContext(ctx, "Fail to create event", "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	// Reload with preloads for the response
	result, _ = h.eventService.GetByID(ctx, result.ID)
	return c.JSON(http.StatusCreated, result)
}

func (h *AdminHandler) UpdateEvent(c echo.Context) error {
	ctx := c.Request().Context()
	var req eventRequest

	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	if err := c.Bind(&req); err != nil {
		slog.ErrorContext(ctx, "Fail to bind event request", "error", err.Error())
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	result, err := h.eventService.Update(ctx, id, req.EventDTO, req.Tags, req.VenueIDs, req.buildCfp())
	if err != nil {
		slog.ErrorContext(ctx, "Fail to update event", "id", id, "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	result, _ = h.eventService.GetByID(ctx, result.ID)
	return c.JSON(http.StatusOK, result)
}

func (h *AdminHandler) DeleteEvent(c echo.Context) error {
	ctx := c.Request().Context()

	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	if err := h.eventService.Delete(ctx, id); err != nil {
		slog.ErrorContext(ctx, "Fail to delete event", "id", id, "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *AdminHandler) GetEvent(c echo.Context) error {
	ctx := c.Request().Context()

	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	ev, err := h.eventService.GetByID(ctx, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "event not found"})
	}

	return c.JSON(http.StatusOK, ev)
}

// --- Tag CRUD ---

func (h *AdminHandler) CreateTag(c echo.Context) error {
	ctx := c.Request().Context()
	var req struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&req); err != nil || lo.IsEmpty(req.Name) {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
	}
	result, err := h.tagService.Create(ctx, req.Name)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *AdminHandler) DeleteTag(c echo.Context) error {
	ctx := c.Request().Context()
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	if err := h.tagService.Delete(ctx, id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

// --- Venue CRUD ---

func (h *AdminHandler) CreateVenue(c echo.Context) error {
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

func (h *AdminHandler) UpdateVenue(c echo.Context) error {
	ctx := c.Request().Context()
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	var v venue.Venue
	if err := c.Bind(&v); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	result, err := h.venueService.Update(ctx, id, v)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *AdminHandler) DeleteVenue(c echo.Context) error {
	ctx := c.Request().Context()
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	if err := h.venueService.Delete(ctx, id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

// --- User Management ---

func (h *AdminHandler) ListUsers(c echo.Context) error {
	ctx := c.Request().Context()
	users, err := h.userService.GetAll(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, users)
}

func (h *AdminHandler) UpdateUserRole(c echo.Context) error {
	ctx := c.Request().Context()
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	role, err := user.ParseRole(req.Role)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid role: must be user, mod, or admin"})
	}

	if err := h.userService.UpdateRole(ctx, id, role); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
}

// --- Attendee Management ---

func (h *AdminHandler) GetCancelledAttendees(c echo.Context) error {
	ctx := c.Request().Context()

	eventID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid event id"})
	}

	attendees, err := h.attendeeService.GetCancelledByEvent(ctx, uint(eventID))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, attendees)
}

func (h *AdminHandler) ReactivateAttendee(c echo.Context) error {
	ctx := c.Request().Context()

	eventID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid event id"})
	}

	userID, err := strconv.ParseUint(c.Param("userId"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user id"})
	}

	if err := h.attendeeService.Reactivate(ctx, uint(eventID), uint(userID)); err != nil {
		slog.ErrorContext(ctx, "Fail to reactivate attendee", "event_id", eventID, "user_id", userID, "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "reactivated"})
}

func (h *AdminHandler) RemoveAttendee(c echo.Context) error {
	ctx := c.Request().Context()

	eventID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid event id"})
	}

	userID, err := strconv.ParseUint(c.Param("userId"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user id"})
	}

	if err := h.attendeeService.Remove(ctx, uint(eventID), uint(userID)); err != nil {
		slog.ErrorContext(ctx, "Fail to remove attendee", "event_id", eventID, "user_id", userID, "error", err.Error())
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "removed"})
}

// --- Middleware ---

// AdminOnlyMiddleware restricts access to admins only
func AdminOnlyMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := c.Request().Context()
		currentUser := oauth.GetUserFromCtx(ctx)
		if currentUser == nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		}
		if !currentUser.IsAdmin() {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "forbidden"})
		}
		return next(c)
	}
}

// --- Helpers ---

func parseID(c echo.Context) (uint, error) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	return uint(id), err
}
