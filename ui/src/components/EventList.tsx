import { Event } from '../props/generated';
import EventCard from '../organisms/EventCard';

interface EventListProps {
    events: Event[]
    loading: boolean
}

export default function EventList({ events, loading }: EventListProps) {
    return (
        <div>
            <div className="mx-auto py-8 lg:max-w-none">
                <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
                    {loading
                        ? (
                            <>
                                <EventCard event={null} />
                                <EventCard event={null} />
                                <EventCard event={null} />
                                <EventCard event={null} />
                                <EventCard event={null} />
                                <EventCard event={null} />
                            </>
                        )
                        : (events !== null ? events.map((event) => (<EventCard event={event} />)) : null)
                    }
                </div>
            </div>
        </div>
    )
}
