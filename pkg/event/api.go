package event

import (
	"log/slog"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/samber/lo"
)

type EventAPI struct {
	service Service
}

func NewEventAPI(service Service) *EventAPI {
	return &EventAPI{
		service: service,
	}
}

type QueryParams struct {
	Name      string   `query:"name"`
	City      string   `query:"city"`
	Tags      []string `query:"tags"`
	TypeOf    string   `query:"type_of"`
	Available bool     `query:"available"`
	Page      int      `query:"page"`
	Limit     int      `query:"limit"`
}

func (e *EventAPI) GetEvents(c echo.Context) (err error) {
	var (
		ctx         = c.Request().Context()
		qp          QueryParams
		events      []Event
		typeOf      []EventTypeOf
		typeOfSlice []string
	)

	if err = c.Bind(&qp); err != nil {
		slog.ErrorContext(ctx, "Error parsing query params", "error", err.Error())
		return err
	}

	if len(qp.TypeOf) > 0 {
		typeOfSlice = strings.Split(qp.TypeOf, ",")
	}
	typeOf = lo.Map(typeOfSlice, func(i string, _ int) EventTypeOf { o, _ := ParseEventTypeOf(i); return o })
	if events, err = e.service.Get(ctx, qp.Name, qp.City, qp.Tags, typeOf, qp.Available, qp.Page, qp.Limit); err != nil {
		slog.ErrorContext(ctx, "Fail to get events with this query", "error", err.Error(), "query", qp)
		return err
	}

	return c.JSON(200, events)
}
