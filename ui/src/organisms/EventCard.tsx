import { UserGroupIcon } from '@heroicons/react/20/solid';
import { Event } from '../props/generated';
import Moment from 'moment';
import { Skeleton } from 'primereact/skeleton';

interface EventCardProps {
    event: Event | null
}

export default function EventList({ event }: EventCardProps) {

    return (
        <a href={event ? `/events/${event.ID}` : '#'} className="group relative block">
            {event !== null
                ? (<div className="relative flex items-center h-64 w-full overflow-hidden rounded-lg bg-gray-300 group-hover:opacity-75">
                    <img
                        src={event.banner}
                        alt={event.title}
                        className="object-cover w-full h-full"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>)
                : (<Skeleton
                    width="100%"
                    height="16rem"
                    className="relative flex items-center h-64 w-full overflow-hidden rounded-lg bg-gray-300 group-hover:opacity-75"
                />)}
            <div className="mt-2 flex flex-1 items-center justify-between">
                <div>
                    {event !== null
                        ? (<>
                            <p className="text-base font-semibold text-gray-900">{event?.title}</p>
                            <h3 className="text-sm text-gray-500">
                                {Moment(event?.begin)?.format('DD/MM')} - {Moment(event?.end)?.format('DD/MM')}
                            </h3>
                            <h3 className="text-sm text-gray-500">
                                {event?.venues !== null ? event?.venues?.map((venue) => (
                                    <div key={venue.ID}>
                                        {venue?.city}
                                    </div>
                                )) : null}
                            </h3>
                        </>)
                        : (<>
                            <Skeleton width="15rem" className="mb-2" />
                            <Skeleton width="5rem" height=".5rem" />
                            <Skeleton width="8rem" height=".5rem" />
                        </>)}
                </div>
                {event !== null ? (
                    <div className="flex rounded-full bg-gray-200 px-4 py-1 text-center font-medium text-gray-600 text-xs self-start">
                        <UserGroupIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-blue-500" aria-hidden="true" />
                        <span>{event?.attendees?.length}</span>
                    </div>
                ) : (
                    <Skeleton
                        width="3.7rem"
                        height="1.5rem"
                        borderRadius="16px"
                        className="rounded-full bg-gray-200 px-4 py-1 text-center font-medium text-gray-600 text-xs self-start"
                    />
                )}
            </div>
        </a>
    )
}
