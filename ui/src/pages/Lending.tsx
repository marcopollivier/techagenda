//import { useState } from "react";
//import { IndexRouteProps } from "../generated";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MapBanner from "../components/MapBanner";
import AdBanner from "../components/AdBanner";
import EventList from "../components/EventList";

function Lending() {
    //const [count, setCount] = useState(initialCount);

    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <Header />
            <EventList />
            <MapBanner />
            <AdBanner />
            <Footer />
        </div>
    );
}

export default Lending
