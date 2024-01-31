package tag

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("tags",
		fx.Provide(NewTagsService),
	)
}
