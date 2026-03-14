package cfp

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("cfp",
		fx.Provide(NewCfpService),
	)
}
