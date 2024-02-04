package event

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("event",
		fx.Provide(NewEventService),
		fx.Provide(NewEventAPI),
		fx.Invoke(Router),
	)
}
