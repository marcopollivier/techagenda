package admin

import "github.com/labstack/echo/v4"

func SetAdminRoutes(server *echo.Echo, handler *AdminHandler) {
	// SSR page — admins and mods can access
	server.GET("/admin", handler.AdminPage)

	// Admin API routes — restricted to admins only
	api := server.Group("/admin/api", AdminOnlyMiddleware)

	// Events
	api.GET("/events/:id", handler.GetEvent)
	api.POST("/events", handler.CreateEvent)
	api.PUT("/events/:id", handler.UpdateEvent)
	api.DELETE("/events/:id", handler.DeleteEvent)

	// Tags
	api.POST("/tags", handler.CreateTag)
	api.DELETE("/tags/:id", handler.DeleteTag)

	// Venues
	api.POST("/venues", handler.CreateVenue)
	api.PUT("/venues/:id", handler.UpdateVenue)
	api.DELETE("/venues/:id", handler.DeleteVenue)

	// Attendees
	api.GET("/events/:id/attendees/cancelled", handler.GetCancelledAttendees)
	api.PUT("/events/:id/attendees/:userId/reactivate", handler.ReactivateAttendee)
	api.DELETE("/events/:id/attendees/:userId", handler.RemoveAttendee)

	// User management — admin only
	userApi := server.Group("/admin/api/users", AdminOnlyMiddleware)
	userApi.GET("", handler.ListUsers)
	userApi.PUT("/:id/role", handler.UpdateUserRole)
}
