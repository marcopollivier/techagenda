package user

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("user",
		fx.Provide(NewUserService),
		fx.Provide(NewUserHandler),
		fx.Invoke(SetUserHandlerRoutes),
	)
}

// var Module = fx.Module("server",
//   fx.Provide(
//     New,
//   ),
//   fx.Provide(
//     fx.Private,
//     parseConfig,
//   ),
//   fx.Invoke(startServer),
//   fx.Decorate(wrapLogger),
//
// )
