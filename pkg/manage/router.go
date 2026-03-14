package manage

import "github.com/labstack/echo/v4"

func SetManageRoutes(server *echo.Echo, handler *ManageHandler) {
	// SSR page — admins and mods can access
	server.GET("/manage", handler.ManagePage)

	// Manage API routes — protected by mod middleware (admins + mods)
	api := server.Group("/manage/api", ModMiddleware)

	// Events (ownership-scoped)
	api.GET("/events/:id", handler.GetEvent)
	api.POST("/events", handler.CreateEvent)
	api.PUT("/events/:id", handler.UpdateEvent)
	api.DELETE("/events/:id", handler.DeleteEvent)

	// Venues
	api.POST("/venues", handler.CreateVenue)
	api.GET("/venues", handler.GetVenues)
}
