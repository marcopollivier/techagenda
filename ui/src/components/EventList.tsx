import { UserGroupIcon } from "@heroicons/react/20/solid"

const event_list = [
    {
        name: 'GopherCon Brasil 2024',
        date: '09/05 - 12/05',
        address: 'Florianospolis, SC',
        imageSrc: 'assets/event_example.png',
        attendees: 104,
        href: '#',
    },
    {
        name: 'GopherCon Brasil 2024',
        date: '09/05 - 12/05',
        address: 'Florianospolis, SC',
        imageSrc: 'assets/event_example.png',
        attendees: 104,
        href: '#',
    },
    {
        name: 'GopherCon Brasil 2024',
        date: '09/05 - 12/05',
        address: 'Florianospolis, SC',
        imageSrc: 'assets/event_example.png',
        attendees: 104,
        href: '#',
    },
    {
        name: 'GopherCon Brasil 2024',
        date: '09/05 - 12/05',
        address: 'Florianospolis, SC',
        imageSrc: 'assets/event_example.png',
        attendees: 104,
        href: '#',
    },
    {
        name: 'GopherCon Brasil 2024',
        date: '09/05 - 12/05',
        address: 'Florianospolis, SC',
        imageSrc: 'assets/event_example.png',
        attendees: 104,
        href: '#',
    },
    {
        name: 'GopherCon Brasil 2024',
        date: '09/05 - 12/05',
        address: 'Florianospolis, SC',
        imageSrc: 'assets/event_example.png',
        attendees: 104,
        href: '#',
    },
]

export default function EventList() {
    return (
        <div>
            <div className="mx-auto py-8 lg:max-w-none">
                <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
                    {event_list.map((event) => (
                        <div key={event.name} className="group relative">
                            <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64">
                                <img
                                    src={event.imageSrc}
                                    className="h-full w-full object-cover object-center"
                                />
                            </div>
                            <div className="mt-2 flex flex-1 items-center justify-between">
                                <div>
                                    <p className="text-base font-semibold text-gray-900">{event.name}</p>
                                    <h3 className="text-sm text-gray-500">
                                        <a href={event.href}>
                                            <span className="absolute inset-0" />
                                            {event.date}
                                        </a>
                                    </h3>
                                    <h3 className="text-sm text-gray-500">
                                        <a href={event.href}>
                                            <span className="absolute inset-0" />
                                            {event.address}
                                        </a>
                                    </h3>
                                </div>
                                <div className="flex rounded-full bg-gray-200 px-4 py-1 text-center font-medium text-gray-600 text-xs self-start">
                                    <UserGroupIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-blue-500" aria-hidden="true" />
                                    <a>{event.attendees}</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
