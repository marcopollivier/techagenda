import { useState } from 'react';
import { Event } from '../props/generated';
import EventCard from '../organisms/EventCard';

interface EventListProps {
    events: Event[]
}

export default function EventList({ events }: EventListProps) {

    const [eventsState, _] = useState(events);

    return (
        <div>
            <div className="mx-auto py-8 lg:max-w-none">
                <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
                    {eventsState !== null ? eventsState.map((event) => (
                        <EventCard event={event} />
                    )) : null}
                </div>
            </div>
        </div>
    )
}
