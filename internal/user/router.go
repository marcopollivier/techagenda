package user

import "github.com/labstack/echo/v4"

func SetUserHandlerRoutes(server *echo.Echo, handler *UserHandler) {
	registerProviders()
	auth := server.Group("/auth/:provider")

	auth.GET("", handler.AuthLogin)
	auth.GET("/logout", handler.AuthLogout)
	auth.GET("/callback", handler.AuthCallback)

	grp := server.Group("/users")
	grp.GET("", handler.ListAll)
}
