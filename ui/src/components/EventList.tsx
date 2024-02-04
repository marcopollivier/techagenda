import { Event } from '../props/generated';
import EventCard from '../organisms/EventCard';
import { Transition } from '@headlessui/react';

interface EventListProps {
    events: Event[]
    loading: boolean
}

export default function EventList({ events, loading }: EventListProps) {

    const numberOfSkeleton = () => {
        return 6 - (events?.length % 6)
    }

    return (
        <div>
            <div className="mx-auto py-8 lg:max-w-none">
                <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
                    {events?.length > 0 ? events.map((event) => (
                        <Transition
                            show={events?.length > 0}
                            enter="transform transition duration-[400ms]"
                            enterFrom="opacity-0 rotate-[-120deg] scale-50"
                            enterTo="opacity-100 rotate-0 scale-100"
                            leave="transform duration-200 transition ease-in-out"
                            leaveFrom="opacity-100 rotate-0 scale-100 "
                            leaveTo="opacity-0 scale-95 "
                        >
                            <EventCard event={event} />
                        </Transition>
                    )) : null}
                    {Array(numberOfSkeleton()).fill(0).map((_) => (
                        <Transition
                            show={loading}
                            enter="transform transition duration-[400ms]"
                            enterFrom="opacity-0 rotate-[-120deg] scale-50"
                            enterTo="opacity-100 rotate-0 scale-100"
                            leave="transform duration-200 transition ease-in-out"
                            leaveFrom="opacity-100 rotate-0 scale-100 "
                            leaveTo="opacity-0 scale-95 "
                        >
                            <EventCard event={null} />
                        </Transition>
                    ))}
                </div>
            </div>
        </div>
    )
}
