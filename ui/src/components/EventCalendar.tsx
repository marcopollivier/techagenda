import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import { Event } from '../props/generated';
import Moment from 'moment';

interface EventCalendarProps {
    events: Event[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

/** Check if a date falls within an event's range (begin..end inclusive) */
function eventCoversDate(event: Event, date: Date): boolean {
    const begin = new Date(event.begin as any);
    const end = new Date(event.end as any);
    begin.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d >= begin && d <= end;
}

export default function EventCalendar({ events }: EventCalendarProps) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(year - 1); }
        else setMonth(month - 1);
        setSelectedDate(null);
    };

    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(year + 1); }
        else setMonth(month + 1);
        setSelectedDate(null);
    };

    const goToToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
        setSelectedDate(null);
    };

    // Build a map: day number -> events covering that day
    const dayEventsMap: Record<number, Event[]> = {};
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const matching = events.filter((e) => eventCoversDate(e, date));
        if (matching.length > 0) dayEventsMap[d] = matching;
    }

    const selectedEvents = selectedDate
        ? events.filter((e) => eventCoversDate(e, selectedDate))
        : [];

    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isSelected = (day: number) =>
        selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Calendário de Eventos</h3>
                <div className="flex items-center gap-2">
                    <button onClick={goToToday} className="rounded-full px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                        Hoje
                    </button>
                    <button onClick={prevMonth} className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 w-36 text-center">
                        {MONTHS[month]} {year}
                    </span>
                    <button onClick={nextMonth} className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="px-6 py-4">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                    {WEEKDAYS.map((wd) => (
                        <div key={wd} className="text-center text-xs font-medium text-gray-400 py-1">
                            {wd}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                    {/* Empty cells before first day */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="py-2" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const hasEvents = !!dayEventsMap[day];
                        const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const hasFutureEvent = hasEvents && dayEventsMap[day].some((e) => new Date(e.end as any) >= today);
                        const hasPastEvent = hasEvents && dayEventsMap[day].some((e) => new Date(e.end as any) < today);

                        return (
                            <button
                                key={day}
                                onClick={() => {
                                    if (hasEvents) setSelectedDate(new Date(year, month, day));
                                    else setSelectedDate(null);
                                }}
                                className={`relative flex flex-col items-center py-2 rounded-lg transition text-sm
                                    ${isSelected(day) ? 'bg-blue-500 text-white' : ''}
                                    ${!isSelected(day) && isToday(day) ? 'bg-blue-50 text-blue-600 font-semibold' : ''}
                                    ${!isSelected(day) && !isToday(day) && hasEvents ? 'hover:bg-gray-100 cursor-pointer font-medium text-gray-900' : ''}
                                    ${!isSelected(day) && !isToday(day) && !hasEvents ? 'text-gray-400' : ''}
                                    ${!isSelected(day) && isPast && !hasEvents ? 'text-gray-300' : ''}
                                `}
                            >
                                {day}
                                {hasEvents && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {hasFutureEvent && (
                                            <span className={`block h-1.5 w-1.5 rounded-full ${isSelected(day) ? 'bg-white' : 'bg-blue-500'}`} />
                                        )}
                                        {hasPastEvent && (
                                            <span className={`block h-1.5 w-1.5 rounded-full ${isSelected(day) ? 'bg-blue-200' : 'bg-gray-400'}`} />
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="block h-2 w-2 rounded-full bg-blue-500" />
                        Próximos
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="block h-2 w-2 rounded-full bg-gray-400" />
                        Encerrados
                    </div>
                </div>
            </div>

            {/* Selected day events */}
            {selectedDate && selectedEvents.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-4">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-3">
                        {Moment(selectedDate).format('DD [de] MMMM [de] YYYY')}
                    </p>
                    <div className="space-y-3">
                        {selectedEvents.map((event) => {
                            const isPast = new Date(event.end as any) < today;
                            return (
                                <a
                                    key={event.ID}
                                    href={`/events/${event.ID}`}
                                    className={`block rounded-xl p-3 transition ${isPast ? 'bg-gray-50 hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                                                {isPast && (
                                                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">Encerrado</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="inline-flex items-center">
                                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                                    {Moment(event.begin).format('DD/MM')} - {Moment(event.end).format('DD/MM')}
                                                </span>
                                                {event.venues && event.venues.length > 0 && (
                                                    <span className="inline-flex items-center">
                                                        <MapPinIcon className="h-3 w-3 mr-1" />
                                                        {event.venues.map((v) => v.city || v.alias).filter(Boolean).join(', ')}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center">
                                                    <UserGroupIcon className="h-3 w-3 mr-1" />
                                                    {event.attendees?.length ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
