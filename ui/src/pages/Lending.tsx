import { useState } from "react";
//import { IndexRouteProps } from "../generated";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MapBanner from "../components/MapBanner";
import AdBanner from "../components/AdBanner";
import EventList from "../components/EventList";
import { Props } from "../props/generated";

function Lending({ Events, User }: Props) {

    const [events, setEvents] = useState(Events);
    const [user, setUser] = useState(User);

    console.log(events)

    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <Header user={user} currentPage="main" />
            <EventList events={events} />
            <MapBanner />
            <AdBanner />
            <Footer />
        </div>
    );
}

export default Lending
