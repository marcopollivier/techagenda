package ssr

import (
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/tag"
	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/marcopollivier/techagenda/pkg/venue"
)

type Props struct {
	Environment string
	MainTag     string
	User        *user.User
	Event       *event.Event
	Events      []event.Event
	Tags        []string
	TagsList    []tag.Tag
	Cities      []string
	Venues      []venue.Venue
	Users       []user.User
}
