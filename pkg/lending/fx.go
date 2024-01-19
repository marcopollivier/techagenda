package lending

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("lending",
		fx.Invoke(NewLendingHandler),
	)
}
