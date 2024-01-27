import { useState } from 'react';
import { UserGroupIcon } from '@heroicons/react/20/solid';
import { Event } from '../props/lending.generated';
import EventModal from './EventModal';
import Moment from 'moment';

interface EventCardProps {
    event: Event
}

export default function EventList({ event }: EventCardProps) {

    const [openDetails, setOpenDetails] = useState(false);

    return (
        <>
            <EventModal event={event} openDetails={openDetails} onClose={() => { setOpenDetails(false) }} />
            <div key={event.title} className="group relative" onClick={() => { setOpenDetails(true) }}>
                <div className="relative flex items-center h-80 sm:h-64 w-full overflow-hidden rounded-lg bg-gray-300 group-hover:opacity-75">
                    <img src={event.banner} />
                </div>
                <div className="mt-2 flex flex-1 items-center justify-between">
                    <div>
                        <p className="text-base font-semibold text-gray-900">{event.title}</p>
                        <h3 className="text-sm text-gray-500">
                            <a>
                                <span className="absolute inset-0" />
                                {Moment(event.begin)?.format('DD/MM')} - {Moment(event.end)?.format('DD/MM')}
                            </a>
                        </h3>
                        <h3 className="text-sm text-gray-500">
                            {event.venues !== null ? event.venues?.map((venue) => (
                                <div>
                                    <a>
                                        <span className="absolute inset-0" />
                                        {venue.city}
                                    </a>
                                </div>
                            )) : null}
                        </h3>
                    </div>
                    {event?.attendees !== null ? (
                        <div className="flex rounded-full bg-gray-200 px-4 py-1 text-center font-medium text-gray-600 text-xs self-start">
                            <UserGroupIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-blue-500" aria-hidden="true" />
                            <a>{event?.attendees?.length}</a>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    )
}
