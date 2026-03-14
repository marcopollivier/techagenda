import { useState, useEffect } from 'react';
import { Venue } from '../props/generated';

interface VenueMapProps {
    venues: Venue[];
}

interface ParsedVenue {
    venue: Venue;
    lat: number;
    lng: number;
}

function parseVenues(venues: Venue[]): ParsedVenue[] {
    return venues
        .filter((v) => v.lat && v.long)
        .map((v) => ({ venue: v, lat: parseFloat(v.lat), lng: parseFloat(v.long) }))
        .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
}

export default function VenueMap({ venues }: VenueMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load Leaflet CSS from CDN to avoid esbuild issues with relative image paths
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        setMounted(true);
    }, []);

    const parsed = parseVenues(venues ?? []);

    if (parsed.length === 0 || !mounted) {
        return null;
    }

    // Dynamic require to avoid SSR crash (leaflet needs window/document)
    const L = require('leaflet');
    const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');

    // Fix Leaflet default marker icon (known bundler issue) — use CDN URLs
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const center: [number, number] = [parsed[0].lat, parsed[0].lng];

    return (
        <div className="h-64 w-full rounded-xl overflow-hidden mb-6">
            <MapContainer
                center={center}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {parsed.map((p) => (
                    <Marker key={p.venue.ID} position={[p.lat, p.lng]}>
                        <Popup>
                            {p.venue.alias && <strong>{p.venue.alias}</strong>}
                            {p.venue.alias && <br />}
                            {p.venue.address}
                            {p.venue.city && `, ${p.venue.city}`}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
