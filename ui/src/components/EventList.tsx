import { Event } from '../props/generated';
import EventCard from '../organisms/EventCard';
import { Filters } from '../organisms/FilterButton';

interface EventListProps {
    events: Event[]
}

export default function EventList({ events }: EventListProps) {
    return (
        <div>
            <div className="mx-auto py-8 lg:max-w-none">
                <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
                    {events !== null ? events.map((event) => (
                        <EventCard event={event} />
                    )) : null}
                </div>
            </div>
        </div>
    )
}
