package oauth

import "go.uber.org/fx"

func Module() fx.Option {
	return fx.Module("oauth",
		fx.Provide(NewOAuthService),
		fx.Provide(NewOAuthHandler),
		fx.Invoke(SetOAuthAPIRoutes),
	)
}
