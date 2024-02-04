package user

import "github.com/labstack/echo/v4"

func SetUserHandlerRoutes(server *echo.Echo, handler *UserHandler) {
	grp := server.Group("/users")
	grp.GET("", handler.ListAll)
}
