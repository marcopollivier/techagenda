package ssr

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("ssr_engine",
		fx.Provide(NewEngine),
	)
}
