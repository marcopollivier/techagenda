package manage

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("manage",
		fx.Provide(NewManageHandler),
		fx.Invoke(SetManageRoutes),
	)
}
