import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import NextPageBanner from "../components/NextPageBanner";
import AdBanner from "../components/AdBanner";
import EventList from "../components/EventList";
import { Props, Event as EventType } from "../props/generated";
import { Filters } from '../organisms/FilterButton';
import axios from 'axios';

export default function Lending({ Events, User, MainTag, Tags, Cities }: Props) {

    const [events, setEvents] = useState(Events);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<Filters>({
        name: "",
        city: "",
        available: false,
        type_of: "in_person,online",
        tags: []
    });

    const onFilterChange = async (f: Filters) => {
        setFilters(f);
        const e = await requestEvents(0, f);
        setPage(0);
        setEvents(e);
    }

    const onRequestNewPage = async () => {
        const e = await requestEvents(page + 1, filters);
        setPage(page + 1);
        setEvents(events.concat(e));
    }

    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <Header user={User} currentPage={MainTag} tags={Tags} cities={Cities} onFilterChange={onFilterChange} />
            <EventList events={events} />
            <NextPageBanner onClick={() => onRequestNewPage} />
            <AdBanner />
            <Footer />
        </div>
    );
}

const requestEvents = async (page: number, filters: Filters) => {
    let out: EventType[] = []
    let f: Filters = Object.assign({}, filters);
    f.city = f.city === 'Todas' ? '' : f.city;

    try {
        const resp = await axios.get("/api/events", { params: { "page": page, ...f } });
        out = resp.data
    } catch (e) {
        console.log(e)
    } finally {
        return out
    }
}
