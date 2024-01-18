package static

import "github.com/labstack/echo/v4"

func Router(server *echo.Echo) {
	server.Static("", "public")
}
