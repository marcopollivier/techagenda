package event

import "github.com/labstack/echo/v4"

func Router(server *echo.Echo, handler *EventAPI) {
	group := server.Group("/api/events")

	group.GET("", handler.GetEvents)
}
