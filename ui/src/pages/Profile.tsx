import { Props } from '../props/generated';
import Moment from 'moment';
import { UserGroupIcon, CalendarIcon, MapPinIcon, ArrowLeftIcon } from '@heroicons/react/20/solid';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EventCalendar from '../components/EventCalendar';
import { debugLog } from '../lib/debug';

export default function Profile({ User: user, Events: events, Environment: env }: Props) {
    debugLog(env, 'User:', user);

    if (!user) {
        return (
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-12">
                <p className="text-gray-500">Você precisa estar logado para ver seu perfil.</p>
                <a href="/" className="text-blue-500 hover:underline mt-4 inline-block">Voltar</a>
            </div>
        );
    }

    const attendedEvents = events ?? [];

    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <Header user={user} showNav={false} />

            <a href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Voltar aos eventos
            </a>

            {/* User info */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                <div className="flex items-center gap-5">
                    {user.Avatar && (
                        <img
                            src={user.Avatar}
                            alt={user.Name}
                            className="h-20 w-20 rounded-full bg-gray-200"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.Name}</h1>
                        {user.Email && (
                            <p className="text-sm text-gray-500 mt-0.5">{user.Email}</p>
                        )}
                        {user.Bio && (
                            <p className="text-sm text-gray-600 mt-2">{user.Bio}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Calendar */}
            {attendedEvents.length > 0 && (
                <div className="mb-8">
                    <EventCalendar events={attendedEvents} />
                </div>
            )}

            {/* Attended events */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Eventos que pretendo participar
                    <span className="ml-2 text-sm font-normal text-gray-400">({attendedEvents.length})</span>
                </h2>

                {attendedEvents.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                        <UserGroupIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Você ainda não se inscreveu em nenhum evento.</p>
                        <a href="/" className="text-blue-500 hover:underline text-sm mt-2 inline-block">Explorar eventos</a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {attendedEvents.map((event) => {
                            const isPast = new Date(event.end as any) < new Date();
                            return (
                                <a
                                    key={event.ID}
                                    href={`/events/${event.ID}`}
                                    className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
                                >
                                    <div className="flex">
                                        {event.banner && (
                                            <div className="w-40 h-28 flex-shrink-0 bg-gray-200">
                                                <img
                                                    src={event.banner}
                                                    alt={event.title}
                                                    className="object-cover w-full h-full"
                                                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 p-4 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                                                    {isPast && (
                                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Encerrado</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                    <span className="inline-flex items-center">
                                                        <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                                        {Moment(event.begin).format('DD/MM/YYYY')} - {Moment(event.end).format('DD/MM/YYYY')}
                                                    </span>
                                                    {event.venues && event.venues.length > 0 && (
                                                        <span className="inline-flex items-center">
                                                            <MapPinIcon className="h-3.5 w-3.5 mr-1" />
                                                            {event.venues.map((v) => v.city || v.alias).filter(Boolean).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                                {event.tags && event.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-1.5">
                                                        {event.tags.map((t) => (
                                                            <span key={t.ID} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                                {t.tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-4">
                                                <UserGroupIcon className="h-4 w-4 text-blue-500" />
                                                <span>{event.attendees?.length ?? 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
