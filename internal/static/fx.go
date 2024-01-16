package static

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("static_server",
		fx.Invoke(Router),
	)
}
