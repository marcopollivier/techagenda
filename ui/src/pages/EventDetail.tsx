import { useState } from 'react';
import axios from 'axios';
import { Props } from '../props/generated';
import Moment from 'moment';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserGroupIcon, ArrowLeftIcon, MapPinIcon, CalendarIcon, LinkIcon, HandRaisedIcon } from '@heroicons/react/20/solid';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VenueMap from '../components/VenueMap';
import { debugLog } from '../lib/debug';

export default function EventDetail({ Event: event, User: user, Environment: env }: Props) {
    debugLog(env, 'User:', user);
    const isAttending = user && event?.attendees?.some((a) => a.UserID === user.ID);
    const [attending, setAttending] = useState(!!isAttending);
    const [loading, setLoading] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);

    const toggleAttendance = async () => {
        if (!event || loading) return;
        setLoading(true);
        try {
            if (attending) {
                await axios.delete(`/api/events/${event.ID}/attend`);
                setAttending(false);
                window.location.reload();
            } else {
                await axios.post(`/api/events/${event.ID}/attend`);
                setAttending(true);
                window.location.reload();
            }
        } catch (err: any) {
            if (err?.response?.status === 409) {
                setShowReactivateModal(true);
            }
            setLoading(false);
        }
    };

    const handleReactivate = async () => {
        if (!event) return;
        setLoading(true);
        try {
            await axios.put(`/api/events/${event.ID}/attend`);
            setShowReactivateModal(false);
            setAttending(true);
            window.location.reload();
        } catch {
            setLoading(false);
            setShowReactivateModal(false);
        }
    };

    if (!event) {
        return (
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-12">
                <p className="text-gray-500">Evento não encontrado.</p>
                <a href="/" className="text-blue-500 hover:underline mt-4 inline-block">Voltar aos eventos</a>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <Header user={user} showNav={false} />

            {/* Back link */}
            <a href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Voltar aos eventos
            </a>

            {/* Banner */}
            {event.banner && (
                <div className="relative w-full h-72 overflow-hidden rounded-xl bg-gray-200 mb-8">
                    <img
                        src={event.banner}
                        className="object-cover w-full h-full"
                        alt={event.title}
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                </div>
            )}

            {/* Content */}
            <div className="pb-12">
                {/* Title and badges */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <span className="inline-flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {Moment(event.begin).format('DD/MM/YYYY')} - {Moment(event.end).format('DD/MM/YYYY')}
                            </span>
                            {event.attendees && (
                                <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-600">
                                    <UserGroupIcon className="h-4 w-4 mr-1 text-blue-500" />
                                    {event.attendees.length} pessoa{event.attendees.length !== 1 ? 's' : ''} marc{event.attendees.length !== 1 ? 'aram' : 'ou'} esse evento na agenda
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {user && (
                            <button
                                onClick={toggleAttendance}
                                disabled={loading}
                                className={`inline-flex items-center rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                                    attending
                                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <HandRaisedIcon className="h-4 w-4 mr-2" />
                                {attending ? 'Remover da agenda' : 'Adicionar a agenda'}
                            </button>
                        )}
                        {event.href && (
                            <a
                                href={event.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Acessar evento
                            </a>
                        )}
                    </div>
                </div>

                {/* Type badges */}
                {event.type_of && event.type_of.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {event.type_of.map((t) => (
                            <span key={t} className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
                                {t === 'in_person' ? 'Presencial' : t === 'online' ? 'Online' : t}
                            </span>
                        ))}
                    </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {event.tags.map((tag) => (
                            <span key={tag.ID} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                {tag.tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Venues */}
                {event.venues && event.venues.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {event.venues.map((venue) => (
                            <div key={venue.ID} className="inline-flex items-start text-sm text-gray-600">
                                <MapPinIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0 text-gray-400" />
                                <span>
                                    {venue.alias && <strong>{venue.alias} - </strong>}
                                    {venue.address}{venue.city ? `, ${venue.city}` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Venue Map */}
                {event.venues && event.venues.length > 0 && (
                    <VenueMap venues={event.venues} />
                )}

                {/* CFP */}
                {event.cfp && event.cfp.href && (
                    <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-1">Call for Papers</h3>
                        <p className="text-sm text-yellow-700">
                            {Moment(event.cfp.begin).format('DD/MM/YYYY')} - {Moment(event.cfp.end).format('DD/MM/YYYY')}
                        </p>
                        <a
                            href={event.cfp.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-yellow-800 font-medium hover:underline mt-2"
                        >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Submeter proposta
                        </a>
                    </div>
                )}

                {/* Description */}
                {event.description && (
                    <div className="mt-6 text-sm text-gray-700">
                        <article className="prose max-w-none">
                            <Markdown remarkPlugins={[remarkGfm]}>
                                {event.description}
                            </Markdown>
                        </article>
                    </div>
                )}
            </div>

            <Footer />

            {/* Reactivate subscription modal */}
            {showReactivateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowReactivateModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Inscrição cancelada anteriormente</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Você já se inscreveu neste evento anteriormente, mas cancelou sua participação. Deseja reativar sua inscrição?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowReactivateModal(false)}
                                className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReactivate}
                                disabled={loading}
                                className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {loading ? 'Reativando...' : 'Sim, quero participar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
