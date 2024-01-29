package oauth

import "github.com/labstack/echo/v4"

func SetOAuthAPIRoutes(server *echo.Echo, handler *OAuthHandler) {
	registerProviders()
	server.Use(AuthMiddleware(handler.service))
	auth := server.Group("/auth")

	auth.GET("", handler.AuthLogin)
	auth.GET("/logout", handler.AuthLogout)
	auth.GET("/callback", handler.AuthCallback)
}
