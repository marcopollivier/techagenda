package ssr

import (
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/user"
)

type Props struct {
	MainTag string
	User    *user.User
	Event   *event.Event
	Events  []event.Event
	Tags    []string
	Cities  []string
}
