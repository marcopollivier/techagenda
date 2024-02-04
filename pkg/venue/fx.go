package venue

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("venue",
		fx.Provide(NewVenueService),
	)
}
